export const revalidate = 3600
import type { Metadata } from 'next'
import Hero from '@/components/landing/Hero'
import ChooseYourPath from '@/components/landing/ChooseYourPath'
import TopScholarships from '@/components/landing/TopScholarships'
import MoreScholarships from '@/components/landing/MoreScholarships'
import HowToSearch from '@/components/landing/HowToSearch'
import EmailCapture from '@/components/landing/EmailCapture'
import GoogleAd from '@/components/ads/GoogleAd'
import prisma from '@/lib/prisma'
import { liveOpportunityWhere } from '@/lib/opportunity-filters'

export const metadata: Metadata = {
  title: 'Xcel360  -  Find Scholarships and Build Stronger Applications',
  description:
    'Find fully funded scholarships you qualify for, track every deadline, and write stronger applications. Xcel360 is built for ambitious African students.',
  alternates: { canonical: '/' },
}

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Xcel360',
  url: BASE,
  logo: `${BASE}/logo.svg`,
  sameAs: [
    'https://www.youtube.com/@Xcel_360',
    'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30',
  ],
  description:
    'Xcel360 helps African students discover fully funded scholarships, track deadlines, and prepare stronger applications.',
}

// Enables Google's sitelinks search box and gives AI crawlers a clear,
// machine-readable way to understand the site has an on-page search tool.
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Xcel360',
  url: BASE,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE}/opportunities?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const cardSelect = {
  id: true, title: true, hostOrg: true, country: true, category: true,
  fundingType: true, deadline: true, field: true, programLevel: true,
  eligibility: true, featured: true, createdAt: true,
} as const

async function getHomeData() {
  try {
    const where = liveOpportunityWhere({ category: 'SCHOLARSHIP' })
    const [latest, liveCount] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: cardSelect,
      }),
      prisma.opportunity.count({ where: liveOpportunityWhere() }),
    ])
    // Nine more (a full 3x3 grid), distinct from "latest": featured first, then the soonest real deadlines
    const more = await prisma.opportunity.findMany({
      where: liveOpportunityWhere({ category: 'SCHOLARSHIP', id: { notIn: latest.map((l) => l.id) } }),
      orderBy: [{ featured: 'desc' }, { deadline: { sort: 'asc', nulls: 'last' } }],
      take: 9,
      select: cardSelect,
    })
    return { latest, more, liveCount }
  } catch (error) {
    console.error('[home] Failed to load landing data', error)
    return { latest: [], more: [], liveCount: 0 }
  }
}

export default async function LandingPage() {
  const { latest, more, liveCount } = await getHomeData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <div className="overflow-x-hidden">
        <Hero liveCount={liveCount} />
        <TopScholarships scholarships={latest} />
        <div className="bg-surface-50 pb-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <GoogleAd placement="home-feed" shape="leaderboard" />
          </div>
        </div>
        <MoreScholarships scholarships={more} />
        <HowToSearch />
        <ChooseYourPath />
        <EmailCapture />
      </div>
    </>
  )
}
