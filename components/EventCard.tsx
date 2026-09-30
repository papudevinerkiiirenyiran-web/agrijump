'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import Avatar from './Avatar';
import { Capsule, CategoryCapsule } from './CapsuleTag';
import { useEvents } from '@/lib/store';
import { CATEGORY_MAP } from '@/lib/types';
import type { CampusEvent } from '@/lib/types';
import { whenLabel } from '@/lib/time';

interface EventCardProps {
  event: CampusEvent;
  /** Map / list sync: the currently focused event */
  active?: boolean;
}

/**
 * Swipeable card: cover + title + capsule tags + time & place + a lightweight Drop In button
 */
export default function EventCard({ event, active = false }: EventCardProps) {
  const router = useRouter();
  const { isJoined, toggleJoin, rosterOf, spotsLeft, setActiveId } = useEvents();

  const meta = CATEGORY_MAP[event.category];
  const when = whenLabel(event.startsAt);
  const joined = isJoined(event.id);
  const roster = rosterOf(event);
  const left = spotsLeft(event);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => {
        setActiveId(event.id);
        router.push(`/e/${event.id}`);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveId(event.id);
          router.push(`/e/${event.id}`);
        }
      }}
      className={clsx(
        'group w-[252px] shrink-0 snap-start cursor-pointer overflow-hidden rounded-card bg-white shadow-soft transition-all duration-300 dark:bg-ink-800',
        active
          ? 'ring-2 ring-sunset-500 dark:ring-sunset-400'
          : 'ring-1 ring-black/5 dark:ring-white/5'
      )}
    >
      {/* Cover */}
      <div className="relative h-[124px] w-full overflow-hidden bg-moss-300">
        <div
          className="absolute inset-0 bg-gradient-to-br from-moss-500 to-moss-700"
          aria-hidden
        />
        {event.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover}
            alt={event.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          aria-hidden
        />

        {/* Time capsule */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <Capsule tone="glass">
            {when.soon ? '🔥' : '🕒'} {when.day} {when.time}
          </Capsule>
        </div>

        {/* Category emoji badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-lg shadow-sm"
            aria-hidden
          >
            {event.emoji}
          </span>
          <span className="font-display text-[11px] font-bold uppercase tracking-widest text-white/90">
            {meta.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3">
        <h3 className="line-clamp-2 font-display text-[17px] font-extrabold leading-tight text-ink-700 dark:text-paper-100">
          {event.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryCapsule id={event.category} />
          {event.vibe.slice(0, 1).map((v) => (
            <Capsule key={v} tone="neutral">
              {v}
            </Capsule>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink-400 dark:text-paper-300/60">
          <span aria-hidden>📍</span>
          <span className="truncate">{event.location.name}</span>
        </div>

        {/* Participants + Drop In */}
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <div className="flex items-center">
            {roster.slice(0, 3).map((p, i) => (
              <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -9 }}>
                <Avatar src={p.avatar} name={p.name} size={26} />
              </span>
            ))}
            <span className="ml-2 text-[11px] font-bold text-ink-400 dark:text-paper-300/60">
              {roster.length}/{event.capacity}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleJoin(event.id);
            }}
            className={clsx(
              'rounded-full px-4 py-2 font-display text-[13px] font-extrabold transition-all active:scale-95',
              joined
                ? 'bg-moss-600 text-white dark:bg-moss-500'
                : 'bg-sunset-500 text-white shadow-[0_4px_12px_-2px_rgba(255,127,38,.6)] hover:bg-sunset-600'
            )}
          >
            {joined ? '✓ In' : 'Drop In'}
          </button>
        </div>

        {left <= 3 && left > 0 && (
          <p className="text-[11px] font-bold text-sunset-600 dark:text-sunset-300">
            Only {left} spot{left === 1 ? '' : 's'} left
          </p>
        )}
      </div>
    </article>
  );
}
