import os from 'node:os';

/**
 * Every non-internal IPv4 address on this machine.
 *
 * The Mac's LAN address changes whenever the network changes (Wi-Fi →
 * iPhone hotspot → …), so we compute it at startup instead of hardcoding
 * it. Next 15 blocks cross-origin requests from unknown hosts in dev —
 * without this, the iPhone silently fails to load chunks and the page
 * looks broken.
 */
function localIPv4() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  return out;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '*.local',
    ...localIPv4(),
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '**.tile.openstreetmap.org' },
    ],
  },
};

export default nextConfig;