/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the certificate fonts into the serverless function on Vercel so
  // fs.readFileSync can load them at runtime.
  experimental: {
    outputFileTracingIncludes: {
      '/api/admin/certificates/**': ['./src/lib/certificates/fonts/**'],
    },
  },

  async redirects() {
    return [
      // Public certificate page lives at /certificate — forward the common
      // plural so users who type /certificates don't hit a 404.
      {
        source: '/certificates',
        destination: '/certificate',
        permanent: false,
      },
      {
        source: '/ai',
        destination: '/events/cmobns2gx0000u9klishjmwqr',
        permanent: false,
      },
      // Branded short link → joins the Leveraging AI Zoom meeting directly
      // (passcode embedded in the URL, so one-tap join, no code entry).
      {
        source: '/join',
        destination: 'https://umsystem.zoom.us/j/91459172327?pwd=qMeOcaOMXBXeVwCKJxb6MTdqIebXpY.1',
        permanent: false,
      },
      {
        source: '/volunteer',
        destination: 'https://edifier.thexcel360.com/volunteer',
        permanent: false,
      },
    ]
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  
  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.tile.openstreetmap.org",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'speaker=()',
              'fullscreen=(self)',
            ].join(', '),
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
}

export default nextConfig
