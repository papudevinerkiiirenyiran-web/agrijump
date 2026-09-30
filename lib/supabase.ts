'use client';

/**
 * AgriJump — shared board on Supabase
 * ---------------------------------------------------------------
 * The app has NO sign-up wall on purpose: a friend should be able to
 * open the link, see the drops and tap "Drop In" without creating an
 * account. So identity is a random per-device id kept in localStorage,
 * and the database is public-read / public-insert (see supabase/schema.sql).
 *
 * Configure with two environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 * The anon key is designed to be public — row level security is what
 * actually protects the data.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CATEGORY_MAP } from './types';
import type { CampusEvent, CategoryId, Participant } from './types';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** True when both environment variables are present. */
export const cloudEnabled = Boolean(URL && ANON_KEY);

let client: SupabaseClient | null = null;

/** Shared client. Throws when the app is not configured yet. */
export function db(): SupabaseClient {
  if (!client) {
    if (!cloudEnabled) throw new Error('Supabase is not configured');
    client = createClient(URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/* ------------------------------------------------------------------ */
/*  Device identity                                                    */
/* ------------------------------------------------------------------ */

const DEVICE_KEY = 'agrijump.device.v1';

/**
 * A stable random id for this browser.
 *
 * `crypto.randomUUID` only exists in a secure context, and the dev server
 * is often opened over plain http on a LAN IP — so keep a fallback.
 */
export function deviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = window.localStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
    const fresh = `d_${randomId()}`;
    window.localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    return `d_${randomId()}`;
  }
}

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
  } catch {
    /* not a secure context — fall through */
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/* ------------------------------------------------------------------ */
/*  Ownership secret                                                   */
/* ------------------------------------------------------------------ */

const OWNER_KEY = 'agrijump.owner.v1';

/** Kept in memory when localStorage is unavailable, so delete still works. */
let memorySecret = '';

/**
 * A private secret that proves "this drop is mine".
 *
 * It never leaves the device and is never written to a publicly readable
 * column, so nobody can cancel your drops for you.
 */
export function ownerSecret(): string {
  if (typeof window === 'undefined') return '';
  try {
    const saved = window.localStorage.getItem(OWNER_KEY);
    if (saved) return saved;
    const fresh = `${randomId()}${randomId()}`;
    window.localStorage.setItem(OWNER_KEY, fresh);
    return fresh;
  } catch {
    if (!memorySecret) memorySecret = `${randomId()}${randomId()}`;
    return memorySecret;
  }
}

/* ------------------------------------------------------------------ */
/*  Row shapes                                                         */
/* ------------------------------------------------------------------ */

export interface DropRow {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  emoji: string;
  place_name: string;
  lat: number;
  lng: number;
  starts_at: string;
  duration_min: number;
  capacity: number;
  host_id: string;
  host_name: string;
  host_major: string | null;
  host_avatar: string | null;
  host_bio: string | null;
  cover: string;
  vibe: string[] | null;
  created_at: string;
}

export interface JoinRow {
  drop_id: string;
  user_id: string;
  name: string;
  major: string | null;
  avatar: string | null;
}

/** Everything needed to create a drop row. */
export interface NewDropPayload {
  title: string;
  tagline: string;
  description: string;
  category: CategoryId;
  emoji: string;
  place_name: string;
  lat: number;
  lng: number;
  starts_at: string;
  duration_min: number;
  capacity: number;
  host_id: string;
  host_name: string;
  host_major: string | null;
  host_avatar: string | null;
  host_bio: string | null;
  cover: string;
  vibe: string[];
}

/* ------------------------------------------------------------------ */
/*  Mapping                                                            */
/* ------------------------------------------------------------------ */

/** timestamptz → the local "YYYY-MM-DDTHH:mm" shape the UI expects. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function rowToEvent(row: DropRow, joins: JoinRow[]): CampusEvent {
  const meta = CATEGORY_MAP[row.category] ?? CATEGORY_MAP.social;
  const host: Participant = {
    id: row.host_id,
    name: row.host_name || 'Someone',
    avatar: row.host_avatar || '',
    major: row.host_major ?? undefined,
    bio: row.host_bio ?? undefined,
  };
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    category: meta.id as CategoryId,
    emoji: row.emoji || meta.emoji,
    location: { name: row.place_name, lat: row.lat, lng: row.lng },
    startsAt: toLocalInput(row.starts_at),
    durationMin: row.duration_min,
    capacity: row.capacity,
    host,
    // The host is shown separately, so keep them out of the facepile.
    participants: joins
      .filter((j) => j.drop_id === row.id && j.user_id !== row.host_id)
      .map((j) => ({
        id: j.user_id,
        name: j.name || 'Someone',
        avatar: j.avatar || '',
        major: j.major ?? undefined,
      })),
    cover: row.cover,
    vibe: row.vibe ?? [],
  };
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

/** How far back the board still shows a finished drop. */
const LOOKBACK_HOURS = 12;
/** Hard cap so the map never pulls an unbounded list. */
const BOARD_LIMIT = 300;

/** Read every drop that is upcoming or recently finished, plus its roster. */
export async function fetchBoard(): Promise<CampusEvent[]> {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000).toISOString();

  const { data: rows, error } = await db()
    .from('drops')
    .select('*')
    .gte('starts_at', since)
    .order('starts_at', { ascending: true })
    .limit(BOARD_LIMIT);

  if (error) throw error;
  const drops = (rows ?? []) as DropRow[];
  if (!drops.length) return [];

  const { data: joins, error: joinError } = await db()
    .from('drop_joins')
    .select('drop_id, user_id, name, major, avatar')
    .in('drop_id', drops.map((d) => d.id));

  if (joinError) throw joinError;

  const roster = (joins ?? []) as JoinRow[];
  return drops.map((row) => rowToEvent(row, roster));
}

/** Create a drop and return it mapped for the UI. */
export async function insertDrop(payload: NewDropPayload): Promise<CampusEvent> {
  const { data, error } = await db().from('drops').insert(payload).select().single();
  if (error) throw error;
  const created = data as DropRow;

  // Register ownership so the host can cancel later. Best-effort: if this
  // fails the drop still exists, it just cannot be cancelled from the app.
  const { error: claimError } = await db()
    .from('drop_owners')
    .insert({ drop_id: created.id, secret: ownerSecret() });
  if (claimError) {
    console.warn('[AgriJump] could not register drop ownership:', claimError.message);
  }

  return rowToEvent(created, []);
}

/** Tap "Drop In". Re-joining the same drop is a no-op. */
export async function insertJoin(dropId: string, who: Participant): Promise<void> {
  const { error } = await db()
    .from('drop_joins')
    .upsert(
      {
        drop_id: dropId,
        user_id: who.id,
        name: who.name,
        major: who.major ?? null,
        avatar: who.avatar || null,
      },
      { onConflict: 'drop_id,user_id', ignoreDuplicates: true }
    );
  if (error) throw error;
}

/** Leave a drop again. */
export async function removeJoin(dropId: string, userId: string): Promise<void> {
  const { error } = await db()
    .from('drop_joins')
    .delete()
    .eq('drop_id', dropId)
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * Cancel one of your own drops.
 *
 * Goes through a security-definer Postgres function that checks the
 * ownership secret, so the client never gets blanket delete rights.
 * Resolves true when a row was actually removed.
 */
export async function deleteOwnDrop(dropId: string): Promise<boolean> {
  const { data, error } = await db().rpc('delete_own_drop', {
    p_drop_id: dropId,
    p_secret: ownerSecret(),
  });
  if (error) throw error;
  return Number(data ?? 0) > 0;
}

/* ------------------------------------------------------------------ */
/*  Errors                                                             */
/* ------------------------------------------------------------------ */

/** Turn a Postgres / network failure into something a student can act on. */
export function describeError(err: unknown): string {
  const e = err as { message?: string; code?: string } | null;
  const code = e?.code;

  if (code === '42P01') return 'Database tables are missing — run the SQL setup file.';
  if (code === '42501') return 'Permission denied — check the row level security policies.';
  if (code === '23505') return 'That was already saved.';

  const msg = e?.message ?? String(err ?? '');
  if (code === 'PGRST202' || /could not find the function|delete_own_drop/i.test(msg)) {
    return 'Cancelling needs the add-on SQL — run migration-delete-own-drop.sql.';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'You are offline.';
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'Cannot reach the shared board. Check your connection.';
  }
  if (/supabase is not configured/i.test(msg)) {
    return 'The shared board is not set up yet.';
  }
  return msg || 'Something went wrong.';
}
