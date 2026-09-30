'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useRef } from 'react';
import Avatar from '@/components/Avatar';
import BottomSheet from '@/components/BottomSheet';
import EmptyGuide from '@/components/EmptyGuide';
import EventCard from '@/components/EventCard';
import FilterChips from '@/components/FilterChips';
import ThemeToggle from '@/components/ThemeToggle';
import { useEvents } from '@/lib/store';

/** The map needs window, so SSR must be off */
const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-moss-200 via-moss-100 to-paper-200 dark:from-moss-900 dark:via-ink-800 dark:to-ink-900">
      <p className="animate-pulse font-display text-sm font-bold text-moss-700 dark:text-moss-200">
        Unrolling the campus map…
      </p>
    </div>
  ),
});

export default function DiscoverPage() {
  const {
    visible,
    activeId,
    setActiveId,
    joined,
    events,
    me,
    cloud,
    error,
    dismissError,
    refresh,
  } = useEvents();
  const railRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  /** While swiping cards horizontally, keep the map on the nearest one */
  const onRailScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail || ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      ticking.current = false;
      const center = rail.scrollLeft + rail.clientWidth / 2;
      const best = { id: '', dist: Number.POSITIVE_INFINITY };
      rail.querySelectorAll<HTMLElement>('[data-card-id]').forEach((el) => {
        const c = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(c - center);
        if (dist < best.dist) {
          best.id = el.dataset.cardId ?? '';
          best.dist = dist;
        }
      });
      if (best.id && best.id !== activeId) setActiveId(best.id);
    });
  }, [activeId, setActiveId]);

  const isEmpty = events.length === 0;

  return (
    <main className="relative h-app w-full overflow-hidden">
      {/* Map covers the whole viewport, including the area behind the sheet */}
      <div className="absolute inset-0">
        <CampusMap />
      </div>

      {/* Top bar */}
      {/* z-[700] keeps this above the bottom sheet (z-[600]) — otherwise the
          sheet paints over the status banner when it is expanded. */}
      <header className="absolute inset-x-3 top-safe z-[700] flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2.5 rounded-full bg-white/95 py-2 pl-3 pr-4 shadow-soft dark:bg-ink-800/95">
            <span className="text-lg" aria-hidden>
              🥏
            </span>
            <div className="leading-none">
              <p className="font-display text-[15px] font-extrabold tracking-tight text-ink-700 dark:text-paper-100">
                AgriJump
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-ink-400 dark:text-paper-300/60">
                Legnaro · Veneto
              </p>
            </div>
          </div>

          <Link
            href="/me"
            aria-label="Open profile"
            className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2.5 shadow-soft transition active:scale-95 dark:bg-ink-800/95"
            prefetch={false}
          >
            <span className="font-display text-[12px] font-extrabold text-moss-700 dark:text-moss-200">
              {joined.length}
            </span>
            <span className="text-[10px] font-bold text-ink-400 dark:text-paper-300/60" aria-hidden>
              🔖
            </span>
            <Avatar src={me.avatar} name={me.name} size={28} />
          </Link>

          <ThemeToggle />
        </div>

        {/* Shared-board status — a local-only fallback must never be silent */}
        {!cloud && (
          <p className="rounded-2xl bg-amber-100/95 px-3.5 py-2 text-[11px] font-semibold leading-snug text-amber-900 shadow-soft dark:bg-amber-900/80 dark:text-amber-100">
            Shared board offline — drops stay on this phone.
          </p>
        )}

        {cloud && error && (
          <div className="flex items-start gap-2 rounded-2xl bg-red-50/95 px-3.5 py-2 shadow-soft dark:bg-red-950/85">
            <p className="flex-1 text-[11px] font-semibold leading-snug text-red-800 dark:text-red-200">
              {error}
            </p>
            <button
              type="button"
              onClick={() => {
                dismissError();
                refresh();
              }}
              className="shrink-0 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-extrabold text-white"
            >
              Retry
            </button>
          </div>
        )}
      </header>

      {/* Bottom sheet — start expanded when there's nothing to browse */}
      <BottomSheet defaultExpanded={isEmpty}>
        {(expanded) =>
          isEmpty ? (
            <EmptyGuide />
          ) : (
            <div className="flex h-full flex-col">
              <div className="px-4 pb-2">
                <div className="flex items-end justify-between">
                  <h1 className="font-display text-[23px] font-extrabold leading-none text-ink-700 dark:text-paper-100">
                    Drops near you
                  </h1>
                  <span className="font-display text-[11px] font-bold text-moss-600 dark:text-moss-300">
                    {visible.length} live
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-ink-400 dark:text-paper-300/60">
                  {expanded
                    ? 'Drag the handle down to see the map'
                    : 'Swipe cards · tap a pin · jump in'}
                </p>
              </div>

              <div className="px-4 pb-3">
                <FilterChips />
              </div>

              {/* Swipeable card rail */}
              <div
                ref={railRef}
                onScroll={onRailScroll}
                className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden px-4 pb-4"
              >
                {visible.map((e) => (
                  <div
                    key={e.id}
                    id={`card-${e.id}`}
                    data-card-id={e.id}
                    className="snap-start"
                  >
                    <EventCard event={e} active={e.id === activeId} />
                  </div>
                ))}
              </div>

              {expanded && (
                <div className="mt-auto px-4 pb-8">
                  <Link
                    href="/drop/new"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-moss-300 py-4 font-display text-[15px] font-extrabold text-moss-700 transition active:scale-[0.98] dark:border-moss-600 dark:text-moss-200"
                  >
                    <span aria-hidden>＋</span> Drop your own
                  </Link>
                </div>
              )}
            </div>
          )
        }
      </BottomSheet>
    </main>
  );
}