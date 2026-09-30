import Link from 'next/link';
import DropForm from '@/components/DropForm';

/** "Drop your own" — create a new event pinned anywhere in Legnaro. */
export default function NewDropPage() {
  return (
    <div className="relative min-h-app bg-paper-100 pb-12 pt-safe dark:bg-ink-900">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-black/5 bg-paper-100/85 px-4 pb-3 pt-3 backdrop-blur-md dark:border-white/5 dark:bg-ink-900/85">
        <Link
          href="/"
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-700 shadow-soft transition active:scale-95 dark:bg-ink-800 dark:text-paper-100"
        >
          ←
        </Link>
        <h1 className="font-display text-[18px] font-extrabold text-ink-700 dark:text-paper-100">
          Drop your own
        </h1>
      </header>

      <main className="px-4 pt-5">
        <p className="mb-4 text-[13px] text-ink-400 dark:text-paper-300/60">
          Pin a new hangout to the map. It will appear instantly — share the link
          and people can jump in.
        </p>
        <DropForm />
      </main>
    </div>
  );
}