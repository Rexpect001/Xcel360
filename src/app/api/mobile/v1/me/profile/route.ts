export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { fail, ok, preflight, readJson, withUser } from '@/lib/mobile/http'
import { profileUpdateSchema } from '@/lib/security/validation'
import { profileCompleteness } from '@/lib/matching'

export const OPTIONS = preflight

const select = {
  level: true, targetCountries: true, targetFields: true, courseOfStudy: true, degree: true, school: true,
  department: true, graduationYear: true, notifyEmail: true, notifyInApp: true,
} as const

/** GET the matching profile; PATCH updates it with the website's validation rules. */
export async function GET(req: Request) {
  return withUser(req, async (user) => {
    const profile = await prisma.profile.findUnique({ where: { userId: user.id }, select })
    return ok({ ...profile, completeness: profileCompleteness(profile as never) })
  })
}

export async function PATCH(req: Request) {
  return withUser(req, async (user) => {
    const body = await readJson(req)
    if (!body) return fail('Invalid request.')
    // Name lives on the user, everything else on the profile
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    if (name !== undefined && (name.length < 1 || name.length > 100)) return fail('Please enter your name (up to 100 characters).')
    // Empty strings mean "clear this field"
    const cleaned = Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'name').map(([k, v]) => [k, v === '' ? null : v]))
    const parsed = profileUpdateSchema.safeParse(cleaned)
    if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? 'Please check your details.')
    const data = Object.fromEntries(Object.entries(parsed.data).filter(([k, v]) => v !== undefined && k in select))

    const [profile] = await Promise.all([
      prisma.profile.upsert({ where: { userId: user.id }, update: data, create: { userId: user.id, ...data }, select }),
      name !== undefined ? prisma.user.update({ where: { id: user.id }, data: { name } }) : Promise.resolve(null),
    ])
    return ok({ ...profile, completeness: profileCompleteness(profile as never) })
  })
}
