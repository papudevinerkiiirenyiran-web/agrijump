'use client';

import { useEffect, useState } from 'react';
import { THEME_KEY } from '@/lib/theme';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      /* noop */
    }
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid h-9 w-9 place-items-center rounded-full bg-white/85 text-[15px] shadow-sm backdrop-blur transition active:scale-95 dark:bg-ink-700/85"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}
