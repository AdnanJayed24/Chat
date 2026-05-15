import { prisma } from '../db';
import { ApiError } from '../utils/ApiError';
import { getAiUserId } from './ai.service';

const memberInclude = {
  members: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
};

const lastMessageInclude = {
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: { sender: { select: { id: true, name: true } } },
  },
};

const messageInclude = {
  sender: { select: { id: true, name: true } },
  reads: { select: { userId: true, readAt: true } },
  reactions: { select: { userId: true, emoji: true } },
};

export const getOrCreateDirectChat = async (userId: string, targetEmail: string) => {
  const target = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, name: true, email: true },
  });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.id === userId) throw new ApiError(400, 'Cannot chat with yourself');

  const existing = await prisma.chat.findFirst({
    where: {
      isGroup: false,
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: target.id } } },
      ],
    },
    include: { ...memberInclude, ...lastMessageInclude },
  });

  if (existing) return existing;

  return prisma.chat.create({
    data: {
      isGroup: false,
      members: { create: [{ userId }, { userId: target.id }] },
    },
    include: { ...memberInclude, ...lastMessageInclude },
  });
};

export const getUserChats = async (userId: string) => {
  const [chats, unreadGroups] = await Promise.all([
    prisma.chat.findMany({
      where: { members: { some: { userId } } },
      include: { ...memberInclude, ...lastMessageInclude },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.message.groupBy({
      by: ['chatId'],
      where: {
        chat: { members: { some: { userId } } },
        senderId: { not: userId },
        reads: { none: { userId } },
      },
      _count: true,
    }),
  ]);

  const countMap = new Map(unreadGroups.map(({ chatId, _count }) => [chatId, _count]));
  return chats.map((c) => ({ ...c, unreadCount: countMap.get(c.id) ?? 0 }));
};

export const getChatMessages = async (chatId: string, userId: string) => {
  const member = await prisma.chatMember.findUnique({
    where: { userId_chatId: { userId, chatId } },
  });
  if (!member) throw new ApiError(403, 'Not a member of this chat');

  return prisma.message.findMany({
    where: { chatId },
    include: messageInclude,
    orderBy: { createdAt: 'asc' },
  });
};

export const createMessage = async (chatId: string, senderId: string, content: string) => {
  const member = await prisma.chatMember.findUnique({
    where: { userId_chatId: { userId: senderId, chatId } },
  });
  if (!member) throw new ApiError(403, 'Not a member of this chat');

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { chatId, senderId, content },
      include: messageInclude,
    }),
    prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
  ]);

  return message;
};

export const markMessagesRead = async (chatId: string, userId: string) => {
  const unread = await prisma.message.findMany({
    where: {
      chatId,
      senderId: { not: userId },
      reads: { none: { userId } },
    },
    select: { id: true },
  });

  if (unread.length === 0) return [];

  await prisma.messageRead.createMany({
    data: unread.map((m) => ({ messageId: m.id, userId })),
    skipDuplicates: true,
  });

  return unread.map((m) => m.id);
};

export const getOrCreateAiChat = async (userId: string) => {
  const aiUserId = getAiUserId();
  if (!aiUserId) throw new ApiError(503, 'AI service unavailable');

  const existing = await prisma.chat.findFirst({
    where: {
      isGroup: false,
      AND: [{ members: { some: { userId } } }, { members: { some: { userId: aiUserId } } }],
    },
    include: { ...memberInclude, ...lastMessageInclude },
  });

  if (existing) return existing;

  return prisma.chat.create({
    data: { isGroup: false, members: { create: [{ userId }, { userId: aiUserId }] } },
    include: { ...memberInclude, ...lastMessageInclude },
  });
};

export const getMessagesForSummary = async (chatId: string, userId: string) => {
  const member = await prisma.chatMember.findUnique({
    where: { userId_chatId: { userId, chatId } },
  });
  if (!member) throw new ApiError(403, 'Not a member of this chat');

  const messages = await prisma.message.findMany({
    where: { chatId },
    include: { sender: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return messages.reverse().map((m) => ({ senderName: m.sender.name, content: m.content }));
};

export const toggleReaction = async (messageId: string, userId: string, emoji: string) => {
  const existing = await prisma.reaction.findUnique({
    where: { userId_messageId_emoji: { userId, messageId, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { messageId, userId, emoji } });
  }

  return prisma.message.findUnique({
    where: { id: messageId },
    select: { chatId: true, reactions: { select: { userId: true, emoji: true } } },
  });
};
