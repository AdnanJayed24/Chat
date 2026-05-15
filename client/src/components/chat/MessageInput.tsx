import { useRef, useState } from 'react';

interface Props {
  onSend: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export default function MessageInput({ onSend, onTypingStart, onTypingStop }: Props) {
  const [value, setValue] = useState('');
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stopTyping = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTyping.current) { isTyping.current = false; onTypingStop(); }
  };

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    resize();
    if (!isTyping.current) { isTyping.current = true; onTypingStart(); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { isTyping.current = false; onTypingStop(); }, 1500);
  };

  const send = () => {
    const content = value.trim();
    if (!content) return;
    onSend(content);
    setValue('');
    stopTyping();
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const hasText = value.trim().length > 0;

  return (
    <div className="px-3 sm:px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex-shrink-0">
      <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-brand-500/40 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none resize-none leading-relaxed py-1 max-h-[120px]"
          style={{ scrollbarWidth: 'none' }}
        />
        <button
          onClick={send}
          disabled={!hasText}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${
            hasText
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-600/30 scale-100'
              : 'bg-transparent text-slate-300 dark:text-slate-600 scale-90'
          }`}
          aria-label="Send"
        >
          <svg className="w-4 h-4 translate-x-px" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-300 dark:text-slate-700 mt-1.5">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
