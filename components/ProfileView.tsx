'use client';

import { useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import { Capsule } from './CapsuleTag';
import { avatarFor, useEvents } from '@/lib/store';
import { CATEGORY_MAP } from '@/lib/types';
import type { CampusEvent, Participant } from '@/lib/types';
import { whenLabel } from '@/lib/time';

/**
 * Profile view — the user's identity plus the drops they joined / host.
 * Name, field of study and bio are editable and persisted locally.
 */
export default function ProfileView() {
  const { me, updateProfile, myDrops, hostedByMe, joined, events, removeEvent, error } =
    useEvents();
  const [tab, setTab] = useState<'mine' | 'hosted'>('mine');
  const [editing, setEditing] = useState(false);

  const list = tab === 'mine' ? myDrops : hostedByMe;

  return (
    <div className="pb-12">
      {/* Identity card — view or edit */}
      {editing ? (
        <ProfileEditor
          me={me}
          onSave={(patch) => {
            updateProfile(patch);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <IdentityCard
          me={me}
          joinedCount={joined.length}
          hostedCount={hostedByMe.length}
          total={events.length}
          onEdit={() => setEditing(true)}
        />
      )}

      {error && (
        <p className="mx-4 mt-4 rounded-2xl bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="mx-4 mt-5 flex rounded-full bg-paper-200 p-1 dark:bg-ink-800">
        <TabButton on={tab === 'mine'} onClick={() => setTab('mine')}>
          My drops
          <span className="ml-2 rounded-full bg-black/10 px-1.5 text-[10px] font-extrabold dark:bg-white/10">
            {myDrops.length}
          </span>
        </TabButton>
        <TabButton on={tab === 'hosted'} onClick={() => setTab('hosted')}>
          Hosting
          <span className="ml-2 rounded-full bg-black/10 px-1.5 text-[10px] font-extrabold dark:bg-white/10">
            {hostedByMe.length}
          </span>
        </TabButton>
      </div>

      {/* List */}
      <div className="mx-4 mt-4 flex flex-col gap-2.5">
        {list.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          list.map((e) => (
            <DropRow
              key={e.id}
              event={e}
              hostOwned={e.host.id === me.id}
              onDelete={() => removeEvent(e.id)}
            />
          ))
        )}
      </div>

      {/* Drop your own */}
      <div className="mx-4 mt-6">
        <Link
          href="/drop/new"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-moss-300 py-4 font-display text-[15px] font-extrabold text-moss-700 transition active:scale-[0.98] dark:border-moss-600 dark:text-moss-200"
        >
          <span aria-hidden>＋</span> Drop your own
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Identity card (read-only)                                           */
/* ------------------------------------------------------------------ */

function IdentityCard({
  me,
  joinedCount,
  hostedCount,
  total,
  onEdit,
}: {
  me: Participant;
  joinedCount: number;
  hostedCount: number;
  total: number;
  onEdit: () => void;
}) {
  return (
    <div className="mx-4 mt-5 rounded-card bg-gradient-to-br from-moss-600 to-moss-800 p-5 text-paper-100 shadow-soft-lg">
      <div className="flex items-center gap-4">
        <Avatar src={me.avatar} name={me.name} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[20px] font-extrabold leading-tight">
            {me.name}
          </p>
          <p className="mt-0.5 truncate text-[12px] opacity-85">
            {me.major?.trim() ? me.major : 'Add your field of study'}
          </p>
          <p className="mt-0.5 text-[11px] opacity-60">Legnaro · Veneto</p>
        </div>
        <button
          onClick={onEdit}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 text-[15px] transition active:scale-95"
          aria-label="Edit profile"
        >
          ✏️
        </button>
      </div>

      {me.bio?.trim() ? (
        <p className="mt-3 rounded-2xl bg-black/15 px-3 py-2 text-[12px] leading-snug opacity-90">
          {me.bio}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat value={joinedCount} label="Joined" />
        <Stat value={hostedCount} label="Hosted" />
        <Stat value={total} label="Live drops" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Identity editor                                                     */
/* ------------------------------------------------------------------ */

function ProfileEditor({
  me,
  onSave,
  onCancel,
}: {
  me: Participant;
  onSave: (patch: Partial<Omit<Participant, 'id'>>) => void;
  onCancel: () => void;
}) {
  // "You" is the placeholder name — start empty so the field is obvious
  const [name, setName] = useState(me.name === 'You' ? '' : me.name);
  const [major, setMajor] = useState(me.major ?? '');
  const [bio, setBio] = useState(me.bio ?? '');
  const [avatar, setAvatar] = useState(me.avatar);

  const canSave = name.trim().length >= 2;

  const shuffle = () => {
    setAvatar(avatarFor(Math.random().toString(36).slice(2, 9)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({
      name: name.trim(),
      major: major.trim(),
      bio: bio.trim(),
      avatar,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mx-4 mt-5 rounded-card bg-white p-5 shadow-soft-lg dark:bg-ink-800"
    >
      <p className="font-display text-[11px] font-extrabold uppercase tracking-widest text-moss-600 dark:text-moss-300">
        Your profile
      </p>

      {/* Avatar + shuffle */}
      <div className="mt-3 flex items-center gap-3">
        <Avatar src={avatar} name={name || 'You'} size={56} />
        <button
          type="button"
          onClick={shuffle}
          className="flex items-center gap-1.5 rounded-full bg-paper-200 px-3 py-2 font-display text-[12px] font-extrabold text-ink-600 transition active:scale-95 dark:bg-ink-700 dark:text-paper-200"
        >
          <span aria-hidden>🎲</span> Shuffle avatar
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-400 dark:text-paper-300/60">
            Your name
          </span>
          <input
            required
            minLength={2}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yiran Qian"
            className="aj-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-400 dark:text-paper-300/60">
            Field of study
          </span>
          <input
            maxLength={60}
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="Italian Food and Wine, MSc"
            className="aj-input"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-ink-400 dark:text-paper-300/60">
            Short bio <span className="normal-case opacity-60">(optional)</span>
          </span>
          <textarea
            rows={2}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Three years of frisbee · always short one lefty"
            className="aj-input resize-none"
          />
        </label>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-[16px] bg-paper-200 font-display text-[14px] font-extrabold text-ink-600 transition active:scale-[0.98] dark:bg-ink-700 dark:text-paper-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className="h-12 flex-[1.4] rounded-[16px] bg-gradient-to-r from-sunset-400 via-sunset-500 to-sunset-600 font-display text-[15px] font-extrabold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
        >
          Save profile
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-card bg-white/10 px-2 py-2 backdrop-blur">
      <p className="font-display text-[20px] font-extrabold leading-none">{value}</p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest opacity-80">
        {label}
      </p>
    </div>
  );
}

function TabButton({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex-1 rounded-full py-2 font-display text-[13px] font-extrabold transition active:scale-[0.98] ' +
        (on
          ? 'bg-white text-ink-700 shadow-sm dark:bg-ink-700 dark:text-paper-100'
          : 'text-ink-400 dark:text-paper-300/60')
      }
    >
      {children}
    </button>
  );
}

function DropRow({
  event,
  hostOwned,
  onDelete,
}: {
  event: CampusEvent;
  hostOwned: boolean;
  onDelete: () => void;
}) {
  const meta = CATEGORY_MAP[event.category];
  const when = whenLabel(event.startsAt);

  const confirmDelete = () => {
    if (window.confirm(`Cancel “${event.title}”? It disappears for everyone.`)) onDelete();
  };

  return (
    <div className="flex items-center gap-3 rounded-card bg-white p-3 shadow-soft dark:bg-ink-800">
      <Link
        href={`/e/${event.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 transition active:scale-[0.99]"
      >
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl"
          style={{ backgroundColor: `${meta.color}1A` }}
          aria-hidden
        >
          {event.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[14px] font-extrabold text-ink-700 dark:text-paper-100">
            {event.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-ink-400 dark:text-paper-300/60">
            {when.day} {when.time} · {event.location.name}
          </p>
        </div>
      </Link>

      {/* Only the host sees this — the database enforces it too. */}
      {hostOwned ? (
        <button
          type="button"
          onClick={confirmDelete}
          aria-label={`Cancel ${event.title} — you are hosting this`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-[15px] transition active:scale-95 dark:bg-red-950/50"
        >
          <span aria-hidden>🗑️</span>
        </button>
      ) : (
        <Capsule tone="accent">Joined</Capsule>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: 'mine' | 'hosted' }) {
  if (tab === 'hosted') {
    return (
      <div className="rounded-card bg-white p-6 text-center shadow-soft dark:bg-ink-800">
        <p className="text-3xl" aria-hidden>
          ✨
        </p>
        <p className="mt-2 font-display text-[15px] font-extrabold text-ink-700 dark:text-paper-100">
          Nothing hosted yet
        </p>
        <p className="mt-1 text-[12px] text-ink-400 dark:text-paper-300/60">
          Pin a new hangout — your friends can join in one tap.
        </p>
        <Link
          href="/drop/new"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-moss-600 px-4 py-2 font-display text-[13px] font-extrabold text-white"
        >
          <span aria-hidden>🚀</span> Drop your own
        </Link>
      </div>
    );
  }
  return (
    <div className="rounded-card bg-white p-6 text-center shadow-soft dark:bg-ink-800">
      <p className="text-3xl" aria-hidden>
        🥏
      </p>
      <p className="mt-2 font-display text-[15px] font-extrabold text-ink-700 dark:text-paper-100">
        No drops yet
      </p>
      <p className="mt-1 text-[12px] text-ink-400 dark:text-paper-300/60">
        Hit &quot;Drop In&quot; on anything that catches your eye.
      </p>
    </div>
  );
}