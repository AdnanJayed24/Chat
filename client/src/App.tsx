import { useEffect, useState } from 'react';
import type { Message, Reaction } from './types';
import { useAuthStore } from './store/auth.store';
import { useChatStore } from './store/chat.store';
import { initSocket, disconnectSocket } from './socket/client';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';

type AuthPage = 'login' | 'register';

export default function App() {
  const { user, token } = useAuthStore();
  const [authPage, setAuthPage] = useState<AuthPage>('login');

  useEffect(() => {
    if (!user || !token) return;

    const socket = initSocket(token);

    socket.on('message_received', (msg: Message) => {
      useChatStore.getState().addMessage(msg);
      const state = useChatStore.getState();
      if (state.streamingMessage?.chatId === msg.chatId) {
        state.setStreamingMessage(null);
      }
      if (state.activeChat?.id === msg.chatId) {
        socket.emit('mark_read', { chatId: msg.chatId });
      }
    });

    socket.on('ai_stream', ({ chatId, content }: { chatId: string; content: string }) => {
      useChatStore.getState().setStreamingMessage({ chatId, content });
    });

    socket.on('messages_read', ({ messageIds, userId }: { messageIds: string[]; userId: string; chatId: string }) => {
      useChatStore.getState().updateMessageReads(messageIds, userId);
    });

    socket.on('reaction_updated', ({ messageId, reactions }: { messageId: string; reactions: Reaction[] }) => {
      useChatStore.getState().updateMessageReactions(messageId, reactions);
    });

    socket.on('user_online', ({ userId }: { userId: string }) => {
      useChatStore.getState().setUserOnline(userId);
    });

    socket.on('user_offline', ({ userId }: { userId: string }) => {
      useChatStore.getState().setUserOffline(userId);
    });

    socket.on('user_typing', ({ chatId, userId, userName }: { chatId: string; userId: string; userName: string }) => {
      useChatStore.getState().setTyping(chatId, { userId, userName });
    });

    socket.on('user_stop_typing', ({ chatId, userId }: { chatId: string; userId: string }) => {
      useChatStore.getState().clearTyping(chatId, userId);
    });

    socket.on('connect', () => {
      const { activeChat } = useChatStore.getState();
      if (activeChat) socket.emit('join_chat', { chatId: activeChat.id });
    });

    return () => { disconnectSocket(); };
  }, [user?.id, token]);

  if (!user || !token) {
    return authPage === 'register' ? (
      <RegisterPage onSwitch={() => setAuthPage('login')} />
    ) : (
      <LoginPage onSwitch={() => setAuthPage('register')} />
    );
  }

  return <ChatPage />;
}
