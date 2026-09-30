'use client';

import { useEffect } from 'react';

/**
 * iOS Safari reports `100vh` as the *largest* viewport (address bar collapsed),
 * which pushes fixed UI off screen while the bar is visible.
 * We publish the real visual viewport height as `--vh` (1% of it) and let CSS
 * fall back to it when `dvh` is unavailable (iOS < 16.4).
 */
export default function ViewportSync() {
  useEffect(() => {
    const apply = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
    };

    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', apply);
    window.visualViewport?.addEventListener('resize', apply);

    // iOS fires resize late after the address bar animates
    const t = setTimeout(apply, 300);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', apply);
      window.removeEventListener('orientationchange', apply);
      window.visualViewport?.removeEventListener('resize', apply);
    };
  }, []);

  return null;
}
