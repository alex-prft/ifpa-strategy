/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    // Environment-based CORS configuration for security
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowedOrigins = isDevelopment
      ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
      : [
          'https://ifpa-strategy.vercel.app',
          'https://ifpa-strategy-git-main-alex-harris-projects-f468cccf.vercel.app',
          ...(process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [])
        ];

    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: isDevelopment ? 'http://localhost:3000' : 'https://ifpa-strategy.vercel.app'
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,POST,PUT,DELETE' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Accept, Content-Type, Authorization, X-API-Key'
          },
          { key: 'Access-Control-Allow-Credentials', value: 'false' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ]
      },
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: isDevelopment
              ? "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*;"
              : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https:; font-src 'self';"
          },
        ]
      }
    ];
  },
};

module.exports = nextConfig;