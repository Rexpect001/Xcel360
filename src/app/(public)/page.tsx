export const revalidate = 3600
import type { Metadata } from 'next'
import Hero from '@/components/landing/Hero'
import ChooseYourPath from '@/components/landing/ChooseYourPath'
import CategoryBrowse from '@/components/landing/CategoryBrowse'
import TopScholarships from '@/components/landing/TopScholarships'
import HowItWorks from '@/components/landing/HowItWorks'
import SuccessStories from '@/components/landing/SuccessStories'
import GuidesPreview from '@/components/landing/GuidesPreview'
import EmailCapture from '@/components/landing/EmailCapture'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Xcel360  -  Find Scholarships, Get Mentorship & Study Abroad',
  description:
    'Xcel360 is the #1 platform for African students to discover fully funded scholarships, track deadlines, connect with mentors, and build a clear plan to study abroad.',
  alternates: { canonical: '/' },
}

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Xcel360',
  url: BASE,
  logo: `${BASE}/logo.png`,
  sameAs: [
    'https://www.youtube.com/@Xcel_360',
    'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30',
  ],
  description:
    'Xcel360 helps African students discover fully funded scholarships, track deadlines, and connect with mentors to study abroad.',
}

async function getHomeData() {
  const empty = {
    scholarships: [] as any[],
    stories: [] as any[],
    posts: [] as any[],
    stats: { opportunities: 0, members: 0, countries: 0, resources: 0 },
  }
  try {
    const [scholarships, stories, posts, oppCount, memberCount, countryRows, resourceCount] =
      await Promise.all([
        prisma.opportunity.findMany({
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: {
            id: true, title: true, hostOrg: true, country: true,
            fundingType: true, deadline: true, field: true,
            programLevel: true, createdAt: true,
          },
        }),
        prisma.successStory.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        prisma.blogPost.findMany({
          where: { published: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, title: true, slug: true, excerpt: true, tags: true, createdAt: true },
        }),
        prisma.opportunity.count({ where: { status: 'OPEN' } }),
        prisma.user.count(),
        prisma.opportunity.findMany({
          where: { status: 'OPEN' },
          select: { country: true },
          distinct: ['country'],
        }),
        prisma.resource.count({ where: { published: true } }),
      ])

    return {
      scholarships,
      stories,
      posts,
      stats: {
        opportunities: oppCount,
        members: memberCount,
        countries: countryRows.length,
        resources: resourceCount,
      },
    }
  } catch (error) {
    console.error('[home] Failed to load landing data', error)
    return empty
  }
}

export default async function LandingPage() {
  const { scholarships, stories, posts, stats } = await getHomeData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="overflow-x-hidden">
        <Hero stats={stats} />
        <ChooseYourPath />
        <TopScholarships scholarships={scholarships} />
        <CategoryBrowse />
        <HowItWorks />
        <SuccessStories stories={stories} />
        <GuidesPreview posts={posts} />
        <EmailCapture />
      </div>
    </>
  )
}
