import { useState } from 'react';
import type { Chat } from '../../types';
import { useAuthStore } from '../../store/auth.store';
import { useChatStore } from '../../store/chat.store';
import { disconnectSocket } from '../../socket/client';
import { api } from '../../api/client';
import ConversationItem from './ConversationItem';
import ThemeToggle from '../layout/ThemeToggle';
import Avatar from '../ui/Avatar';

interface Props {
  onChatSelect: (chat: Chat) => void;
}

export default function Sidebar({ onChatSelect }: Props) {
  const { user, clearAuth } = useAuthStore();
  const { chats, activeChat } = useChatStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [targetEmail, setTargetEmail] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const filtered = chats.filter((c) => {
    const partner = c.members.find((m) => m.user.id !== user?.id)?.user;
    return partner?.name.toLowerCase().includes(search.toLowerCase());
  });

  const openModal = () => { setModalOpen(true); setTargetEmail(''); setModalError(''); };
  const closeModal = () => setModalOpen(false);

  const startChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    try {
      const { data } = await api.post<Chat>('/chats', { targetEmail });
      onChatSelect(data);
      closeModal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setModalError(msg ?? 'User not found');
    } finally {
      setModalLoading(false);
    }
  };

  const openAiChat = async () => {
    setAiError('');
    try {
      const { data } = await api.post<Chat>('/chats/ai');
      onChatSelect(data);
    } catch {
      setAiError('Could not open AI chat. Please try again.');
    }
  };

  const logout = () => {
    disconnectSocket();
    clearAuth();
    useChatStore.getState().reset();
  };

  return (
    <>
      <aside className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm">💬</span>
            </div>
            <h1 className="font-bold text-slate-900 dark:text-white tracking-tight">Chats</h1>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <button
              onClick={openModal}
              className="p-2 rounded-xl text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
              title="New conversation"
            >
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-shadow"
            />
          </div>
        </div>

        {/* AI Assistant button */}
        <div className="px-3 pb-2">
          <button
            onClick={openAiChat}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-pink-500/10 dark:from-brand-900/40 dark:via-purple-900/40 dark:to-pink-900/30 border border-brand-200/60 dark:border-brand-800/60 hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-brand-500/30 transition-shadow flex-shrink-0 text-white font-bold text-base">
              ✦
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-brand-700 dark:text-brand-300 leading-tight">AI Assistant</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Powered by Gemini</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {aiError && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 px-1">{aiError}</p>
          )}
        </div>

        {/* Divider */}
        {chats.length > 0 && (
          <div className="px-4 pb-1">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-wider">Messages</p>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <span className="text-3xl">🔍</span>
              <p className="text-xs text-slate-400 dark:text-slate-600">
                {chats.length === 0 ? 'No conversations yet' : 'No matches'}
              </p>
            </div>
          ) : (
            <div className="py-1 space-y-0.5 px-2">
              {filtered.map((chat) => (
                <ConversationItem
                  key={chat.id}
                  chat={chat}
                  currentUserId={user!.id}
                  active={activeChat?.id === chat.id}
                  onClick={() => onChatSelect(chat)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group">
            <Avatar name={user!.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                {user!.name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user!.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* New chat modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 fade-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">New conversation</h2>
                <p className="text-xs text-slate-400">Enter their email address</p>
              </div>
            </div>

            <form onSubmit={startChat} className="space-y-4">
              {modalError && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2.5">
                  {modalError}
                </p>
              )}
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
              />
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm shadow-brand-600/30"
                >
                  {modalLoading ? 'Starting…' : 'Start chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
