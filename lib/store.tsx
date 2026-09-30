'use client';

/**
 * AgriJump — app state
 * ---------------------------------------------------------------
 * Drops live in a shared Supabase table, so every phone sees the same
 * board. The profile (name / field of study / avatar) stays on the
 * device: it is presentation, not shared data.
 *
 * When the Supabase environment variables are absent the app still runs
 * on localStorage — but `cloud` is false and the UI shows a banner, so
 * the fallback is never silent.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CATEGORY_MAP, LEGNARO, clampToLegnaro } from './types';
import type { CampusEvent, CategoryId, Participant } from './types';
import { avatarFor } from './avatar';
import {
  cloudEnabled,
  deleteOwnDrop,
  describeError,
  deviceId,
  fetchBoard,
  insertDrop,
  insertJoin,
  removeJoin,
  type NewDropPayload,
} from './supabase';

export { avatarFor } from './avatar';

const PROFILE_KEY = 'agrijump.profile.v1';
const LOCAL_DROPS_KEY = 'agrijump.drops.v1';

/** How often the board re-reads the shared table while the tab is visible. */
const POLL_MS = 20_000;

/** What the profile looks like before the user fills anything in. */
export const DEFAULT_ME: Participant = {
  id: '',
  name: 'You',
  major: '',
  bio: '',
  avatar: avatarFor('AgriJumpYou'),
};

export type FilterId = CategoryId | 'all';

/** Minimal payload for "Drop your own" — the rest is filled in by the store */
export interface NewDropInput {
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  /** Place name shown on the card and detail page */
  placeName: string;
  /** ISO local datetime (e.g. 2026-10-01T18:30) */
  startsAt: string;
  durationMin: number;
  capacity: number;
  vibe: string[];
  /** Exact spot picked on the map; when omitted we scatter inside Legnaro */
  lat?: number;
  lng?: number;
}

interface EventsContextValue {
  /** This device's profile (name, major, avatar…) */
  me: Participant;
  /** Patch the profile; persisted to localStorage */
  updateProfile: (patch: Partial<Omit<Participant, 'id'>>) => void;
  events: CampusEvent[];
  /** Category-filtered list (falls back to all when a filter is empty) */
  visible: CampusEvent[];
  filter: FilterId;
  setFilter: (f: FilterId) => void;
  /** Currently selected event, syncing map and cards */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  /** Ids this device has joined */
  joined: string[];
  isJoined: (id: string) => boolean;
  toggleJoin: (id: string) => void;
  /** Everyone who tapped Drop In (the host is shown separately) */
  rosterOf: (e: CampusEvent) => Participant[];
  spotsLeft: (e: CampusEvent) => number;
  /** Add a user-created drop; resolves with the new event's id */
  addEvent: (input: NewDropInput) => Promise<string>;
  /** Cancel one of your own drops (no-op for anything you do not host) */
  removeEvent: (id: string) => Promise<void>;
  /** Drops the current user is hosting */
  hostedByMe: CampusEvent[];
  /** Drops the current user has joined (incl. ones they host) */
  myDrops: CampusEvent[];
  /** True once the first load has settled */
  ready: boolean;
  /** True when the shared board is configured */
  cloud: boolean;
  /** A cloud read/write is in flight */
  syncing: boolean;
  /** Last cloud failure, ready to show in a banner */
  error: string | null;
  dismissError: () => void;
  refresh: () => void;
}

const Ctx = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: ReactNode }) {
  const [myId, setMyId] = useState('');
  const [me, setMe] = useState<Participant>(DEFAULT_ME);
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [filter, setFilter] = useState<FilterId>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Read the shared board                                            */
  /* ---------------------------------------------------------------- */

  const refresh = useCallback(async (showSpinner = false) => {
    if (!cloudEnabled) return;
    if (showSpinner) setSyncing(true);
    try {
      const list = await fetchBoard();
      setEvents(list);
      setError(null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      if (showSpinner) setSyncing(false);
    }
  }, []);

  /**
   * Surface a failure AFTER re-reading the board.
   *
   * `refresh()` clears the error when it succeeds, so setting the error
   * first would immediately wipe it — the user would see the optimistic
   * change silently snap back with no explanation.
   */
  const failAndResync = useCallback(
    async (message: string) => {
      await refresh();
      setError(message);
    },
    [refresh]
  );

  /* ---------------------------------------------------------------- */
  /*  Boot: device id + local profile (+ local drops when offline-only) */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    const id = deviceId();
    setMyId(id);

    let profile: Participant = { ...DEFAULT_ME, id };
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) profile = { ...profile, ...(JSON.parse(stored) as Participant), id };
    } catch {
      /* private mode — keep the default */
    }
    setMe(profile);

    if (!cloudEnabled) {
      try {
        const local = localStorage.getItem(LOCAL_DROPS_KEY);
        if (local) setEvents(JSON.parse(local) as CampusEvent[]);
      } catch {
        /* ignore */
      }
      setReady(true);
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  First load + polling while the tab is visible                    */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!cloudEnabled) return;

    let cancelled = false;

    const load = async (showSpinner: boolean) => {
      if (cancelled) return;
      await refresh(showSpinner);
    };

    load(true).then(() => {
      if (!cancelled) setReady(true);
    });

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(false);
    }, POLL_MS);

    // Coming back to the tab should feel instant, not "up to 20s stale".
    const onWake = () => {
      if (document.visibilityState === 'visible') load(false);
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [refresh]);

  /* ---------------------------------------------------------------- */
  /*  Profile                                                          */
  /* ---------------------------------------------------------------- */

  const updateProfile = useCallback(
    (patch: Partial<Omit<Participant, 'id'>>) => {
      setMe((prev) => {
        const next = { ...prev, ...patch, id: prev.id || myId };
        try {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    [myId]
  );

  /* ---------------------------------------------------------------- */
  /*  Derived lists                                                    */
  /* ---------------------------------------------------------------- */

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

  const joined = useMemo(
    () =>
      myId
        ? events.filter((e) => e.participants.some((p) => p.id === myId)).map((e) => e.id)
        : [],
    [events, myId]
  );

  const isJoined = useCallback((id: string) => joined.includes(id), [joined]);

  const rosterOf = useCallback((e: CampusEvent) => e.participants, []);

  const spotsLeft = useCallback(
    (e: CampusEvent) => Math.max(0, e.capacity - e.participants.length),
    []
  );

  /* ---------------------------------------------------------------- */
  /*  Writes                                                           */
  /* ---------------------------------------------------------------- */

  const toggleJoin = useCallback(
    (id: string) => {
      const target = events.find((e) => e.id === id);
      if (!target || !myId) return;

      const leaving = target.participants.some((p) => p.id === myId);

      // Optimistic — the tap should feel instant on a phone.
      setEvents((prev) =>
        prev.map((e) =>
          e.id !== id
            ? e
            : {
                ...e,
                participants: leaving
                  ? e.participants.filter((p) => p.id !== myId)
                  : [
                      ...e.participants,
                      {
                        id: myId,
                        name: me.name || 'You',
                        avatar: me.avatar,
                        major: me.major,
                      },
                    ],
              }
        )
      );

      if (!cloudEnabled) return;

      const who: Participant = {
        id: myId,
        name: me.name || 'You',
        avatar: me.avatar,
        major: me.major,
      };

      const write = leaving ? removeJoin(id, myId) : insertJoin(id, who);
      // Re-read the truth so the optimistic guess cannot stick.
      write.catch((err) => void failAndResync(describeError(err)));
    },
    [events, myId, me, failAndResync]
  );

  const addEvent = useCallback(
    async (input: NewDropInput): Promise<string> => {
      const meta = CATEGORY_MAP[input.category];

      // Prefer the spot the user tapped on the map. Without one we scatter
      // anywhere inside Legnaro (never outside the comune boundary).
      const point = clampToLegnaro(
        input.lat ?? randomIn(LEGNARO.bounds.south, LEGNARO.bounds.north),
        input.lng ?? randomIn(LEGNARO.bounds.west, LEGNARO.bounds.east)
      );

      const startsAt = input.startsAt.length === 16 ? `${input.startsAt}:00` : input.startsAt;

      /* ---- offline-only fallback (never silent: `cloud` is false) ---- */
      if (!cloudEnabled) {
        const id = `local_${Date.now().toString(36)}`;
        const drop: CampusEvent = {
          id,
          title: input.title.trim(),
          tagline: input.tagline.trim(),
          description: input.description.trim(),
          category: input.category,
          emoji: meta.emoji,
          location: { name: input.placeName.trim(), lat: point.lat, lng: point.lng },
          startsAt: input.startsAt,
          durationMin: clamp(input.durationMin, 15, 600),
          capacity: clamp(input.capacity, 2, 999),
          host: { ...me, id: myId },
          participants: [],
          cover: coverFor(id),
          vibe: input.vibe,
        };
        setEvents((prev) => {
          const next = [...prev, drop];
          try {
            localStorage.setItem(LOCAL_DROPS_KEY, JSON.stringify(next));
          } catch {
            /* noop */
          }
          return next;
        });
        setActiveId(id);
        return id;
      }

      /* ---- shared board ---- */
      const payload: NewDropPayload = {
        title: input.title.trim(),
        tagline: input.tagline.trim(),
        description: input.description.trim(),
        category: input.category,
        emoji: meta.emoji,
        place_name: input.placeName.trim(),
        lat: point.lat,
        lng: point.lng,
        starts_at: new Date(startsAt).toISOString(),
        duration_min: clamp(input.durationMin, 15, 600),
        capacity: clamp(input.capacity, 2, 999),
        host_id: myId,
        host_name: me.name || 'You',
        host_major: me.major || null,
        host_avatar: me.avatar || null,
        host_bio: me.bio || null,
        // The board has no uploads yet — a deterministic placeholder keeps
        // cards warm. Never empty: an empty src makes the browser re-fetch
        // the whole page.
        cover: coverFor(`${myId}-${Date.now().toString(36)}`),
        vibe: input.vibe,
      };

      try {
        const created = await insertDrop(payload);
        setEvents((prev) => (prev.some((e) => e.id === created.id) ? prev : [...prev, created]));
        setActiveId(created.id);
        setError(null);
        return created.id;
      } catch (err) {
        const message = describeError(err);
        setError(message);
        throw new Error(message);
      }
    },
    [me, myId]
  );

  const removeEvent = useCallback(
    async (id: string) => {
      const target = events.find((e) => e.id === id);
      // Only the host may cancel — the database enforces this too.
      if (!target || !myId || target.host.id !== myId) return;

      const remaining = events.filter((e) => e.id !== id);
      setEvents(remaining); // optimistic — the row should vanish on tap

      if (!cloudEnabled) {
        try {
          localStorage.setItem(LOCAL_DROPS_KEY, JSON.stringify(remaining));
        } catch {
          /* noop */
        }
        return;
      }

      try {
        const removed = await deleteOwnDrop(id);
        if (!removed) await failAndResync('That drop was already gone.');
      } catch (err) {
        await failAndResync(describeError(err));
      }
    },
    [events, myId, failAndResync]
  );

  const hostedByMe = useMemo(
    () => (myId ? events.filter((e) => e.host.id === myId) : []),
    [events, myId]
  );

  const myDrops = useMemo(
    () =>
      myId
        ? events.filter(
            (e) => e.host.id === myId || e.participants.some((p) => p.id === myId)
          )
        : [],
    [events, myId]
  );

  const dismissError = useCallback(() => setError(null), []);

  /* ---------------------------------------------------------------- */

  const value = useMemo<EventsContextValue>(
    () => ({
      me,
      updateProfile,
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
      addEvent,
      removeEvent,
      hostedByMe,
      myDrops,
      ready,
      cloud: cloudEnabled,
      syncing,
      error,
      dismissError,
      refresh: () => void refresh(true),
    }),
    [
      me,
      updateProfile,
      events,
      visible,
      filter,
      activeId,
      joined,
      isJoined,
      toggleJoin,
      rosterOf,
      spotsLeft,
      addEvent,
      removeEvent,
      hostedByMe,
      myDrops,
      ready,
      syncing,
      error,
      dismissError,
      refresh,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Uniform random inside a range */
function randomIn(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** The shared board has no uploads yet — a deterministic placeholder keeps cards warm. */
function coverFor(seed: string) {
  return `https://picsum.photos/seed/agrijump-${seed}/900/1200`;
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
