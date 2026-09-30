/**
 * Deterministic DiceBear avatar for a given seed.
 *
 * Kept in its own module so both the store and the cloud layer can use it
 * without importing each other.
 */
export function avatarFor(seed: string) {
  const palette = ['ff7f26', '6a8343', 'c0d0a2', 'ffd3a3', 'dce6ca', 'ffe4c9'];
  const color = palette[Math.abs(hash(seed)) % palette.length];
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
    seed || 'AgriJump'
  )}&backgroundColor=${color}`;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
