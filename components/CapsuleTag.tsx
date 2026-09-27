import clsx from 'clsx';
import { CATEGORY_MAP } from '@/lib/types';
import type { CategoryId } from '@/lib/types';

/** Capsule-shaped category tag */
export function CategoryCapsule({
  id,
  className,
}: {
  id: CategoryId;
  className?: string;
}) {
  const meta = CATEGORY_MAP[id];
  return (
    <span
      className={clsx('capsule', className)}
      style={{
        backgroundColor: `${meta.color}1F`,
        color: meta.color,
      }}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}

/** Neutral capsule for vibe / time chips */
export function Capsule({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'moss' | 'glass';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral:
      'bg-paper-200 text-ink-500 dark:bg-ink-700 dark:text-paper-200/80',
    accent: 'bg-sunset-100 text-sunset-700 dark:bg-sunset-700/25 dark:text-sunset-300',
    moss: 'bg-moss-100 text-moss-700 dark:bg-moss-700/30 dark:text-moss-200',
    glass: 'bg-black/35 text-white backdrop-blur-sm',
  };
  return (
    <span className={clsx('capsule', tones[tone], className)}>{children}</span>
  );
}
