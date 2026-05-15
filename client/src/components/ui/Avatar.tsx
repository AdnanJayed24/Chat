interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

const PALETTE = [
  ['#6366f1', '#4f46e5'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#3b82f6', '#2563eb'],
  ['#ef4444', '#dc2626'],
  ['#06b6d4', '#0891b2'],
];

export default function Avatar({ name, size = 'md', online }: Props) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) ?? 0)) % PALETTE.length;
  const [from, to] = PALETTE[idx];

  const sizeClass =
    size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';

  const dotSize =
    size === 'sm' ? 'w-2 h-2 border' : size === 'lg' ? 'w-3.5 h-3.5 border-2' : 'w-2.5 h-2.5 border-2';

  return (
    <div className="relative inline-flex flex-shrink-0">
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center font-semibold text-white select-none shadow-sm`}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      >
        {initials}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 block ${dotSize} rounded-full border-white dark:border-slate-900 transition-colors ${
            online ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        />
      )}
    </div>
  );
}
