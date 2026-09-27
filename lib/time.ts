/** Time formatting: turn ISO strings into plain English (Tonight / Tomorrow / Sat 18:30) */

/** Parse a local-time ISO string ("2026-09-26T18:30") */
export function parseLocal(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function dayDiff(a: Date, b: Date) {
  return Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000
  );
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export interface WhenLabel {
  /** Tonight / Today / Tomorrow / Sat 27 Sep */
  day: string;
  /** 18:30 */
  time: string;
  /** Starting soon (less than 90 minutes away) */
  soon: boolean;
  /** Time remaining: "in 2h" / "in 3 days" */
  countdown: string;
}

export function whenLabel(iso: string, now = new Date()): WhenLabel {
  const d = parseLocal(iso);
  const diff = dayDiff(d, now);
  const hours = d.getHours();

  let day: string;
  if (diff === 0) day = hours >= 17 ? 'Tonight' : 'Today';
  else if (diff === 1) day = 'Tomorrow';
  else if (diff > 1 && diff < 7) day = WEEKDAYS[d.getDay()];
  else day = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  const time = `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;

  const minutesLeft = Math.round((d.getTime() - now.getTime()) / 60_000);
  const soon = minutesLeft > -30 && minutesLeft < 90;

  let countdown: string;
  if (minutesLeft < 0) countdown = 'Live now';
  else if (minutesLeft < 60) countdown = `in ${minutesLeft}m`;
  else if (minutesLeft < 60 * 24) countdown = `in ${Math.round(minutesLeft / 60)}h`;
  else countdown = `in ${Math.round(minutesLeft / (60 * 24))}d`;

  return { day, time, soon, countdown };
}

/** End time, used to render "18:30 – 20:30" */
export function endTime(iso: string, durationMin: number): string {
  const d = parseLocal(iso);
  d.setMinutes(d.getMinutes() + durationMin);
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}
