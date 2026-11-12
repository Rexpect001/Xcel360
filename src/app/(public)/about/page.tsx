export const revalidate = 60
import { DEFAULT_OG_IMAGE } from '@/lib/og'
import { GraduationCap, Target, Heart, Globe, Quote } from 'lucide-react'
import Link from 'next/link'
import PageHero from '@/components/layout/PageHero'
import HowItWorks from '@/components/landing/HowItWorks'

export const metadata = {
  title: 'About Xcel360  -  Our Mission & Story',
  description:
    'Xcel360 was built to bridge the information gap for African students seeking scholarships and opportunities abroad. Learn about our mission, values, and the team behind the platform.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Xcel360',
    description: 'Our mission: no African student should miss a scholarship opportunity because of lack of information.',
    url: '/about',
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        eyebrow="Our Story"
        title="About Xcel360"
        subtitle="We believe every talented student deserves access to world-class education - regardless of where they come from or how much their family earns."
        className="pb-24"
      />

      {/* Founder's story */}
      <div className="max-w-4xl mx-auto px-4 pt-16">
        <div className="relative bg-brand-50 border border-brand-100 rounded-3xl p-8 md:p-10">
          <Quote className="h-8 w-8 text-brand-300 mb-4" />
          <p className="text-lg md:text-xl text-gray-800 leading-relaxed font-medium">
            Xcel360 was founded by Alabi Johnson Sunday. The idea came from a simple, personal
            experience: during university in Ekiti State, Nigeria, exposure to scholarships and global
            opportunities came far later than it should have - not because the opportunities
            weren&apos;t there, but because the information never reached the people who needed
            it most.
          </p>
          <p className="mt-5 text-gray-600 leading-relaxed">
            That gap between opportunity and awareness is what Xcel360 exists to close. Our goal
            is to bring scholarship and opportunity information closer to students everywhere -
            especially in places where that information rarely reaches - so that no talented
            student misses a fully funded opportunity simply because they never heard about it.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              AJ
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Alabi Johnson Sunday</p>
              <p className="text-xs text-gray-500">Founder, Xcel360</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Xcel360 exists to close the information gap in scholarship discovery. Too many students miss out on fully-funded opportunities simply because they didn&apos;t know they existed or missed the deadline.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              We aggregate opportunities, provide tracking tools, connect students with mentors, and send timely reminders  -  so that talent, not information access, determines who gets funded.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What we do</h2>
            <ul className="space-y-3">
              {[
                { icon: Globe, text: 'Aggregate 500+ scholarships from 50+ countries' },
                { icon: Target, text: 'Help students track applications and deadlines' },
                { icon: Heart, text: 'Connect students with scholars and mentors' },
                { icon: GraduationCap, text: 'Send smart reminders before deadlines' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-brand-600" />
                  </div>
                  <span className="text-gray-600 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <HowItWorks />

      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-brand-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Join the community</h2>
          <p className="text-gray-500 mb-6">Start your scholarship journey today. It&apos;s completely free.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/contact"
              className="border-2 border-brand-600 text-brand-700 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>

        {/* Trust & legal - quick access to our policies */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">
            Trust & Transparency
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-brand-300 hover:text-brand-700 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-brand-300 hover:text-brand-700 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-xs text-gray-400 text-center mt-4">
            We take your data seriously - read exactly what we collect and how it protects you.
          </p>
        </div>
      </div>
    </div>
  )
}
