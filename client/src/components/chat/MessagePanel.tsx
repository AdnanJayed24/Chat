import { useEffect, useRef, useState } from 'react';
import type { Chat, User } from '../../types';
import { useChatStore } from '../../store/chat.store';
import { getSocket } from '../../socket/client';
import { api } from '../../api/client';
import Avatar from '../ui/Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface Props {
  chat: Chat;
  currentUser: User;
  onBack: () => void;
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start mb-1 slide-in-right">
      <div className="max-w-[75%]">
        <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed whitespace-pre-wrap break-words bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700">
          {content}
          <span className="inline-block w-0.5 h-3.5 bg-brand-500 ml-0.5 animate-pulse align-middle rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function MessagePanel({ chat, currentUser, onBack }: Props) {
  const { messages, typingUsers, onlineUsers, streamingMessage } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const partner = chat.members.find((m) => m.user.id !== currentUser.id)?.user;
  const isPartnerOnline = partner ? onlineUsers.has(partner.id) : false;
  const typing = (typingUsers.get(chat.id) ?? []).filter((u) => u.userId !== currentUser.id);
  const isStreaming = streamingMessage?.chatId === chat.id;
  const isAiChat = partner?.name === 'AI Assistant';

  useEffect(() => { setSummary(null); }, [chat.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typing.length, isStreaming]);

  const sendMessage = (content: string) => getSocket().emit('send_message', { chatId: chat.id, content });
  const handleTypingStart = () => getSocket().emit('typing_start', { chatId: chat.id });
  const handleTypingStop = () => getSocket().emit('typing_stop', { chatId: chat.id });
  const handleReact = (messageId: string, emoji: string) => getSocket().emit('react', { messageId, emoji });

  const handleSummarize = async () => {
    if (summarizing) return;
    setSummarizing(true);
    setSummary(null);
    try {
      const { data } = await api.post<{ summary: string }>(`/chats/${chat.id}/summarize`);
      setSummary(data.summary);
    } catch {
      setSummary('Could not generate summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex-shrink-0 shadow-sm">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {isAiChat ? (
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md text-white font-bold">
            ✦
          </div>
        ) : partner ? (
          <Avatar name={partner.name} size="md" online={isPartnerOnline} />
        ) : null}

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight truncate">
            {partner?.name ?? chat.name ?? 'Chat'}
          </p>
          <p className={`text-xs leading-tight ${
            isAiChat
              ? 'text-brand-500 dark:text-brand-400'
              : isPartnerOnline
                ? 'text-emerald-500'
                : 'text-slate-400 dark:text-slate-500'
          }`}>
            {isAiChat ? 'Gemini 2.5 Flash' : isPartnerOnline ? 'Active now' : 'Offline'}
          </p>
        </div>

        {/* Summarize button */}
        {messages.length >= 2 && (
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            title="Summarize conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 disabled:opacity-50 transition-all border border-brand-200/50 dark:border-brand-800/50 flex-shrink-0"
          >
            <svg className={`w-3.5 h-3.5 ${summarizing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {summarizing
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.636-6.364l.707.707M6.343 17.657l-.707.707M17.657 17.657l.707.707M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
              }
            </svg>
            <span className="hidden sm:inline">{summarizing ? 'Summarizing…' : 'Summarize'}</span>
          </button>
        )}
      </div>

      {/* Summary card */}
      {summary && (
        <div className="mx-3 mt-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-200/60 dark:border-brand-800/60 flex gap-3 flex-shrink-0 shadow-sm fade-up">
          <span className="text-brand-500 text-base flex-shrink-0 mt-0.5">✦</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">AI Summary</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{summary}</p>
          </div>
          <button
            onClick={() => setSummary(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 self-start p-0.5 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-0.5">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-3xl">
              {isAiChat ? '✦' : '👋'}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isAiChat ? 'Ask me anything!' : `Say hello to ${partner?.name}!`}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser.id}
              showSender={i === 0 || messages[i - 1].senderId !== msg.senderId}
              currentUserId={currentUser.id}
              onReact={handleReact}
            />
          ))
        )}
        {isStreaming && <StreamingBubble content={streamingMessage!.content} />}
        {typing.length > 0 && <TypingIndicator names={typing.map((t) => t.userName)} />}
        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={sendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </div>
  );
}
