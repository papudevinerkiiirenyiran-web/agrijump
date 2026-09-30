'use client';

import Link from 'next/link';

/**
 * Welcome state shown when there are no drops yet.
 *
 * The point is to teach the user what "drops" are and to put the
 * "Drop your own" CTA in the most prominent place on the page.
 * No fake sample events — we want users to fill this themselves.
 */
export default function EmptyGuide() {
  return (
    <div className="flex h-full flex-col px-5 pt-1 pb-7">
      {/* Heading */}
      <div className="mb-5">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-moss-600 dark:text-moss-300">
          Welcome
        </p>
        <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-[1.05] text-ink-700 dark:text-paper-100">
          Your campus,<br />your drops.
        </h1>
        <p className="mt-2 text-[13px] leading-snug text-ink-400 dark:text-paper-300/60">
          Pin a hangout on campus — friends see it on the map and tap Drop In.
        </p>
      </div>

      {/* 3-step guide */}
      <ol className="space-y-2.5">
        <Step
          n={1}
          emoji="📍"
          title="Pick what"
          desc="Coffee, a run, study, an open mic — anything goes."
        />
        <Step
          n={2}
          emoji="🕒"
          title="Set when & where"
          desc="Two taps. Drop the pin on the map, set the hour."
        />
        <Step
          n={3}
          emoji="👥"
          title="Friends jump in"
          desc="They tap Drop In on your card. That's it."
        />
      </ol>

      {/* CTA */}
      <div className="mt-auto pt-6">
        <Link
          href="/drop/new"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sunset-500 px-5 py-4 font-display text-[16px] font-extrabold text-white shadow-[0_8px_24px_-6px_rgba(255,127,38,0.55)] transition active:scale-[0.98] active:shadow-[0_4px_14px_-4px_rgba(255,127,38,0.55)]"
        >
          <span aria-hidden>＋</span> Drop your own
        </Link>
        <p className="mt-3 text-center text-[11px] text-ink-400 dark:text-paper-300/60">
          Or drag the map around — it stays yours once you pin something.
        </p>
      </div>
    </div>
  );
}

function Step({
  n,
  emoji,
  title,
  desc,
}: {
  n: number;
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white/60 p-3 shadow-soft backdrop-blur-sm dark:bg-ink-800/70">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-moss-100 text-xl dark:bg-moss-800/60"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-display text-[10px] font-extrabold uppercase tracking-widest text-moss-600 dark:text-moss-300">
          Step {n}
        </span>
        <p className="font-display text-[14px] font-extrabold leading-tight text-ink-700 dark:text-paper-100">
          {title}
        </p>
        <p className="mt-0.5 text-[12px] leading-snug text-ink-400 dark:text-paper-300/60">
          {desc}
        </p>
      </div>
    </li>
  );
}