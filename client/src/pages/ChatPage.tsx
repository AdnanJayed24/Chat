import { useEffect, useRef, useState } from 'react';
import type { Chat } from '../types';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';
import { getSocket } from '../socket/client';
import { api } from '../api/client';
import Sidebar from '../components/chat/Sidebar';
import MessagePanel from '../components/chat/MessagePanel';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { setChats, addOrUpdateChat, setActiveChat, setMessages, activeChat } = useChatStore();
  const prevChatId = useRef<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    api.get<Chat[]>('/chats').then(({ data }) => setChats(data)).catch(console.error);
  }, []);

  const handleChatSelect = async (chat: Chat) => {
    if (activeChat?.id === chat.id) { setShowChat(true); return; }

    const socket = getSocket();
    if (prevChatId.current) socket.emit('leave_chat', { chatId: prevChatId.current });

    prevChatId.current = chat.id;
    setActiveChat(chat);
    setMessages([]);
    socket.emit('join_chat', { chatId: chat.id });
    setShowChat(true);

    try {
      const { data } = await api.get<Chat['messages']>(`/chats/${chat.id}/messages`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNewChat = (chat: Chat) => {
    addOrUpdateChat(chat);
    handleChatSelect(chat);
  };

  return (
    <div className="flex h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">
      {/* Sidebar — full-screen on mobile, fixed-width on desktop */}
      <div
        className={`
          absolute inset-y-0 left-0 w-full z-20
          md:relative md:w-80 md:flex-shrink-0 md:translate-x-0
          transition-transform duration-300 ease-in-out
          ${showChat ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <Sidebar onChatSelect={handleNewChat} />
      </div>

      {/* Chat panel — slides in from right on mobile */}
      <div
        className={`
          absolute inset-0 z-10
          md:relative md:flex-1 md:translate-x-0
          transition-transform duration-300 ease-in-out
          ${showChat ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {activeChat ? (
          <MessagePanel
            chat={activeChat}
            currentUser={user!}
            onBack={() => setShowChat(false)}
          />
        ) : (
          <div className="hidden md:flex flex-col items-center justify-center h-full gap-5">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-900/40 dark:to-purple-900/40 flex items-center justify-center shadow-inner">
              <span className="text-5xl">💬</span>
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">Your messages</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">
                Select a conversation or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
