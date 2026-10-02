export const revalidate = 60
import { GraduationCap, Target, Heart, Globe } from 'lucide-react'
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

      <div className="max-w-4xl mx-auto px-4 py-16">
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
              className="bg-ink-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-ink-800 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/contact"
              className="border-2 border-ink-900 text-brand-700 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
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
