import crypto from 'crypto'
import prisma from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000
const RESET_TOKEN_EXPIRY = 1 * 60 * 60 * 1000

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// ─── Password reset tokens ───────────────────────────────────────────────────

export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return null

  const token = generateToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY)

  await prisma.$executeRaw`
    DELETE FROM "VerificationToken" WHERE "identifier" = ${user.id} AND "token" LIKE 'reset_%'
  `
  await prisma.$executeRaw`
    INSERT INTO "VerificationToken" ("identifier", "token", "expires")
    VALUES (${user.id}, ${'reset_' + hashedToken}, ${expiresAt})
  `

  return token
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const hashedToken = hashToken(token)
  const result = await prisma.$queryRaw<{ identifier: string }[]>`
    SELECT "identifier" FROM "VerificationToken"
    WHERE "token" = ${'reset_' + hashedToken} AND "expires" > NOW()
    LIMIT 1
  `
  return result.length > 0 ? result[0].identifier : null
}

export async function clearPasswordResetToken(userId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM "VerificationToken" WHERE "identifier" = ${userId} AND "token" LIKE 'reset_%'
  `
}

// ─── Email senders ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await sendMail({
    to: email,
    subject: 'Reset your Xcel360 password',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#0369a1,#0284c7);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px;">Scholarships &amp; Mentorship Platform</p>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin:0 0 12px 0;font-size:20px;">Reset your password</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">
        We received a request to reset the password for your Xcel360 account.<br>
        Click the button below to set a new password.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#0369a1,#0284c7);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
        Reset Password →
      </a>
      <p style="color:#6b7280;font-size:13px;margin:28px 0 8px 0;">
        Or copy this link into your browser:
      </p>
      <p style="color:#0369a1;font-size:12px;word-break:break-all;margin:0 0 28px 0;">${resetUrl}</p>
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px 0;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">
        This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email  -  your password will not change.
      </p>
    </div>
  </div>
</body></html>`,
  })
}

// ─── Email verification tokens ───────────────────────────────────────────────

export async function generateVerificationToken(userId: string): Promise<string> {
  const token = generateToken()
  const hashedToken = hashToken(token)
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY)

  await prisma.$executeRaw`
    DELETE FROM "VerificationToken" WHERE "identifier" = ${userId} AND "token" LIKE 'verify_%'
  `
  await prisma.$executeRaw`
    INSERT INTO "VerificationToken" ("identifier", "token", "expires")
    VALUES (${userId}, ${'verify_' + hashedToken}, ${expiresAt})
  `

  return token
}

export async function verifyEmailToken(userId: string, token: string): Promise<boolean> {
  const hashedToken = hashToken(token)
  const result = await prisma.$queryRaw<{ expires: Date }[]>`
    SELECT "expires" FROM "VerificationToken"
    WHERE "identifier" = ${userId} AND "token" = ${'verify_' + hashedToken} AND "expires" > NOW()
    LIMIT 1
  `
  if (result.length === 0) return false

  await prisma.$executeRaw`
    DELETE FROM "VerificationToken" WHERE "identifier" = ${userId} AND "token" = ${'verify_' + hashedToken}
  `
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } })
  return true
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'
  const verificationUrl = `${appUrl}/verify-email?token=${token}`

  await sendMail({
    to: email,
    subject: 'Verify your Xcel360 account',
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#0369a1,#0284c7);padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Xcel360</h1>
    </div>
    <div style="padding:40px;">
      <h2 style="color:#111827;margin:0 0 16px 0;">Welcome, ${name}!</h2>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 28px 0;">Please verify your email address to activate your account.</p>
      <a href="${verificationUrl}" style="display:inline-block;background:linear-gradient(135deg,#0369a1,#0284c7);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">Verify Email →</a>
      <p style="color:#9ca3af;font-size:12px;margin:28px 0 0 0;">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
    </div>
  </div>
</body></html>`,
  })
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } })
  return user?.emailVerified != null
}
