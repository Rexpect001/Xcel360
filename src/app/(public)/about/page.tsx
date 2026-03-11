import { GraduationCap, Target, Heart, Globe } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'About — Xcel360' }

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">About Xcel360</h1>
          <p className="text-blue-200 text-xl leading-relaxed">
            We believe every talented student deserves access to world-class education — regardless of where they come from or how much their family earns.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Xcel360 exists to close the information gap in scholarship discovery. Too many students miss out on fully-funded opportunities simply because they didn&apos;t know they existed or missed the deadline.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              We aggregate opportunities, provide tracking tools, connect students with mentors, and send timely reminders — so that talent, not information access, determines who gets funded.
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

        <div className="bg-brand-50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Join the community</h2>
          <p className="text-gray-500 mb-6">Start your scholarship journey today. It&apos;s completely free.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-brand-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-800 transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/contact"
              className="border-2 border-brand-700 text-brand-700 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
