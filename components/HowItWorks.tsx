'use client';

/**
 * Compact "how it works" strip for the "Drops near you" panel.
 *
 * It sits under the heading permanently, not only in the empty state, so
 * the instructions survive the moment the board has anything on it.
 *
 * That is the whole point: filling an empty board with demo drops to make
 * it look alive hides the guide and teaches a newcomer nothing. Three
 * numbered words under the heading do the job honestly, without
 * pretending somebody already posted.
 */
const STEPS = ['Pick what', 'Set when & where', 'Friends jump in'];

export default function HowItWorks() {
  return (
    <ol className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-1.5">
          {i > 0 && (
            <span
              aria-hidden
              className="text-[10px] font-bold text-moss-400 dark:text-moss-500"
            >
              →
            </span>
          )}
          <span
            aria-hidden
            className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full bg-moss-600 font-display text-[9px] font-extrabold leading-none text-white dark:bg-moss-500 dark:text-ink-900"
          >
            {i + 1}
          </span>
          <span className="text-[11px] font-semibold text-ink-500 dark:text-paper-300/75">
            {label}
          </span>
        </li>
      ))}
    </ol>
  );
}
