export const revalidate = 3600
import type { Metadata } from 'next'
import Hero3D from '@/components/landing/Hero3D'
import EmailCapture from '@/components/landing/EmailCapture'
import TopScholarships from '@/components/landing/TopScholarships'
import CommunityLinks from '@/components/landing/CommunityLinks'
import prisma from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Xcel360 — Find Scholarships, Get Mentorship & Study Abroad',
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

export default async function LandingPage() {
  const scholarships = await prisma.opportunity
    .findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        hostOrg: true,
        country: true,
        fundingType: true,
        deadline: true,
        field: true,
        programLevel: true,
        createdAt: true,
      },
    })
    .catch(() => [])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="overflow-x-hidden">
        <Hero3D />
        <TopScholarships scholarships={scholarships} />
        <EmailCapture />
        <CommunityLinks />
      </div>
    </>
  )
}
