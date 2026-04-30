'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Star, ArrowRight, CheckCircle, Clock, Sparkles } from 'lucide-react'

const popularSearches = ['Fulbright', 'DAAD Germany', 'Commonwealth', 'Gates Cambridge', 'Erasmus+']

const communityAvatars = [
  { initials: 'AO', bg: 'bg-pink-500' },
  { initials: 'FK', bg: 'bg-amber-500' },
  { initials: 'CW', bg: 'bg-emerald-500' },
  { initials: 'MA', bg: 'bg-sky-500' },
  { initials: 'RL', bg: 'bg-violet-500' },
]

const perks = ['Free to join', '500+ scholarships', 'Deadline reminders']

const scholarshipRows = [
  { name: 'Fulbright Scholarship', org: 'US Dept. of State', flag: '🇺🇸', funding: 'Fully Funded', days: 45, color: 'bg-blue-50 text-blue-700' },
  { name: 'Gates Cambridge', org: 'University of Cambridge', flag: '🇬🇧', funding: 'Fully Funded', days: 82, color: 'bg-purple-50 text-purple-700' },
  { name: 'DAAD Scholarship', org: 'German Academic Exchange', flag: '🇩🇪', funding: 'Fully Funded', days: 23, color: 'bg-amber-50 text-amber-700' },
]

export default function Hero3D() {
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, -80])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/opportunities${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #eef4ff 0%, #f8faff 40%, #fffbf5 100%)' }}
    >
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Soft colour blobs */}
      <div className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)' }} />

      {/* Floating shapes */}
      <motion.div className="absolute top-[12%] left-[8%] opacity-25 pointer-events-none"
        animate={{ y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}>
        <svg width="56" height="56" viewBox="0 0 56 56">
          <polygon points="28,4 52,48 4,48" fill="none" stroke="#6366f1" strokeWidth="1.5" />
        </svg>
      </motion.div>
      <motion.div className="absolute top-[22%] right-[12%] opacity-20 pointer-events-none"
        animate={{ y: [0, 14, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
        <svg width="72" height="72" viewBox="0 0 72 72">
          <path d="M18 18 L54 54 M54 18 L18 54" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>
      <motion.div className="absolute bottom-[18%] left-[18%] opacity-20 pointer-events-none"
        animate={{ y: [0, -14, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
        <svg width="48" height="48" viewBox="0 0 48 48">
          <polygon points="24,4 40,14 40,34 24,44 8,34 8,14" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      </motion.div>
      <motion.div className="absolute bottom-[28%] right-[8%] opacity-15 pointer-events-none"
        animate={{ y: [0, 18, 0], x: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}>
        <svg width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="40" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="6,4" />
          <circle cx="45" cy="45" r="25" fill="none" stroke="#6366f1" strokeWidth="0.8" />
        </svg>
      </motion.div>

      <motion.div style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: copy ── */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-7"
              style={{ background: 'linear-gradient(90deg, #eef2ff, #fef3c7)', color: '#4338ca', border: '1px solid #c7d2fe' }}
            >
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
              Trusted by 10,000+ scholarship seekers
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-[3.5rem] xl:text-7xl font-bold leading-[1.08] tracking-tight"
              style={{ color: '#0f172a' }}
            >
              Find your{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #f59e0b, #f97316, #fbbf24)' }}>
                dream
              </span>{' '}
              scholarship —{' '}
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #0369a1, #6366f1)' }}>
                for free.
              </span>
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-5 text-lg leading-relaxed max-w-xl"
              style={{ color: '#475569' }}
            >
              We believe every student deserves access to world-class education. Discover 500+ scholarships, track deadlines, and connect with mentors — all free.
            </motion.p>

            {/* Search */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-8"
            >
              <div className="flex bg-white rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 4px 32px rgba(99,102,241,0.12), 0 1px 4px rgba(0,0,0,0.06)', border: '1.5px solid #e0e7ff' }}>
                <div className="flex items-center pl-5 flex-shrink-0" style={{ color: '#94a3b8' }}>
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search scholarship, country, or field..."
                  className="flex-1 px-4 py-4 text-sm focus:outline-none placeholder:text-gray-400 min-w-0"
                  style={{ color: '#0f172a' }}
                />
                <button type="submit"
                  className="px-6 py-4 font-semibold text-sm text-white flex items-center gap-2 whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #0369a1, #6366f1)' }}>
                  Search <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center flex-wrap gap-2 mt-3">
                <span className="text-xs" style={{ color: '#94a3b8' }}>Popular:</span>
                {popularSearches.map((term) => (
                  <button key={term} type="button"
                    onClick={() => router.push(`/opportunities?search=${encodeURIComponent(term)}`)}
                    className="text-xs px-3 py-1 rounded-full transition-all"
                    style={{ color: '#4338ca', border: '1px solid #c7d2fe', background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                    {term}
                  </button>
                ))}
              </div>
            </motion.form>

            {/* Perks */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap items-center gap-5 mt-7"
            >
              {perks.map((perk) => (
                <span key={perk} className="flex items-center gap-1.5 text-sm" style={{ color: '#475569' }}>
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {perk}
                </span>
              ))}
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="flex items-center gap-4 mt-8 pt-8"
              style={{ borderTop: '1px solid #e2e8f0' }}
            >
              <div className="flex -space-x-2.5">
                {communityAvatars.map((av) => (
                  <div key={av.initials}
                    className={`w-9 h-9 rounded-full ${av.bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                    {av.initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>
                  Join <strong style={{ color: '#0f172a' }}>10,000+</strong> students already on Xcel360
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Right: card ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            {/* Card glow */}
            <div className="absolute inset-0 rounded-3xl blur-2xl scale-105 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.1))' }} />

            <div className="relative bg-white rounded-3xl p-6 overflow-hidden"
              style={{ boxShadow: '0 24px 64px rgba(99,102,241,0.15), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #e0e7ff' }}>

              {/* Coloured top stripe */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                style={{ background: 'linear-gradient(90deg, #0369a1, #6366f1, #f59e0b)' }} />

              <div className="relative pt-2">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Top Scholarships</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Updated daily</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ background: '#dcfce7', color: '#15803d' }}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="space-y-1 mb-5">
                  {scholarshipRows.map((item) => (
                    <div key={item.name}
                      className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-50 group">
                      <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border border-gray-100">
                        {item.flag}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{item.org}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.color}`}>
                          {item.funding}
                        </span>
                        <span className={`text-xs font-medium ${item.days <= 30 ? 'text-red-500' : 'text-gray-400'}`}>
                          {item.days}d left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/opportunities"
                  className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #0369a1, #6366f1)' }}>
                  Browse all scholarships <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Floating deadline badge */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-5 -right-6 bg-white rounded-2xl p-3.5 w-48"
              style={{ boxShadow: '0 12px 32px rgba(239,68,68,0.15), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #fee2e2' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center border border-red-100">
                  <Clock className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-xs font-bold text-gray-900">Deadline Alert</span>
              </div>
              <p className="text-xs text-gray-500">Chevening closes in <strong className="text-red-600">14 days</strong></p>
            </motion.div>

            {/* Floating match badge */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-5 -left-6 bg-white rounded-2xl p-3.5 w-52"
              style={{ boxShadow: '0 12px 32px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #d1fae5' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-gray-900">New Match!</span>
              </div>
              <p className="text-xs text-gray-500">3 scholarships match your profile</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: '#94a3b8' }}>
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
          style={{ border: '2px solid #cbd5e1' }}>
          <div className="w-1 h-2 rounded-full" style={{ background: '#94a3b8' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}
