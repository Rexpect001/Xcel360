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

// Geometric X pattern matching the logo style
function GeometricXPattern({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="x-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M30 30 L50 60 L30 90" stroke="rgba(3,105,161,0.05)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M90 30 L70 60 L90 90" stroke="rgba(3,105,161,0.05)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M50 60 L70 60" stroke="rgba(3,105,161,0.05)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M35 25 L45 15" stroke="rgba(3,105,161,0.07)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M85 25 L75 15" stroke="rgba(3,105,161,0.07)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </pattern>
          <pattern id="dot-matrix" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="rgba(3,105,161,0.08)" />
            <circle cx="0" cy="0" r="0.5" fill="rgba(3,105,161,0.05)" />
            <circle cx="40" cy="0" r="0.5" fill="rgba(3,105,161,0.05)" />
            <circle cx="0" cy="40" r="0.5" fill="rgba(3,105,161,0.05)" />
            <circle cx="40" cy="40" r="0.5" fill="rgba(3,105,161,0.05)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#x-pattern)" />
        <rect width="100%" height="100%" fill="url(#dot-matrix)" />
      </svg>
    </div>
  )
}

// Animated floating geometric shapes
function FloatingShapes() {
  return (
    <>
      <motion.div className="absolute top-[15%] left-[10%] opacity-20"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="60" height="60" viewBox="0 0 60 60">
          <polygon points="30,5 55,50 5,50" fill="none" stroke="rgba(3,105,161,0.4)" strokeWidth="1.5" />
        </svg>
      </motion.div>
      <motion.div className="absolute top-[25%] right-[15%] opacity-15"
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <path d="M20 20 L60 60 M60 20 L20 60" stroke="rgba(3,105,161,0.3)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.div>
      <motion.div className="absolute bottom-[20%] left-[20%] opacity-15"
        animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
        <svg width="50" height="50" viewBox="0 0 50 50">
          <polygon points="25,5 42.5,15 42.5,35 25,45 7.5,35 7.5,15" fill="none" stroke="rgba(3,105,161,0.3)" strokeWidth="1.5" />
        </svg>
      </motion.div>
      <motion.div className="absolute bottom-[30%] right-[10%] opacity-10"
        animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(3,105,161,0.2)" strokeWidth="1" strokeDasharray="5,5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(3,105,161,0.15)" strokeWidth="1" />
        </svg>
      </motion.div>
      <motion.div className="absolute top-[60%] left-[5%] w-2 h-2 rounded-full bg-brand-200"
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }} />
      <motion.div className="absolute bottom-[40%] right-[30%] w-2 h-2 rounded-full bg-amber-400/30"
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }} />
    </>
  )
}

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
      className="relative min-h-screen flex items-center overflow-hidden bg-white"
    >
      {/* Geometric Pattern Background */}
      <GeometricXPattern />
      
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.4]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(3,105,161,0.07) 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      {/* Soft blue glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-100 rounded-full opacity-60 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full opacity-80 blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      {/* Floating geometric shapes */}
      <FloatingShapes />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 w-full"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 text-sm text-brand-700 mb-7"
            >
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span>Trusted by 10,000+ scholarship seekers</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl sm:text-6xl lg:text-[3.6rem] xl:text-7xl font-bold text-gray-900 leading-[1.08] tracking-tight"
            >
              Find your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400">
                dream
              </span>{' '}
              scholarship — for free.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-5 text-lg text-gray-600 leading-relaxed max-w-xl"
            >
              We believe every student deserves access to world-class education. Discover 500+ scholarships, track deadlines, and connect with mentors — all free.
            </motion.p>

            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-8"
            >
              <div className="flex bg-white rounded-2xl shadow-[0_4px_24px_rgba(3,105,161,0.12)] border border-brand-100 overflow-hidden">
                <div className="flex items-center pl-5 text-gray-400 flex-shrink-0">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search scholarship, country, or field..."
                  className="flex-1 px-4 py-4 text-gray-900 text-sm focus:outline-none placeholder:text-gray-400 min-w-0"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-4 font-semibold text-sm hover:from-brand-700 hover:to-brand-800 transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                >
                  Search <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center flex-wrap gap-2 mt-3">
                <span className="text-gray-400 text-xs">Popular:</span>
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => router.push(`/opportunities?search=${encodeURIComponent(term)}`)}
                    className="text-xs text-brand-600 hover:text-brand-800 border border-brand-200 hover:border-brand-400 px-2.5 py-1 rounded-full transition-all hover:bg-brand-50"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap items-center gap-5 mt-7"
            >
              {perks.map((perk) => (
                <span key={perk} className="flex items-center gap-1.5 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  {perk}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85 }}
              className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-100"
            >
              <div className="flex -space-x-2.5">
                {communityAvatars.map((av) => (
                  <div
                    key={av.initials}
                    className={`w-9 h-9 rounded-full ${av.bg} border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                  >
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
                <p className="text-gray-500 text-xs">
                  Join <strong className="text-gray-800">10,000+</strong> students already on Xcel360
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            {/* Background pattern on card */}
            <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-2xl scale-105 pointer-events-none" />
            
            <div className="relative bg-white rounded-3xl p-6 shadow-[0_32px_80px_rgba(0,0,0,0.45)] overflow-hidden">
              {/* Subtle geometric watermark on card */}
              <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="card-geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M10 30 L30 10 L50 30 L30 50 Z" fill="none" stroke="rgba(3,105,161,0.05)" strokeWidth="1" />
                    <circle cx="30" cy="30" r="2" fill="rgba(3,105,161,0.05)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#card-geo)" />
              </svg>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Top Scholarships</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Updated daily</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="space-y-1 mb-5">
                  {scholarshipRows.map((item) => (
                    <div key={item.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{item.flag}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate group-hover:text-brand-700 transition-colors">{item.name}</div>
                        <div className="text-xs text-gray-400 truncate">{item.org}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.color}`}>{item.funding}</span>
                        <span className={`text-xs font-medium ${item.days <= 30 ? 'text-red-500' : 'text-gray-400'}`}>{item.days}d left</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/opportunities"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white py-3 rounded-xl text-sm font-semibold hover:from-brand-700 hover:to-brand-800 transition-all"
                >
                  Browse all scholarships <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-4 -right-6 bg-white rounded-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] border border-gray-100 w-48 overflow-hidden"
            >
              {/* Mini geometric pattern */}
              <svg className="absolute top-0 right-0 w-16 h-16 opacity-20" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 5 L35 20 L20 35 L5 20 Z" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1" />
              </svg>
              
              <div className="relative flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-3.5 w-3.5 text-red-500" />
                </div>
                <span className="text-xs font-bold text-gray-900">Deadline Alert</span>
              </div>
              <p className="relative text-xs text-gray-500">Chevening closes in <strong className="text-red-600">14 days</strong></p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-4 -left-6 bg-white rounded-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] border border-gray-100 w-52 overflow-hidden"
            >
              {/* Mini geometric pattern */}
              <svg className="absolute bottom-0 left-0 w-16 h-16 opacity-20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="15" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
                <circle cx="40" cy="40" r="8" fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
              </svg>
              
              <div className="relative flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <span className="text-xs font-bold text-gray-900">New Match!</span>
              </div>
              <p className="relative text-xs text-gray-500">3 scholarships match your profile</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-brand-300"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-8 border-2 border-brand-200 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-brand-300 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
