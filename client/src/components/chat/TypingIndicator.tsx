interface Props {
  names: string[];
}

export default function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are typing`;

  return (
    <div className="flex justify-start mb-1 slide-in-right">
      <div className="flex items-center gap-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce-dot"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      </div>
    </div>
  );
}
