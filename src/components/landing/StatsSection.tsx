'use client'
import { motion } from 'framer-motion'
import { Award, Users, Globe } from 'lucide-react'

const stats = [
  {
    icon: Award, value: '800+', label: 'Scholarships Listed',
    sublabel: 'across 50+ countries',
    gradient: 'linear-gradient(135deg, #6366f1, #4338ca)',
    glow: 'rgba(99,102,241,0.15)',
  },
  {
    icon: Users, value: '10,000+', label: 'Students Supported',
    sublabel: 'through mentorship & guidance',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16,185,129,0.15)',
  },
  {
    icon: Globe, value: '95%', label: 'Success Rate',
    sublabel: 'for active users',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245,158,11,0.15)',
  },
]

export default function StatsSection() {
  return (
    <section className="relative py-16 bg-white overflow-hidden">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #6366f1, #0369a1, #f59e0b, transparent)' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="relative text-center rounded-2xl p-8 bg-white group hover:-translate-y-1 transition-all duration-300"
                style={{ border: '1.5px solid #f1f5f9', boxShadow: `0 4px 24px ${stat.glow}` }}
              >
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 text-white shadow-md"
                  style={{ background: stat.gradient }}>
                  <Icon className="h-7 w-7" />
                </div>

                {/* Number */}
                <div className="text-5xl font-bold mb-1 tabular-nums text-transparent bg-clip-text"
                  style={{ backgroundImage: stat.gradient }}>
                  {stat.value}
                </div>
                <div className="text-sm font-semibold mb-0.5" style={{ color: '#0f172a' }}>{stat.label}</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>{stat.sublabel}</div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: stat.gradient }} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
