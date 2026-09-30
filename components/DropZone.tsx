'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Avatar from './Avatar';
import SendItBar from './SendItBar';
import { Capsule } from './CapsuleTag';
import { useEvent } from '@/lib/store';
import { CATEGORY_MAP } from '@/lib/types';
import { endTime, whenLabel } from '@/lib/time';

/**
 * The Drop Zone — event detail screen
 * Full-bleed hero + gradient scrim + white headline / host / Facepile / bottom FAB
 */
export default function DropZone({ id }: { id: string }) {
  const router = useRouter();
  const { event, roster, spotsLeft, joined } = useEvent(id);
  const [copied, setCopied] = useState(false);

  if (!event) {
    return (
      <div className="grid min-h-app place-items-center px-8 text-center">
        <div>
          <p className="text-5xl" aria-hidden>
            🥏
          </p>
          <h1 className="mt-4 text-2xl">This drop is gone.</h1>
          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-full bg-moss-600 px-6 py-3 font-display font-extrabold text-white"
          >
            Back to the map
          </button>
        </div>
      </div>
    );
  }

  const meta = CATEGORY_MAP[event.category];
  const when = whenLabel(event.startsAt);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.location.lat},${event.location.lng}`;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.tagline, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* User cancelled */
    }
  };

  return (
    <div className="relative min-h-app">
      {/* Immersive hero */}
      <div className="relative h-[46vh] w-full overflow-hidden bg-moss-700">
        <div
          className="absolute inset-0 bg-gradient-to-br from-moss-600 via-moss-700 to-ink-800"
          aria-hidden
        />
        {event.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover}
            alt={event.title}
            className="relative h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        )}
        {/* Subtle black gradient scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/45"
          aria-hidden
        />

        {/* Top bar */}
        <div className="absolute inset-x-4 top-3 z-10 flex items-center justify-between pt-safe">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            ←
          </button>
          <button
            onClick={share}
            aria-label="Share"
            className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition active:scale-95"
          >
            {copied ? '✓' : '↗'}
          </button>
        </div>

        {/* Headline block */}
        <div className="absolute inset-x-5 bottom-5 z-10">
          <div className="mb-2.5 flex items-center gap-2">
            <Capsule tone="glass">
              <span aria-hidden>{meta.emoji}</span> {meta.label}
            </Capsule>
            <Capsule tone="glass">
              {when.soon ? '🔥' : '🕒'} {when.day} {when.time}
            </Capsule>
          </div>
          <h1 className="font-display text-[34px] font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.45)]">
            {event.title}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-white/85">
            <span aria-hidden>{event.emoji}</span>
            {event.location.name}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="relative -mt-7 rounded-t-sheet bg-paper-100 px-4 pb-[200px] pt-6 dark:bg-ink-900">
        {/* Host */}
        <div className="flex items-center gap-3 rounded-card bg-white p-3.5 shadow-soft dark:bg-ink-800">
          <Avatar src={event.host.avatar} name={event.host.name} size={52} />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-400 dark:text-paper-300/50">
              Hosted by
            </p>
            <p className="font-display text-[16px] font-extrabold text-ink-700 dark:text-paper-100">
              {event.host.name}
            </p>
            {event.host.major?.trim() ? (
              <p className="mt-0.5 truncate text-[12px] font-semibold text-moss-600 dark:text-moss-300">
                {event.host.major}
              </p>
            ) : null}
            {event.host.bio?.trim() ? (
              <p className="mt-0.5 truncate text-[12px] text-ink-400 dark:text-paper-300/60">
                {event.host.bio}
              </p>
            ) : null}
          </div>
        </div>

        {/* Key facts: three-up grid */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Info label="When" value={`${when.time} – ${endTime(event.startsAt, event.durationMin)}`} icon="🕒" />
          <Info label="Duration" value={`${Math.round(event.durationMin / 60 * 10) / 10} h`} icon="⏳" />
          <Info
            label="Spots"
            value={spotsLeft > 0 ? `${spotsLeft} left` : 'Full'}
            icon="🎟️"
          />
        </div>

        {/* Description */}
        <p className="mt-5 text-[14px] leading-relaxed text-ink-600 dark:text-paper-200/75">
          {event.description}
        </p>

        {/* Vibe tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {event.vibe.map((v) => (
            <Capsule key={v} tone="moss">
              {v}
            </Capsule>
          ))}
          <Capsule tone="accent">{meta.label}</Capsule>
        </div>

        {/* Participants */}
        <div className="mt-6">
          <h2 className="font-display text-[15px] font-extrabold text-ink-700 dark:text-paper-100">
            Who&apos;s in · {roster.length}/{event.capacity}
          </h2>
          <ul className="mt-2.5 divide-y divide-black/5 overflow-hidden rounded-card bg-white dark:divide-white/5 dark:bg-ink-800">
            {roster.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <Avatar src={p.avatar} name={p.name} size={34} />
                <span className="font-display text-[14px] font-bold text-ink-700 dark:text-paper-100">
                  {p.name}
                </span>
                {p.id === event.host.id && (
                  <span className="capsule bg-moss-100 text-moss-700 dark:bg-moss-700/30 dark:text-moss-200">
                    Host
                  </span>
                )}
                {p.id === 'u_me' && (
                  <span className="capsule ml-auto bg-sunset-100 text-sunset-700 dark:bg-sunset-700/25 dark:text-sunset-300">
                    You
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Directions */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-moss-300 py-3.5 font-display text-[15px] font-extrabold text-moss-700 transition active:scale-[0.98] dark:border-moss-600 dark:text-moss-200"
        >
          <span aria-hidden>🧭</span> Open in Maps
        </a>
      </div>

      {/* Bottom action area */}
      <SendItBar event={event} />
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-card bg-white p-3 shadow-soft dark:bg-ink-800">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink-400 dark:text-paper-300/50">
        <span aria-hidden>{icon}</span> {label}
      </p>
      <p className="mt-1 font-display text-[14px] font-extrabold leading-tight text-ink-700 dark:text-paper-100">
        {value}
      </p>
    </div>
  );
}
