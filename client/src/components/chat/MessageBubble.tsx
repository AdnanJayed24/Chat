import { useState, useRef, useEffect } from 'react';
import type { Message, Reaction } from '../../types';

interface Props {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupReactions(reactions: Reaction[]) {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    const users = map.get(r.emoji) ?? [];
    users.push(r.userId);
    map.set(r.emoji, users);
  }
  return map;
}

function CheckTicks({ isRead }: { isRead: boolean }) {
  return isRead ? (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="none" className="text-brand-300 inline-block ml-1 flex-shrink-0">
      <path d="M1 5.5L4.5 9L12 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      <path d="M6 5.5L9.5 9L17 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="12" height="11" viewBox="0 0 12 11" fill="none" className="text-white/50 inline-block ml-1 flex-shrink-0">
      <path d="M1 5.5L4.5 9L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function MessageBubble({ message, isOwn, showSender, currentUserId, onReact }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const grouped = groupReactions(message.reactions ?? []);
  const isRead = (message.reads ?? []).length > 0;

  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const handleReact = (emoji: string) => {
    onReact(message.id, emoji);
    setShowPicker(false);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {showSender && !isOwn && (
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-3 tracking-wide">
            {message.sender.name}
          </span>
        )}

        <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
          {/* Message bubble */}
          <div
            className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm transition-all ${
              isOwn
                ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-2xl rounded-tr-sm'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl rounded-tl-sm border border-slate-100 dark:border-slate-700/60'
            }`}
          >
            {message.content}
          </div>

          {/* Emoji picker trigger */}
          <div
            ref={pickerRef}
            className="relative flex-shrink-0 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            <button
              onClick={() => setShowPicker((v) => !v)}
              title="Add reaction"
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700/80 text-slate-400 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200 text-sm transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {showPicker && (
              <div
                className={`absolute bottom-9 ${isOwn ? 'right-0' : 'left-0'} z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 flex gap-1`}
              >
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-xl transition-all hover:scale-125"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {grouped.size > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1.5 ${isOwn ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
            {[...grouped.entries()].map(([emoji, users]) => {
              const hasReacted = users.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  title={hasReacted ? 'Remove reaction' : 'Add reaction'}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                    hasReacted
                      ? 'bg-brand-100 dark:bg-brand-900/50 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div className={`flex items-center gap-0.5 mt-1 ${isOwn ? 'pr-1' : 'pl-1'}`}>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && <CheckTicks isRead={isRead} />}
        </div>
      </div>
    </div>
  );
}
