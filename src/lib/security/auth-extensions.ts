import { NextAuthOptions } from 'next-auth'
import { NextRequest } from 'next/server'
import { trackFailedLogin, resetLoginAttempts } from './rate-limiter'
import { isEmailVerified } from './email-verification'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Extended authorize function with account lockout and email verification
export async function extendedAuthorize(
  credentials: Record<string, string> | undefined,
  req: NextRequest
) {
  if (!credentials?.email || !credentials?.password) {
    return null
  }

  const { email, password } = credentials

  // Check if account is locked out
  const isLocked = await trackFailedLogin(req)
  if (isLocked) {
    throw new Error('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.')
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.password) {
    await trackFailedLogin(req)
    return null
  }

  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) {
    await trackFailedLogin(req)
    return null
  }

  // Reset failed login attempts on successful login
  await resetLoginAttempts(req)

  // Check if email is verified (skip for OAuth users)
  if (!user.emailVerified && user.password) {
    // Allow login but mark as unverified
    // You can throw an error here if you want to enforce verification before login
    // throw new Error('Please verify your email before logging in.')
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    emailVerified: user.emailVerified,
  }
}

// Extend NextAuth callbacks
export const extendedCallbacks: NextAuthOptions['callbacks'] = {
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
  
  async signIn({ user, account, profile }) {
    // Allow OAuth sign-ins without email verification
    if (account?.provider !== 'credentials') {
      // Update emailVerified for OAuth users on first login
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
      }
      return true
    }
    
    // For credentials login, check if email is verified
    // Set to false to allow login but show warning, or return false to block
    return true
  },
}

// Declare extended session type
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
