import Avatar from './Avatar';
import type { Participant } from '@/lib/types';

interface FacepileProps {
  people: Participant[];
  max?: number;
  size?: number;
  label?: string;
}

/** Stacked avatars: social proof ("4 people are already in") */
export default function Facepile({
  people,
  max = 4,
  size = 36,
  label,
}: FacepileProps) {
  const shown = people.slice(0, max);
  const rest = Math.max(0, people.length - shown.length);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center">
        {shown.map((p, i) => (
          <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
            <Avatar src={p.avatar} name={p.name} size={size} />
          </span>
        ))}
        {rest > 0 && (
          <span
            style={{
              marginLeft: -size * 0.32,
              width: size,
              height: size,
              fontSize: size * 0.32,
            }}
            className="grid place-items-center rounded-full bg-moss-700 font-display font-extrabold text-paper-100 ring-2 ring-paper-100 dark:bg-moss-300 dark:text-moss-900 dark:ring-ink-900"
          >
            +{rest}
          </span>
        )}
      </div>
      {label && (
        <p className="text-xs font-semibold text-ink-400 dark:text-paper-300/70">
          {label}
        </p>
      )}
    </div>
  );
}
