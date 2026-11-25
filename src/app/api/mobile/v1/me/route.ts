export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { ok, preflight, withUser } from '@/lib/mobile/http'
import { getBalance, hasUnlimitedCredits } from '@/lib/credits'
import { profileCompleteness } from '@/lib/matching'

export const OPTIONS = preflight

/** GET the signed-in student: account, profile, credits and unread notifications. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const [account, unread, credits] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true, name: true, email: true, role: true, createdAt: true,
          profile: { select: { level: true, targetCountries: true, targetFields: true, courseOfStudy: true, degree: true, school: true, graduationYear: true, department: true, notifyEmail: true, notifyInApp: true } },
        },
      }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
      hasUnlimitedCredits(user.role) ? Promise.resolve(null) : getBalance(user.id).catch(() => 0),
    ])
    if (!account) return ok(null)
    return ok({
      ...account,
      createdAt: account.createdAt.toISOString(),
      profileCompleteness: profileCompleteness(account.profile),
      credits,
      unreadNotifications: unread,
    })
  })
}
