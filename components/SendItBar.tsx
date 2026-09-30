'use client';

import clsx from 'clsx';
import Facepile from './Facepile';
import { useEvents } from '@/lib/store';
import type { CampusEvent } from '@/lib/types';

/**
 * Floating bottom action area: Facepile (social proof) + full-width bright orange FAB.
 * Always opaque so it never lets content bleed through.
 */
export default function SendItBar({ event }: { event: CampusEvent }) {
  const { isJoined, toggleJoin, rosterOf, spotsLeft } = useEvents();
  const joined = isJoined(event.id);
  const roster = rosterOf(event);
  const left = spotsLeft(event);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[700] flex justify-center">
      <div className="pointer-events-auto w-full max-w-[480px] bg-paper-100 pb-safe pt-3 shadow-[0_-8px_24px_-12px_rgba(31,34,22,0.18)] dark:bg-ink-900">
        <div className="px-4">
          {/* Social proof row */}
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Facepile people={roster} max={4} size={30} />
              <p className="truncate text-[12px] font-semibold text-ink-400 dark:text-paper-300/60">
                {roster.length === 0
                  ? 'Be the first in'
                  : joined
                  ? "You're in"
                  : `${roster.length} going`}
              </p>
            </div>
            <span
              className={clsx(
                'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold',
                left <= 3
                  ? 'bg-sunset-100 text-sunset-700 dark:bg-sunset-700/25 dark:text-sunset-300'
                  : 'bg-moss-100 text-moss-700 dark:bg-moss-700/30 dark:text-moss-200'
              )}
            >
              {left > 0 ? `${left} left` : 'Full'}
            </span>
          </div>

          {/* Full-width CTA */}
          <button
            onClick={() => toggleJoin(event.id)}
            className={clsx(
              'flex h-[56px] w-full items-center justify-center gap-2 rounded-[18px] font-display text-[18px] font-extrabold tracking-tight text-white transition-all duration-200 active:scale-[0.98]',
              joined
                ? 'bg-moss-600 shadow-soft-lg dark:bg-moss-500'
                : 'bg-gradient-to-r from-sunset-400 via-sunset-500 to-sunset-600 shadow-glow'
            )}
          >
            {joined ? (
              <>
                <span aria-hidden>🤙</span> You&apos;re in
              </>
            ) : (
              <>
                <span aria-hidden>🚀</span> Send It!
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}