import type { Chat } from '../../types';
import Avatar from '../ui/Avatar';
import { useChatStore } from '../../store/chat.store';

interface Props {
  chat: Chat;
  currentUserId: string;
  active: boolean;
  onClick: () => void;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationItem({ chat, currentUserId, active, onClick }: Props) {
  const { onlineUsers } = useChatStore();
  const partner = chat.members.find((m) => m.user.id !== currentUserId)?.user;
  if (!partner) return null;

  const lastMsg = chat.messages[0];
  const isOnline = onlineUsers.has(partner.id);
  const isAi = partner.name === 'AI Assistant';
  const unread = chat.unreadCount ?? 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150 ${
        active
          ? 'bg-brand-50 dark:bg-brand-900/25 shadow-sm'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      {isAi ? (
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm text-white font-bold text-sm">
          ✦
        </div>
      ) : (
        <Avatar name={partner.name} online={isOnline} />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <p className={`font-semibold text-sm truncate ${
            active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-900 dark:text-white'
          }`}>
            {partner.name}
          </p>
          {lastMsg && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">
              {formatTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 leading-relaxed">
          {lastMsg
            ? lastMsg.senderId === currentUserId
              ? `You: ${lastMsg.content}`
              : lastMsg.content
            : 'Start a conversation'}
        </p>
      </div>

      {unread > 0 ? (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 tabular-nums">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : active ? (
        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
      ) : null}
    </button>
  );
}
