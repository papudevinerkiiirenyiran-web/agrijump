'use client';

import { useEffect } from 'react';

/**
 * Service worker lifecycle.
 *
 * Production → register (offline support + installable PWA).
 *
 * Development → actively UNREGISTER any previously installed worker and
 * drop its caches. This matters a lot on this project: the app is tested
 * from a phone over the LAN, and the Mac's IP changes between networks.
 * A cached shell keeps serving the old page while its JS chunks are
 * requested from a dead address — the UI then half-works and looks
 * broken. Self-healing here removes that whole class of bug.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Dev: tear down anything a previous session left behind
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if (typeof caches !== 'undefined') {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    };
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}