/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
