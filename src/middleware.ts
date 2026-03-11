import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { securityHeaders, corsConfig } from './lib/security/headers'

// Security headers middleware
function applySecurityHeaders(response: NextResponse, req: NextRequest): NextResponse {
  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Handle CORS
  const origin = req.headers.get('origin')
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
    response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))
    response.headers.set('Access-Control-Allow-Credentials', String(corsConfig.credentials))
  }

  return response
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Admin routes require ADMIN role — redirect non-admins to dashboard
    if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
      const response = NextResponse.redirect(new URL('/dashboard', req.url))
      return applySecurityHeaders(response, req)
    }

    // Apply security headers to all protected routes
    const response = NextResponse.next()
    return applySecurityHeaders(response, req)
  },
  {
    callbacks: {
      // Allow access only if a valid session token exists
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  // Protect dashboard and admin routes at the edge — before any page renders
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/:path*'],
}
