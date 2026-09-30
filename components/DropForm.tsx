'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Capsule } from './CapsuleTag';
import { useEvents, type NewDropInput } from '@/lib/store';
import { CAMPUS_CENTER, CATEGORIES } from '@/lib/types';
import type { CategoryId } from '@/lib/types';

/** Leaflet touches `window`, so this one can never render on the server */
const LocationPicker = dynamic(() => import('./LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="grid h-52 w-full place-items-center rounded-2xl bg-moss-100 dark:bg-ink-800">
      <span className="animate-pulse font-display text-[12px] font-bold text-moss-700 dark:text-moss-200">
        Loading map…
      </span>
    </div>
  ),
});

const DEFAULTS = {
  category: 'social' as CategoryId,
  durationMin: 90,
  capacity: 12,
};

/**
 * "Drop your own" form — publishes to the shared board.
 * The host names the place and taps its exact spot anywhere in Legnaro.
 */
export default function DropForm() {
  const router = useRouter();
  const { addEvent, error: cloudError } = useEvents();
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId>(DEFAULTS.category);
  const [placeName, setPlaceName] = useState('');
  // Default to the campus — that's where most drops happen. The pin can be
  // dragged anywhere in the Legnaro area from there.
  const [spot, setSpot] = useState<{ lat: number; lng: number }>({
    lat: CAMPUS_CENTER.lat,
    lng: CAMPUS_CENTER.lng,
  });
  const [spotTouched, setSpotTouched] = useState(false);
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date(Date.now() + 3 * 3600_000);
    d.setMinutes(0, 0, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:00`;
  });
  const [durationMin, setDurationMin] = useState(DEFAULTS.durationMin);
  const [capacity, setCapacity] = useState(DEFAULTS.capacity);
  const [vibeRaw, setVibeRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    title.trim().length >= 3 &&
    placeName.trim().length >= 2 &&
    startsAt.length >= 16 &&
    !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const vibe = vibeRaw
      .split(/[|·,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    const input: NewDropInput = {
      title,
      tagline,
      description,
      category,
      placeName,
      startsAt,
      durationMin,
      capacity,
      vibe,
      lat: spot.lat,
      lng: spot.lng,
    };
    try {
      const id = await addEvent(input);
      router.push(`/e/${id}`);
    } catch {
      // The store already explained the failure — let the user retry.
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="What's the drop?" hint="A clear, short title">
        <input
          required
          minLength={3}
          maxLength={60}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sunset rooftop chess"
          className="aj-input"
        />
      </Field>

      <Field label="One-line tagline">
        <input
          maxLength={80}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="Bring your board and your best opening"
          className="aj-input"
        />
      </Field>

      <Field label="Tell people about it">
        <textarea
          rows={4}
          maxLength={400}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Two sentences is plenty. Who is it for, what do they need, what do they walk away with."
          className="aj-input resize-none"
        />
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={
                'capsule transition active:scale-95 ' +
                (category === c.id
                  ? 'bg-moss-600 text-white dark:bg-moss-400 dark:text-moss-900'
                  : 'bg-paper-200 text-ink-500 dark:bg-ink-700 dark:text-paper-200/70')
              }
            >
              <span aria-hidden>{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Where" hint="A name people will recognise">
        <input
          required
          minLength={2}
          maxLength={80}
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="Piazza del Mercato"
          className="aj-input"
        />
      </Field>

      <Field label="Exact spot" hint="Tap the map — the pin follows your finger">
        <LocationPicker
          lat={spot.lat}
          lng={spot.lng}
          onChange={(lat, lng) => {
            setSpot({ lat, lng });
            setSpotTouched(true);
          }}
        />
      </Field>

      <div className="grid grid-cols-3 gap-2.5">
        <Field label="When">
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="aj-input"
          />
        </Field>
        <Field label="Duration">
          <select
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            className="aj-input"
          >
            <option value={30}>30 min</option>
            <option value={60}>1 h</option>
            <option value={90}>1.5 h</option>
            <option value={120}>2 h</option>
            <option value={180}>3 h</option>
            <option value={240}>4 h</option>
          </select>
        </Field>
        <Field label="Capacity">
          <input
            required
            type="number"
            min={2}
            max={999}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="aj-input"
          />
        </Field>
      </div>

      <Field label="Vibe tags" hint="Comma separated, up to six">
        <input
          value={vibeRaw}
          onChange={(e) => setVibeRaw(e.target.value)}
          placeholder="Beginner friendly, BYO cup"
          className="aj-input"
        />
      </Field>

      {cloudError && (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {cloudError}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Capsule tone={spotTouched ? 'moss' : 'neutral'}>
          <span aria-hidden>📍</span>
          {spotTouched
            ? `Pinned ${spot.lat.toFixed(4)}, ${spot.lng.toFixed(4)}`
            : 'Pin starts on campus'}
        </Capsule>
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-12 items-center gap-2 rounded-[16px] bg-gradient-to-r from-sunset-400 via-sunset-500 to-sunset-600 px-6 font-display text-[15px] font-extrabold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          <span aria-hidden>🚀</span>
          Drop it
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-400 dark:text-paper-300/60">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-ink-400 dark:text-paper-300/50">{hint}</span>}
    </label>
  );
}