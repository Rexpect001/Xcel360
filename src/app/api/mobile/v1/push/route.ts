export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { fail, ok, preflight, readJson, withUser } from '@/lib/mobile/http'

export const OPTIONS = preflight

const EXPO_TOKEN = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$/

/** POST { token, platform } -> this phone receives push notifications for the signed-in user. */
export async function POST(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const platform = body?.platform === 'ios' || body?.platform === 'android' ? body.platform : null
    if (!EXPO_TOKEN.test(token) || !platform) return fail('Invalid push token.')
    // A phone belongs to whoever signed in on it last
    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: user.id, platform, lastSeenAt: new Date() },
      create: { token, userId: user.id, platform },
    })
    return ok({ registered: true })
  })
}

/** DELETE ?token= -> stop pushing to this phone (on sign-out). */
export async function DELETE(req: Request) {
  return withUser(req, async (user) => {
    const token = new URL(req.url).searchParams.get('token') ?? ''
    if (token) await prisma.pushToken.deleteMany({ where: { token, userId: user.id } })
    return ok({ registered: false })
  })
}
