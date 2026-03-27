import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { trackFailedLogin, resetLoginAttempts } from './security/rate-limiter'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/signin',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Get IP from request
        const headers = req?.headers as Record<string, string> | undefined
        const ip = headers?.['x-forwarded-for'] ?? headers?.['x-real-ip'] ?? 'unknown'
        const userAgent = headers?.['user-agent'] ?? 'unknown'

        // (rate limiting handled by trackFailedLogin on failed attempts only)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          // Track failed attempt
          const mockReq = { ip, headers: { get: (h: string) => headers?.[h.toLowerCase()] } } as any
          await trackFailedLogin(mockReq)
          return null
        }

        // Block suspended or disabled accounts (status may be null for legacy rows — treat as ACTIVE)
        if (user.status === 'SUSPENDED') {
          throw new Error('Your account has been suspended. Please contact support.')
        }
        if (user.status === 'DISABLED') {
          throw new Error('Your account has been disabled. Please contact support.')
        }
        // (status null or ACTIVE → proceed)

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          // Track failed attempt
          const mockReq = { ip, headers: { get: (h: string) => headers?.[h.toLowerCase()] } } as any
          await trackFailedLogin(mockReq)
          return null
        }

        // Reset failed login attempts on successful login
        const mockReq = { ip, headers: { get: (h: string) => headers?.[h.toLowerCase()] } } as any
        await resetLoginAttempts(mockReq)

        // Track last login time (non-blocking — may fail if Prisma client not yet regenerated)
        db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {})

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.emailVerified = (user as any).emailVerified
      }
      
      // Handle session update
      if (trigger === 'update' && session) {
        token.name = session.name
        token.image = session.image
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
    async signIn({ user, account }) {
      // Allow OAuth sign-ins without email verification
      if (account?.provider !== 'credentials') {
        // Mark email verified for OAuth users (non-blocking — never reject sign-in)
        if (!user.emailVerified && user.id) {
          prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          }).catch(() => {})
        }
        return true
      }
      return true
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log successful sign-ins (optional)
      console.log(`[SIGNIN] ${user.email} via ${account?.provider}`)
    },
  },
}

export const getAuth = () => getServerSession(authOptions)

export const requireAuth = async () => {
  const session = await getAuth()
  if (!session) throw new Error('Unauthorized')
  return session
}

const ADMIN_ROLES = ['ADMIN', 'MANAGER', 'EDITOR', 'MODERATOR', 'MENTOR'] as const

export const requireAdmin = async () => {
  const session = await requireAuth()
  if (!(ADMIN_ROLES as readonly string[]).includes(session.user.role)) throw new Error('Forbidden')
  return session
}

// Extend next-auth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: string
      emailVerified?: Date | null
    }
  }
  
  interface User {
    role?: string
    emailVerified?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    emailVerified?: Date | null
  }
}
