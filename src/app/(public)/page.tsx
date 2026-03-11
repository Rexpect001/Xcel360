export const dynamic = 'force-dynamic'
import Hero3D from '@/components/landing/Hero3D'
import FeaturedOpportunities from '@/components/landing/FeaturedOpportunities'
import CategoryBrowse from '@/components/landing/CategoryBrowse'
import HowItWorks from '@/components/landing/HowItWorks'
import Testimonials from '@/components/landing/Testimonials'
import UpcomingEvents from '@/components/landing/UpcomingEvents'
import CommunityJoin from '@/components/landing/CommunityJoin'
import EmailCapture from '@/components/landing/EmailCapture'
import StatsSection from '@/components/landing/StatsSection'
import prisma from '@/lib/prisma'

async function getFeaturedOpportunities() {
  try {
    const data = await prisma.opportunity.findMany({
      where: { featured: true, status: 'OPEN' },
      take: 4,
      orderBy: { deadline: 'asc' },
    })
    // Serialize Date objects to ISO strings
    return data.map(opp => ({
      ...opp,
      deadline: opp.deadline.toISOString(),
      createdAt: opp.createdAt.toISOString(),
      updatedAt: opp.updatedAt.toISOString(),
    }))
  } catch {
    return []
  }
}

async function getUpcomingEvents() {
  try {
    const data = await prisma.event.findMany({
      where: { published: true, date: { gt: new Date() } },
      take: 3,
      orderBy: { date: 'asc' },
    })
    // Serialize Date objects to ISO strings
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

async function getSuccessStories() {
  try {
    const data = await prisma.successStory.findMany({
      where: { published: true },
      take: 3,
    })
    // Serialize Date objects to ISO strings
    return data.map(story => ({
      ...story,
      createdAt: story.createdAt.toISOString(),
    }))
  } catch {
    return []
  }
}

export default async function LandingPage() {
  const [opportunities, events, stories] = await Promise.all([
    getFeaturedOpportunities(),
    getUpcomingEvents(),
    getSuccessStories(),
  ])

  return (
    <div className="overflow-x-hidden">
      <Hero3D />
      <StatsSection />
      <CategoryBrowse />
      <FeaturedOpportunities opportunities={opportunities} />
      <HowItWorks />
      <Testimonials stories={stories} />
      <UpcomingEvents events={events} />
      <CommunityJoin />
      <EmailCapture />
    </div>
  )
}
