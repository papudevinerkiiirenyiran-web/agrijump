'use client';

import clsx from 'clsx';
import Facepile from './Facepile';
import { useEvents } from '@/lib/store';
import type { CampusEvent } from '@/lib/types';

/**
 * Floating bottom action area: Facepile (social proof) + full-width bright orange FAB
 */
export default function SendItBar({ event }: { event: CampusEvent }) {
  const { isJoined, toggleJoin, rosterOf, spotsLeft } = useEvents();
  const joined = isJoined(event.id);
  const roster = rosterOf(event);
  const left = spotsLeft(event);

  const names = roster
    .slice(0, 2)
    .map((p) => (p.id === 'u_me' ? 'You' : p.name.split(' ')[0]))
    .join(', ');

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[700] flex justify-center">
      <div className="w-full max-w-[480px] px-4 pb-safe pt-3">
        <div className="pointer-events-auto rounded-t-[22px] bg-gradient-to-t from-paper-100 via-paper-100/95 to-paper-100/0 px-1 pt-3 dark:from-ink-900 dark:via-ink-900/95 dark:to-ink-900/0">
          {/* Facepile: social proof */}
          <div className="mb-3 flex items-center justify-between gap-3 px-2">
            <Facepile
              people={roster}
              max={4}
              size={34}
              label={joined ? `You & ${roster.length - 1} others are in` : `${names} & ${Math.max(0, roster.length - 2)} others are in`}
            />
            <span
              className={clsx(
                'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold',
                left <= 3
                  ? 'bg-sunset-100 text-sunset-700 dark:bg-sunset-700/25 dark:text-sunset-300'
                  : 'bg-moss-100 text-moss-700 dark:bg-moss-700/30 dark:text-moss-200'
              )}
            >
              {left > 0 ? `${left} spot${left === 1 ? '' : 's'} left` : 'Full'}
            </span>
          </div>

          {/* Full-width action button */}
          <button
            onClick={() => toggleJoin(event.id)}
            className={clsx(
              'flex h-[58px] w-full items-center justify-center gap-2 rounded-[18px] font-display text-[19px] font-extrabold tracking-tight text-white transition-all duration-200 active:scale-[0.98]',
              joined
                ? 'bg-moss-600 shadow-soft-lg dark:bg-moss-500'
                : 'bg-gradient-to-r from-sunset-400 via-sunset-500 to-sunset-600 shadow-glow'
            )}
          >
            {joined ? (
              <>
                <span aria-hidden>🤙</span> You&apos;re in — see you there
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
