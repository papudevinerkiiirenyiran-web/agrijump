'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { seedEvents } from './seed';
import type { CampusEvent, CategoryId, Participant } from './types';

/** Current user (swap for Supabase Auth session.user in production) */
export const ME: Participant = {
  id: 'u_me',
  name: 'You',
  avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=AgriJumpYou&backgroundColor=ff7f26',
};

const STORAGE_KEY = 'agrijump.joined.v1';

export type FilterId = CategoryId | 'all';

interface EventsContextValue {
  events: CampusEvent[];
  /** Category-filtered list (falls back to all when a filter is empty) */
  visible: CampusEvent[];
  filter: FilterId;
  setFilter: (f: FilterId) => void;
  /** Currently selected event, syncing map and cards */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  joined: string[];
  isJoined: (id: string) => boolean;
  toggleJoin: (id: string) => void;
  /** Roster with "me" appended automatically */
  rosterOf: (e: CampusEvent) => Participant[];
  spotsLeft: (e: CampusEvent) => number;
  ready: boolean;
}

const Ctx = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events] = useState<CampusEvent[]>(seedEvents);
  const [filter, setFilter] = useState<FilterId>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  // Restore joined drops from local storage (offline first)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setJoined(JSON.parse(raw) as string[]);
    } catch {
      /* Ignore errors in private mode */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(joined));
    } catch {
      /* noop */
    }
  }, [joined, ready]);

  const toggleJoin = useCallback((id: string) => {
    setJoined((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const isJoined = useCallback((id: string) => joined.includes(id), [joined]);

  const visible = useMemo(() => {
    const list = filter === 'all' ? events : events.filter((e) => e.category === filter);
    return list.length ? list : events;
  }, [events, filter]);

  // Auto-select the first result so the map always has focus
  useEffect(() => {
    if (visible.length && !visible.some((e) => e.id === activeId)) {
      setActiveId(visible[0].id);
    }
  }, [visible, activeId]);

  const rosterOf = useCallback(
    (e: CampusEvent) =>
      joined.includes(e.id) ? [...e.participants, ME] : e.participants,
    [joined]
  );

  const spotsLeft = useCallback(
    (e: CampusEvent) => Math.max(0, e.capacity - rosterOf(e).length),
    [rosterOf]
  );

  const value = useMemo<EventsContextValue>(
    () => ({
      events,
      visible,
      filter,
      setFilter,
      activeId,
      setActiveId,
      joined,
      isJoined,
      toggleJoin,
      rosterOf,
      spotsLeft,
      ready,
    }),
    [events, visible, filter, activeId, joined, isJoined, toggleJoin, rosterOf, spotsLeft, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEvents() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEvents must be used inside <EventsProvider>');
  return ctx;
}

export function useEvent(id: string) {
  const { events, rosterOf, spotsLeft, isJoined, toggleJoin } = useEvents();
  const event = events.find((e) => e.id === id) ?? null;
  return {
    event,
    roster: event ? rosterOf(event) : [],
    spotsLeft: event ? spotsLeft(event) : 0,
    joined: id ? isJoined(id) : false,
    toggleJoin: () => toggleJoin(id),
  };
}
