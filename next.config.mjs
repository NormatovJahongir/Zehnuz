/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  // CSP xatoligini tuzatish uchun headers qo'shamiz
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com;
              style-src 'self' 'unsafe-inline' https://unpkg.com;
              img-src 'self' blob: data: https://unpkg.com https://*.openstreetmap.org;
              font-src 'self' data:;
              connect-src 'self' https://*.openstreetmap.org;
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
