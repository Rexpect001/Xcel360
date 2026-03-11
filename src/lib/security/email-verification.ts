import crypto from 'crypto'
import prisma from '@/lib/prisma'
import nodemailer from 'nodemailer'

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

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const verificationUrl = `${appUrl}/verify-email?token=${token}`

  const transporter = createTransporter()

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Xcel360 <noreply@xcel360.com>',
    to: email,
    subject: 'Verify your Xcel360 account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0369a1;">Welcome to Xcel360!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for signing up. Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: #0369a1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't create an account on Xcel360, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
Welcome to Xcel360!

Hi ${name},

Thank you for signing up. Please verify your email address by clicking this link:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account on Xcel360, you can safely ignore this email.
    `,
  })
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  const transporter = createTransporter()

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Xcel360 <noreply@xcel360.com>',
    to: email,
    subject: 'Reset your Xcel360 password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0369a1;">Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #0369a1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
Password Reset Request

We received a request to reset your password. Click this link to reset it:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
    `,
  })
}

// Check if email is verified
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  })

  return user?.emailVerified != null
}
