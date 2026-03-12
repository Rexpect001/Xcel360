export const dynamic = 'force-dynamic'
import Hero3D from '@/components/landing/Hero3D'
import HowItWorks from '@/components/landing/HowItWorks'
import CommunityJoin from '@/components/landing/CommunityJoin'
import EmailCapture from '@/components/landing/EmailCapture'
import StatsSection from '@/components/landing/StatsSection'

export default async function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <Hero3D />
      <StatsSection />
      <HowItWorks />
      <CommunityJoin />
      <EmailCapture />
    </div>
  )
}
