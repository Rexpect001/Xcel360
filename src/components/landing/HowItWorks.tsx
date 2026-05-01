'use client'
import { motion } from 'framer-motion'
import { Search, BookmarkPlus, Bell } from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: 'Discover opportunities',
    description: 'Browse 500+ scholarships filtered by your level, field, country, and funding type. Find what fits you.',
    gradient: 'linear-gradient(135deg, #0369a1, #6366f1)',
    light: '#eef2ff',
    num: '01',
  },
  {
    icon: BookmarkPlus,
    title: 'Save & track',
    description: 'Save scholarships to your dashboard, move them through your application pipeline, and manage your documents.',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    light: '#f5f3ff',
    num: '02',
  },
  {
    icon: Bell,
    title: 'Get reminded',
    description: 'Automatic deadline alerts at 30, 14, 7, and 2 days. Plus instant alerts when new opportunities match your profile.',
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    light: '#ecfdf5',
    num: '03',
  },
]

export default function HowItWorks() {
  return (
    <section className="relative py-24 overflow-hidden" style={{ background: '#f5f3ff' }}>
      {/* Subtle dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />
            Simple Process
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: '#0f172a' }}>
            How Xcel360 works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-lg" style={{ color: '#475569' }}>
            Three steps to your scholarship
          </motion.p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px"
            style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #10b981)' }} />

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 bg-white rounded-3xl p-8 text-center group hover:-translate-y-1 transition-all duration-300"
                style={{ border: '1.5px solid #e0e7ff', boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}
              >
                {/* Step number */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md"
                  style={{ background: step.gradient }}>
                  {i + 1}
                </div>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 text-white shadow-lg"
                  style={{ background: step.gradient }}>
                  <Icon className="h-9 w-9" />
                </div>

                <h3 className="text-xl font-bold mb-3 transition-colors" style={{ color: '#0f172a' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
                  {step.description}
                </p>

                {/* Bottom shine on hover */}
                <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: step.gradient }} />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
