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
      // Public certificate page lives at /certificate  -  forward the common
      // plural so users who type /certificates don't hit a 404.
      {
        source: '/certificates',
        destination: '/certificate',
        permanent: false,
      },
      // Event held & registration closed  -  send /ai to the "Event Successful /
      // Registration Closed" page (which links to /certificate). To reopen,
      // change destination back to '/events/cmobns2gx0000u9klishjmwqr'.
      {
        source: '/ai',
        destination: '/registration-closed',
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
    // Serve modern formats - dramatically smaller images for supported browsers
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'thexcel360.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },

  // Don't advertise the framework in response headers
  poweredByHeader: false,
  
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
              // Google AdSense needs its loader plus the ad-serving/quality domains
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google https://www.googletagservices.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Posters/covers live on Vercel Blob; ads and YouTube thumbnails are served over https
              "img-src 'self' blob: data: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.tile.openstreetmap.org https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google",
              "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://*.doubleclick.net https://*.googlesyndication.com https://*.google.com https://*.adtrafficquality.google",
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
