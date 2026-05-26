export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAuth } from '@/lib/auth'

const PUBLIC_PATHS = [
  '/',
  '/opportunities',
  '/events',
  '/resources',
  '/mentorship',
  '/success-stories',
  '/internships',
  '/jobs',
]

export async function POST(req: NextRequest) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await req.json().catch(() => ({}))

  if (path) {
    revalidatePath(path)
    return NextResponse.json({ revalidated: [path] })
  }

  // Revalidate all public pages
  PUBLIC_PATHS.forEach((p) => revalidatePath(p))
  return NextResponse.json({ revalidated: PUBLIC_PATHS })
}
