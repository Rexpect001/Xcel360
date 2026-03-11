'use client'
import { motion } from 'framer-motion'
import { Search, BookmarkPlus, Bell } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Search,
    title: 'Discover opportunities',
    description: 'Browse 500+ scholarships filtered by your level, field, country, and funding type. Find what fits you.',
    color: 'bg-brand-50 text-brand-700',
  },
  {
    step: '02',
    icon: BookmarkPlus,
    title: 'Save & track',
    description: 'Save scholarships to your dashboard, move them through your application pipeline, and manage your documents.',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    step: '03',
    icon: Bell,
    title: 'Get reminded',
    description: 'Automatic deadline alerts at 30, 14, 7, and 2 days. Plus instant alerts when new opportunities match your profile.',
    color: 'bg-green-50 text-green-700',
  },
]

// Inverse watermark pattern for light background
function InverseWatermarkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="howitworks-watermark" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          {/* Dots */}
          <circle cx="60" cy="60" r="2" fill="rgba(3,105,161,0.06)" />
          <circle cx="30" cy="30" r="1.2" fill="rgba(3,105,161,0.05)" />
          <circle cx="90" cy="90" r="1.2" fill="rgba(3,105,161,0.05)" />
          <circle cx="30" cy="90" r="0.8" fill="rgba(3,105,161,0.04)" />
          <circle cx="90" cy="30" r="0.8" fill="rgba(3,105,161,0.04)" />
          {/* Small decorative lines */}
          <path d="M60 25 Q70 42 60 60 Q50 78 60 95" stroke="rgba(3,105,161,0.04)" strokeWidth="0.8" fill="none"/>
          <path d="M25 60 Q42 50 60 60 Q78 70 95 60" stroke="rgba(3,105,161,0.04)" strokeWidth="0.8" fill="none"/>
          {/* Step numbers as subtle background */}
          <text x="10" y="20" fontSize="8" fill="rgba(3,105,161,0.03)" fontWeight="bold">01</text>
          <text x="70" y="80" fontSize="8" fill="rgba(3,105,161,0.03)" fontWeight="bold">02</text>
          <text x="40" y="110" fontSize="8" fill="rgba(3,105,161,0.03)" fontWeight="bold">03</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#howitworks-watermark)" />
    </svg>
  )
}

export default function HowItWorks() {
  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Inverse watermark pattern */}
      <InverseWatermarkPattern />
      
      {/* Subtle gradient accents */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-50/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-50/30 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 text-brand-600 text-sm font-medium mb-3"
          >
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
            Simple Process
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight"
          >
            How Xcel360 works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-gray-500 mt-3 text-lg"
          >
            Three steps to your scholarship
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line with animated gradient */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5">
            <div className="h-full bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200 rounded-full" />
            <motion.div 
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white to-transparent"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative z-10 text-center group"
              >
                <div className="relative inline-flex mb-6">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotateY: 10 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <Icon className="h-9 w-9" />
                  </motion.div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-700 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                  
                  {/* Subtle ring on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-brand-200 opacity-0 group-hover:opacity-100 scale-110 group-hover:scale-125 transition-all duration-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
