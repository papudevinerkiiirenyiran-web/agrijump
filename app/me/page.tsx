import Link from 'next/link';
import ProfileView from '@/components/ProfileView';

/** Personal page — shows joined drops + drops hosted by the current user. */
export default function MePage() {
  return (
    <div className="relative min-h-app bg-paper-100 dark:bg-ink-900">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-paper-100/85 px-4 pb-3 pt-safe backdrop-blur-md dark:border-white/5 dark:bg-ink-900/85">
        <Link
          href="/"
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-700 shadow-soft transition active:scale-95 dark:bg-ink-800 dark:text-paper-100"
        >
          ←
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink-700 dark:text-paper-100">
          Profile
        </h1>
      </header>

      <ProfileView />
    </div>
  );
}