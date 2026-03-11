export const dynamic = 'force-dynamic'
import { getAuth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const post = await prisma.blogPost.create({
    data: {
      title: body.title,
      slug: body.slug,
      author: body.author,
      excerpt: body.excerpt ?? null,
      content: body.content ?? '',
      tags: body.tags ?? [],
      published: body.published ?? false,
      coverImage: body.coverImage ?? null,
    },
  })
  return NextResponse.json(post, { status: 201 })
}
