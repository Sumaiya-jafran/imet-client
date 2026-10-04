import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Catalogue access must reflect subscription changes while testing locally.
  experimental: { serverComponentsHmrCache: false },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/auth/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
};
export default nextConfig;
