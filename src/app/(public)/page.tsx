export const revalidate = 3600
import type { Metadata } from 'next'
import Hero from '@/components/landing/Hero'
import ChooseYourPath from '@/components/landing/ChooseYourPath'
import TopScholarships from '@/components/landing/TopScholarships'
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
  try {
    return await prisma.opportunity.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true, title: true, hostOrg: true, country: true,
        fundingType: true, deadline: true, field: true,
        programLevel: true, createdAt: true,
      },
    })
  } catch (error) {
    console.error('[home] Failed to load landing data', error)
    return [] as any[]
  }
}

export default async function LandingPage() {
  const scholarships = await getHomeData()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="overflow-x-hidden">
        <Hero />
        <TopScholarships scholarships={scholarships} />
        <ChooseYourPath />
        <EmailCapture />
      </div>
    </>
  )
}
