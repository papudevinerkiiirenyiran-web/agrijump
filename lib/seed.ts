import raw from '@/data/events.json';
import type { CampusEvent } from './types';

/**
 * Demo only: shifts the sample data time anchor to "today"
 * so cards always read Tonight / Tomorrow instead of stale dates.
 * Once a real backend (Supabase / Sheets) is wired up, drop the rebaseToToday() call.
 */
const DEMO_ANCHOR = '2026-09-26T00:00';

export function rebaseToToday(events: CampusEvent[]): CampusEvent[] {
  const anchor = new Date(DEMO_ANCHOR).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delta = today.getTime() - anchor;
  if (Math.abs(delta) < 86_400_000) return events; // Same day, nothing to shift

  return events.map((e) => {
    const d = new Date(e.startsAt);
    d.setTime(d.getTime() + delta);
    const pad = (n: number) => String(n).padStart(2, '0');
    const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return { ...e, startsAt: iso };
  });
}

/** Seed data (time-rebased) */
export const seedEvents: CampusEvent[] = rebaseToToday(raw as CampusEvent[]);
