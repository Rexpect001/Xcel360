import { Lock, CheckCircle2, Calendar, Clock, Award, Trophy } from 'lucide-react'

export const metadata = {
  title: 'Registration Closed  -  Leveraging AI in Today\'s World',
  description: 'Registration is closed. The event held successfully  -  thank you for the incredible response.',
  robots: { index: false, follow: false },
}

export default function RegistrationClosedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-hero-gradient pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
        <div className="max-w-2xl mx-auto relative text-center">
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-300/30">
              <CheckCircle2 className="h-3.5 w-3.5" /> Event Successful
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 bg-amber-500/15 px-3 py-1.5 rounded-full border border-amber-400/30">
              <Lock className="h-3.5 w-3.5" /> Registration Closed
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Leveraging AI in Today&apos;s World
          </h1>
          <p className="text-white/70 text-base md:text-lg">
            Thank you for the incredible response! The event held successfully and registration
            is now closed. If you attended, you can claim your certificate below.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 -mt-10">
        {/* Certificate access card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand-900 to-brand-500" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Award className="h-8 w-8 text-brand-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Get Your Certificate</h2>
            <p className="text-sm text-gray-500 mb-6">
              Attended the session? Enter the email you registered with to view and download your
              Certificate of Participation.
            </p>

            <a
              href="/certificate"
              className="inline-flex items-center gap-2 bg-ink-800 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-ink-800 transition-colors"
            >
              <Award className="h-5 w-5" /> Access My Certificate
            </a>

            <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-gray-700 font-medium">Saturday, 27 June 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <Clock className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-gray-700 font-medium">4:00 PM (WAT) · Held on Zoom</span>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate + Poster */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Award className="h-6 w-6 text-brand-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Certificate of Participation</h3>
            <p className="text-sm text-gray-500">Issued to verified attendees  -  look it up with your registered email.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Trophy className="h-6 w-6 text-amber-500 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">AI Poster Competition</h3>
            <p className="text-sm text-gray-500">Theme: <em>What Can You Do With AI?</em>  -  compete for a ₦300,000 prize pool.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
