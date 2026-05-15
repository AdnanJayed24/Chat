import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { createMessage, markMessagesRead, toggleReaction } from '../services/chat.service';
import { getAiUserId, streamAiResponse } from '../services/ai.service';
import { prisma } from '../db';

interface AuthSocket extends Socket {
  userId: string;
  userName: string;
}

export const setupSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('No token'));
    try {
      const payload = verifyToken(token);
      (socket as AuthSocket).userId = payload.userId;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const s = socket as AuthSocket;

    try {
      const user = await prisma.user.findUnique({
        where: { id: s.userId },
        select: { name: true },
      });
      s.userName = user?.name ?? 'Unknown';
    } catch {
      s.userName = 'Unknown';
    }

    socket.broadcast.emit('user_online', { userId: s.userId });

    socket.on('join_chat', async ({ chatId }: { chatId: string }) => {
      socket.join(chatId);
      const messageIds = await markMessagesRead(chatId, s.userId).catch(() => []);
      if (messageIds.length > 0) {
        io.to(chatId).emit('messages_read', { userId: s.userId, messageIds, chatId });
      }
    });

    socket.on('leave_chat', ({ chatId }: { chatId: string }) => {
      socket.leave(chatId);
    });

    socket.on('mark_read', async ({ chatId }: { chatId: string }) => {
      const messageIds = await markMessagesRead(chatId, s.userId).catch(() => []);
      if (messageIds.length > 0) {
        io.to(chatId).emit('messages_read', { userId: s.userId, messageIds, chatId });
      }
    });

    socket.on('send_message', async ({ chatId, content }: { chatId: string; content: string }) => {
      if (!content?.trim()) return;
      try {
        const message = await createMessage(chatId, s.userId, content.trim());
        io.to(chatId).emit('message_received', message);

        const aiUserId = getAiUserId();
        if (!aiUserId) return;

        const aiMember = await prisma.chatMember.findFirst({
          where: { chatId, userId: aiUserId },
        });
        if (!aiMember) return;

        const history = await prisma.message.findMany({
          where: { chatId },
          orderBy: { createdAt: 'asc' },
          select: { content: true, senderId: true },
        });

        const aiMessages = history.map((m) => ({
          role: m.senderId === aiUserId ? ('assistant' as const) : ('user' as const),
          content: m.content,
        }));

        try {
          const fullText = await streamAiResponse(aiMessages, (accumulated) => {
            io.to(chatId).emit('ai_stream', { chatId, content: accumulated });
          });
          const aiMessage = await createMessage(chatId, aiUserId, fullText);
          io.to(chatId).emit('message_received', aiMessage);
        } catch (err) {
          console.error('[AI stream error]', err);
          const errMsg = await createMessage(chatId, aiUserId, "Sorry, I'm having trouble right now. Please try again.");
          io.to(chatId).emit('message_received', errMsg);
        }
      } catch {
        socket.emit('socket_error', { message: 'Failed to send message' });
      }
    });

    socket.on('react', async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      try {
        const result = await toggleReaction(messageId, s.userId, emoji);
        if (result) {
          io.to(result.chatId).emit('reaction_updated', {
            messageId,
            reactions: result.reactions,
          });
        }
      } catch {
        socket.emit('socket_error', { message: 'Failed to add reaction' });
      }
    });

    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    socket.on('typing_start', ({ chatId }: { chatId: string }) => {
      socket.to(chatId).emit('user_typing', { userId: s.userId, userName: s.userName, chatId });

      if (typingTimers.has(chatId)) clearTimeout(typingTimers.get(chatId)!);
      typingTimers.set(
        chatId,
        setTimeout(() => {
          socket.to(chatId).emit('user_stop_typing', { userId: s.userId, chatId });
          typingTimers.delete(chatId);
        }, 3000)
      );
    });

    socket.on('typing_stop', ({ chatId }: { chatId: string }) => {
      if (typingTimers.has(chatId)) {
        clearTimeout(typingTimers.get(chatId)!);
        typingTimers.delete(chatId);
      }
      socket.to(chatId).emit('user_stop_typing', { userId: s.userId, chatId });
    });

    socket.on('disconnect', async () => {
      typingTimers.forEach((timer) => clearTimeout(timer));
      socket.broadcast.emit('user_offline', { userId: s.userId });
      await prisma.user
        .update({ where: { id: s.userId }, data: { lastSeen: new Date() } })
        .catch(() => {});
    });
  });
};
