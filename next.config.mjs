/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://telegram.org;
              style-src 'self' 'unsafe-inline' https://unpkg.com;
              img-src 'self' blob: data: https://unpkg.com https://*.openstreetmap.org https://tile.openstreetmap.org;
              font-src 'self' data:;
              connect-src 'self' https://*.openstreetmap.org https://tile.openstreetmap.org https://api.telegram.org;
              frame-src 'self' https://telegram.org;
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
