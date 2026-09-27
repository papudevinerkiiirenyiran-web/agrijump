import { CATEGORY_MAP } from './types';
import type { CampusEvent, Participant, RawEventRow } from './types';

/**
 * Backend adapter: turns "dirty" Supabase / Google Sheets rows into the clean frontend shape.
 * Swapping backends only touches this file — the UI stays untouched.
 */

function toNumber(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

function parseParticipants(s: string | undefined, host: Participant): Participant[] {
  if (!s) return [host];
  // Accepts a JSON array or the lazy "Luca,Yuki,Sam" form
  let names: string[] = [];
  try {
    const parsed = JSON.parse(s);
    names = Array.isArray(parsed)
      ? parsed.map((p: string | Participant) =>
          typeof p === 'string' ? p : p.name
        )
      : [];
  } catch {
    names = s.split(/[,|]/).map((n) => n.trim()).filter(Boolean);
  }
  if (!names.length) return [host];
  return [
    host,
    ...names
      .filter((n) => n !== host.name)
      .map((n, i) => ({
        id: `p_${i}_${n.toLowerCase().replace(/\s+/g, '')}`,
        name: n,
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
          n
        )}&backgroundColor=c0d0a2`,
      })),
  ];
}

export function rowToEvent(row: RawEventRow, index = 0): CampusEvent {
  const cat = (row.category ?? 'social').toLowerCase();
  const meta = CATEGORY_MAP[cat];
  const host: Participant = {
    id: `host_${index}`,
    name: row.host_name ?? 'AgriJump Host',
    avatar:
      row.host_avatar ??
      `https://api.dicebear.com/7.x/notionists/svg?seed=${
        row.host_name ?? 'host'
      }&backgroundColor=ffd3a3`,
    bio: row.host_bio ?? 'Campus host',
  };

  return {
    id: row.id ?? `evt_${index}`,
    title: row.title,
    tagline: row.tagline ?? 'Just dropped on campus',
    description: row.description ?? '',
    category: (meta?.id ?? 'social') as CampusEvent['category'],
    emoji: row.emoji ?? meta?.emoji ?? '📍',
    location: {
      name: row.place_name ?? 'Agripolis',
      lat: toNumber(row.lat, 45.3461),
      lng: toNumber(row.lng, 11.9536),
    },
    startsAt: row.starts_at,
    durationMin: toNumber(row.duration_min, 120),
    capacity: toNumber(row.capacity, 20),
    host,
    participants: parseParticipants(row.participants, host),
    cover:
      row.cover ??
      `https://picsum.photos/seed/${encodeURIComponent(row.title)}/900/1200`,
    vibe: row.vibe ? row.vibe.split(/[|·,]/).map((v) => v.trim()).filter(Boolean) : [],
  };
}

export function rowsToEvents(rows: RawEventRow[]): CampusEvent[] {
  return rows.map(rowToEvent);
}
