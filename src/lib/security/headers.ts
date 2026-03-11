import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers configuration
export const securityHeaders = {
  // Prevent XSS attacks
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' blob: data:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection in browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Strict transport security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
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
  
  // Cross-origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

// CORS configuration
export const corsConfig = {
  // Allowed origins - update this with your production domains
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    // Add your production domains here:
    // 'https://xcel360.com',
    // 'https://www.xcel360.com',
  ],
  
  // Allowed methods
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  
  // Exposed headers
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  
  // Credentials
  credentials: true,
  
  // Max age for preflight cache
  maxAge: 86400, // 24 hours
}

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Handle CORS preflight and add CORS headers
export function handleCors(req: NextRequest, response: NextResponse): NextResponse {
  const origin = req.headers.get('origin')
  
  // Check if origin is allowed
  const isAllowedOrigin = !origin || corsConfig.allowedOrigins.includes(origin)
  
  if (isAllowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
  response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', String(corsConfig.credentials))
  response.headers.set('Access-Control-Max-Age', String(corsConfig.maxAge))
  
  return response
}

// Create a secure response with all headers
export function createSecureResponse(
  body: unknown,
  status: number = 200,
  req?: NextRequest
): NextResponse {
  const response = NextResponse.json(body, { status })
  
  // Apply security headers
  applySecurityHeaders(response)
  
  // Apply CORS if request is provided
  if (req) {
    handleCors(req, response)
  }
  
  return response
}

// Middleware to handle OPTIONS requests (preflight)
export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    
    if (req.headers.get('origin')) {
      response.headers.set('Access-Control-Allow-Origin', req.headers.get('origin')!)
    }
    response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Allow-Credentials', String(corsConfig.credentials))
    response.headers.set('Access-Control-Max-Age', String(corsConfig.maxAge))
    
    return response
  }
  
  return null
}
