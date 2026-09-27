'use client';

import clsx from 'clsx';
import { useEvents, type FilterId } from '@/lib/store';
import { CATEGORIES } from '@/lib/types';

/** Category filter chips (Spotify-style horizontal row) */
export default function FilterChips() {
  const { filter, setFilter, events } = useEvents();

  const chips: { id: FilterId; label: string; emoji: string }[] = [
    { id: 'all', label: 'All', emoji: '✨' },
    ...CATEGORIES.map((c) => ({ id: c.id as FilterId, label: c.label, emoji: c.emoji })),
  ];

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {chips.map((c) => {
        const count =
          c.id === 'all'
            ? events.length
            : events.filter((e) => e.category === c.id).length;
        if (c.id !== 'all' && count === 0) return null;
        const on = filter === c.id;
        return (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={clsx(
              'capsule shrink-0 border transition-all active:scale-95',
              on
                ? 'border-transparent bg-moss-600 text-white dark:bg-moss-400 dark:text-moss-900'
                : 'border-black/10 bg-white text-ink-500 dark:border-white/10 dark:bg-ink-700 dark:text-paper-200/70'
            )}
          >
            <span aria-hidden>{c.emoji}</span>
            {c.label}
            <span className={clsx('ml-0.5 opacity-60')}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
