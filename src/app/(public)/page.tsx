export const dynamic = 'force-dynamic'
import Hero3D from '@/components/landing/Hero3D'
import HowItWorks from '@/components/landing/HowItWorks'
import UpcomingEvents from '@/components/landing/UpcomingEvents'
import CommunityJoin from '@/components/landing/CommunityJoin'
import EmailCapture from '@/components/landing/EmailCapture'
import StatsSection from '@/components/landing/StatsSection'
import prisma from '@/lib/prisma'

async function getUpcomingEvents() {
  try {
    const data = await prisma.event.findMany({
      where: { published: true, date: { gt: new Date() } },
      take: 3,
      orderBy: { date: 'asc' },
    })
    return data.map(event => ({
      ...event,
      date: event.date.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    }))
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const events = await getUpcomingEvents()

  return (
    <div className="overflow-x-hidden">
      <Hero3D />
      <StatsSection />
      <HowItWorks />
      <UpcomingEvents events={events} />
      <CommunityJoin />
      <EmailCapture />
    </div>
  )
}
