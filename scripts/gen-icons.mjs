/**
 * Zero-dependency PWA icon generator (node scripts/gen-icons.mjs)
 * Writes PNGs by hand with zlib + CRC32 — no sharp, no canvas.
 */
import zlib from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public');

const MOSS = [106, 131, 67];
const SUNSET = [255, 127, 38];
const WHITE = [255, 255, 255];

/* ---------- PNG encoding ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(file, size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png);
}

/* ---------- Shapes ---------- */
function inRoundedRect(x, y, r) {
  const cx = Math.min(Math.max(x, r), 1 - r);
  const cy = Math.min(Math.max(y, r), 1 - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function inRing(x, y, inner, outer) {
  const dx = x - 0.5;
  const dy = y - 0.5;
  const d = Math.sqrt(dx * dx + dy * dy);
  return d >= inner && d <= outer;
}

function inTriangle(x, y, [a, b, c]) {
  const d1 = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
  const d2 = (c[0] - b[0]) * (y - b[1]) - (c[1] - b[1]) * (x - b[0]);
  const d3 = (a[0] - c[0]) * (y - c[1]) - (a[1] - c[1]) * (x - c[0]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/** Render one icon (scale shrinks the artwork, square skips rounding — used for maskable) */
function render(size, { scale = 1, square = false } = {}) {
  const SS = 3; // supersampling for anti-aliasing
  const buf = new Uint8Array(size * size * 4);
  const tri = [
    [0.5, 0.34],
    [0.31, 0.66],
    [0.69, 0.66],
  ];

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const nx = (px + (sx + 0.5) / SS) / size;
          const ny = (py + (sy + 0.5) / SS) / size;
          // Map back into icon-local coordinates (supports content scaling)
          const lx = (nx - 0.5) / scale + 0.5;
          const ly = (ny - 0.5) / scale + 0.5;

          let inside;
          if (square) inside = lx >= 0 && lx <= 1 && ly >= 0 && ly <= 1;
          else inside = inRoundedRect(lx, ly, 0.22);

          let color = null;
          if (inside) {
            color = MOSS;
            if (inRing(lx, ly, 0.28, 0.355)) color = WHITE;
            if (inTriangle(lx, ly, tri)) color = SUNSET;
          }
          if (color) {
            r += color[0];
            g += color[1];
            b += color[2];
            a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      buf[i] = Math.round(r / n);
      buf[i + 1] = Math.round(g / n);
      buf[i + 2] = Math.round(b / n);
      buf[i + 3] = Math.round(a / n);
    }
  }
  return buf;
}

const targets = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-512-maskable.png', 512, { scale: 0.62, square: true }],
  ['apple-touch-icon.png', 180, { square: true }],
];

for (const [name, size, opts] of targets) {
  writePng(path.join(OUT, name), size, render(size, opts));
  console.log('✓', name, size + 'x' + size);
}
