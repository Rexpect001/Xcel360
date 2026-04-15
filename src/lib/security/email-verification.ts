import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { Resend } from 'resend'

// Email verification token expiration: 24 hours
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in ms
const RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000 // 1 hour in ms

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Hash token for storage
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

const FROM = process.env.EMAIL_FROM ?? 'Xcel360 <onboarding@resend.dev>'

// Generate and store verification token
export async function generateVerificationToken(userId: string): Promise<string> {
  const token = generateToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)

  // Delete any existing tokens for this user
  await prisma.$executeRaw`
    DELETE FROM "VerificationToken" 
    WHERE "identifier" = ${userId} AND "token" LIKE 'verify_%'
  `

  // Store new token (prefix to distinguish from password reset)
  await prisma.$executeRaw`
    INSERT INTO "VerificationToken" ("identifier", "token", "expires")
    VALUES (${userId}, ${'verify_' + hashedToken}, ${expiresAt})
  `

  return token
}

// Verify email verification token
export async function verifyEmailToken(userId: string, token: string): Promise<boolean> {
  const hashedToken = hashToken(token)

  // Find valid token
  const result = await prisma.$queryRaw<{ expires: Date }[]>`
    SELECT "expires" FROM "VerificationToken"
    WHERE "identifier" = ${userId} 
      AND "token" = ${'verify_' + hashedToken}
      AND "expires" > NOW()
    LIMIT 1
  `

  if (result.length === 0) {
    return false
  }

  // Delete used token
  await prisma.$executeRaw`
    DELETE FROM "VerificationToken"
    WHERE "identifier" = ${userId} AND "token" = ${'verify_' + hashedToken}
  `

  // Mark user as verified
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  })

  return true
}

// Generate and store password reset token
export async function generatePasswordResetToken(email: string): Promise<string | null> {
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!user) {
    return null // Don't reveal if email exists
  }

  const token = generateToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY)

  // Delete any existing tokens for this user
  await prisma.$executeRaw`
    DELETE FROM "VerificationToken" 
    WHERE "identifier" = ${user.id} AND "token" LIKE 'reset_%'
  `

  // Store new token
  await prisma.$executeRaw`
    INSERT INTO "VerificationToken" ("identifier", "token", "expires")
    VALUES (${user.id}, ${'reset_' + hashedToken}, ${expiresAt})
  `

  return token
}

// Verify password reset token
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const hashedToken = hashToken(token)

  // Find valid token
  const result = await prisma.$queryRaw<{ identifier: string; expires: Date }[]>`
    SELECT "identifier", "expires" FROM "VerificationToken"
    WHERE "token" = ${'reset_' + hashedToken}
      AND "expires" > NOW()
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  return result[0].identifier
}

// Clear password reset token after use
export async function clearPasswordResetToken(userId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "VerificationToken"
    WHERE "identifier" = ${userId} AND "token" LIKE 'reset_%'
  `
}

// Send verification email
export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const resend = getResend()
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping verification email'); return }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thexcel360.com'
  const verificationUrl = `${appUrl}/verify-email?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Xcel360 account',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin:0 0 16px 0;">Welcome, ${name}!</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">Please verify your email address to activate your account.</p>
      <a href="${verificationUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Verify Email</a>
      <p style="color:#9ca3af;font-size:12px;margin:28px 0 0 0;">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    </div>
  </div>
</body></html>`,
  })

  if (error) console.error('[email] Verification email failed:', error)
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resend = getResend()
  if (!resend) { console.warn('[email] RESEND_API_KEY not set — skipping password reset email'); return }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thexcel360.com'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Xcel360 password',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin:0 0 16px 0;">Password Reset</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">We received a request to reset your password. Click below to set a new one.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">Reset Password</a>
      <p style="color:#9ca3af;font-size:12px;margin:28px 0 0 0;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  </div>
</body></html>`,
  })

  if (error) console.error('[email] Password reset email failed:', error)
}

// Check if email is verified
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  })

  return user?.emailVerified != null
}
