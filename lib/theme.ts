export const THEME_KEY = 'agrijump.theme';

/**
 * Applied before first paint so the theme never flashes.
 * Kept in a plain module (not 'use client') so the server layout can read the string.
 */
export function themeInitScript() {
  return `(function(){try{var s=localStorage.getItem('${THEME_KEY}');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;
}
