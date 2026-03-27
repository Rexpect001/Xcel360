'use client'
import { motion } from 'framer-motion'
import { Award, Users, Globe } from 'lucide-react'

const stats = [
  { icon: Award, value: '800+', label: 'Scholarships Listed', sublabel: 'across 50+ countries', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: Users, value: '1,000+', label: 'Students Supported', sublabel: 'through mentorship & guidance', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Globe, value: '95%', label: 'Success Rate', sublabel: 'for active users', color: 'text-violet-600', bg: 'bg-violet-50' },
]

// Inverse watermark pattern (blue dots on light background)
function InverseWatermarkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="inverse-watermark" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <circle cx="40" cy="40" r="1.5" fill="rgba(3,105,161,0.08)" />
          <circle cx="20" cy="20" r="1" fill="rgba(3,105,161,0.06)" />
          <circle cx="60" cy="60" r="1" fill="rgba(3,105,161,0.06)" />
          <circle cx="20" cy="60" r="0.5" fill="rgba(3,105,161,0.04)" />
          <circle cx="60" cy="20" r="0.5" fill="rgba(3,105,161,0.04)" />
          <path d="M40 15 Q50 30 40 45 Q30 60 40 75" stroke="rgba(3,105,161,0.03)" strokeWidth="0.5" fill="none"/>
          <path d="M15 40 Q30 30 40 40 Q60 50 75 40" stroke="rgba(3,105,161,0.03)" strokeWidth="0.5" fill="none"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#inverse-watermark)" />
    </svg>
  )
}

export default function StatsSection() {
  return (
    <section className="relative py-14 bg-white border-b border-gray-100 overflow-hidden">
      {/* Inverse watermark pattern */}
      <InverseWatermarkPattern />
      
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-50/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-sky-50/50 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center group"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} mb-4 group-hover:scale-110 transition-transform shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-4xl font-bold text-gray-900 tabular-nums">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-700 mt-1">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{stat.sublabel}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
