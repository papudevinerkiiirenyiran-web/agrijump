/**
 * AgriJump — core data contract
 * ---------------------------------------------------------------
 * This is the single "clean JSON" contract shared by frontend and backend (or Supabase / Google Sheets).
 * As long as the backend emits CampusEvent[] JSON, no component needs to change.
 */

export type CategoryId =
  | 'sports'
  | 'food'
  | 'study'
  | 'music'
  | 'social'
  | 'outdoor';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
  /** Accent colour used by the pin and the tag (HEX) */
  color: string;
}

/** Participant — used by both the Facepile and the host block */
export interface Participant {
  id: string;
  name: string;
  /** Avatar URL (DiceBear or Supabase Storage both work) */
  avatar: string;
  /** Field of study / job, e.g. "Agronomy, 3rd year" */
  major?: string;
  /** Short bio, host only */
  bio?: string;
}

/** A "drop" — one jumpable point on the map */
export interface CampusEvent {
  id: string;
  title: string;
  /** One-line subtitle shared by the card and the detail page */
  tagline: string;
  description: string;
  category: CategoryId;
  /** Emoji shown on the map pin (frisbee / coffee / guitar…) */
  emoji: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  /** Local-time ISO string, e.g. 2026-09-26T18:30 */
  startsAt: string;
  durationMin: number;
  capacity: number;
  host: Participant;
  participants: Participant[];
  cover: string;
  /** Vibe tags, e.g. ["Beginner friendly", "Bring a disc"] */
  vibe: string[];
}

/** Supabase / Google Sheets row → CampusEvent entry point (see lib/adapters.ts) */
export interface RawEventRow {
  id?: string;
  title: string;
  tagline?: string;
  description?: string;
  category?: string;
  emoji?: string;
  place_name?: string;
  lat: number | string;
  lng: number | string;
  starts_at: string;
  duration_min?: number | string;
  capacity?: number | string;
  host_name?: string;
  host_avatar?: string;
  host_bio?: string;
  participants?: string; // JSON array or "A,B,C"
  cover?: string;
  vibe?: string; // "Beginner friendly|Bring a disc"
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'sports', label: 'Sports', emoji: '🥏', color: '#6A8343' },
  { id: 'food', label: 'Food', emoji: '☕', color: '#C64E0A' },
  { id: 'study', label: 'Study', emoji: '📚', color: '#4C6E8A' },
  { id: 'music', label: 'Music', emoji: '🎸', color: '#8A5A9E' },
  { id: 'social', label: 'Social', emoji: '🍻', color: '#D08A1E' },
  { id: 'outdoor', label: 'Outdoor', emoji: '🌿', color: '#3F7D5A' },
];

export const CATEGORY_MAP: Record<string, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);

/**
 * The area AgriJump covers: the whole comune of Legnaro (Province of Padua).
 *
 * Agripolis sits inside it, so the campus is still covered — but drops can
 * also happen in the town centre, at the station, in the frazioni, etc.
 * Bounds carry a small margin so pins on the edge of town aren't clipped.
 */
export const LEGNARO = {
  name: 'Legnaro',
  center: { lat: 45.3424, lng: 11.9542 },
  bounds: {
    south: 45.323,
    north: 45.362,
    west: 11.926,
    east: 11.982,
  },
  /** Framing that shows the whole comune on a phone (~4.4 km wide) */
  townZoom: 13,
  /** Framing for a single drop */
  closeZoom: 16,
  minZoom: 11,
  maxZoom: 18,
} as const;

/** Landmark inside Legnaro — the Agripolis campus (University of Padova) */
export const CAMPUS_CENTER: { lat: number; lng: number; name: string } = {
  lat: 45.3461,
  lng: 11.9536,
  name: 'Agripolis Campus',
};

/** Clamp a point into the Legnaro area. */
export function clampToLegnaro(lat: number, lng: number) {
  return {
    lat: Math.min(LEGNARO.bounds.north, Math.max(LEGNARO.bounds.south, lat)),
    lng: Math.min(LEGNARO.bounds.east, Math.max(LEGNARO.bounds.west, lng)),
  };
}

/** True when a point falls inside the Legnaro area. */
export function inLegnaro(lat: number, lng: number) {
  return (
    lat >= LEGNARO.bounds.south &&
    lat <= LEGNARO.bounds.north &&
    lng >= LEGNARO.bounds.west &&
    lng <= LEGNARO.bounds.east
  );
}
