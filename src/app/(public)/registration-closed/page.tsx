import { Lock, Video, Calendar, Clock, Award, Trophy } from 'lucide-react'

export const metadata = {
  title: 'Registration Closed — Leveraging AI in Today\'s World',
  description: 'Registration is now closed. If you already registered, access the live meeting here.',
  robots: { index: false, follow: false },
}

export default function RegistrationClosedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-sky-700 pt-28 pb-24 px-4 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl" />
        <div className="max-w-2xl mx-auto relative text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-200 bg-amber-500/15 px-3 py-1.5 rounded-full border border-amber-400/30 mb-5">
            <Lock className="h-3.5 w-3.5" /> Registration Closed
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Leveraging AI in Today&apos;s World
          </h1>
          <p className="text-white/70 text-base md:text-lg">
            Registration is now closed — thank you for the incredible response! If you already
            registered, your seat is reserved. Join us live below.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 -mt-10">
        {/* Access meeting card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-brand-950 to-sky-700" />
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Video className="h-8 w-8 text-brand-700" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access the Meeting</h2>
            <p className="text-sm text-gray-500 mb-6">One tap to join — no passcode needed.</p>

            <a
              href="/join"
              className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-brand-700 transition-colors"
            >
              <Video className="h-5 w-5" /> Join the Zoom Meeting
            </a>

            <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-gray-700 font-medium">Saturday, 27 June 2026</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <Clock className="h-4 w-4 text-brand-600" />
                <span className="text-sm text-gray-700 font-medium">4:00 PM (WAT)</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Meeting ID: 914 5917 2327 · Passcode: XCEL360
            </p>
          </div>
        </div>

        {/* Certificate + Poster */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Award className="h-6 w-6 text-brand-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">Certificate of Participation</h3>
            <p className="text-sm text-gray-500">Join with your registered name — attendance is verified during the session.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <Trophy className="h-6 w-6 text-amber-500 mb-3" />
            <h3 className="font-bold text-gray-900 mb-1">AI Poster Competition</h3>
            <p className="text-sm text-gray-500">Theme: <em>What Can You Do With AI?</em> — compete for a ₦300,000 prize pool.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
