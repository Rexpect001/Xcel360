'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { GraduationCap, Microscope, Globe2, Banknote, BookOpen, Plane } from 'lucide-react'

const categories = [
  { icon: GraduationCap, label: 'Masters', query: 'Masters', color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50' },
  { icon: Microscope, label: 'PhD / Research', query: 'PhD', color: 'from-violet-500 to-purple-400', bg: 'bg-violet-50' },
  { icon: Globe2, label: 'Study in USA', query: 'United States', color: 'from-red-500 to-pink-400', bg: 'bg-red-50' },
  { icon: Globe2, label: 'Study in UK', query: 'United Kingdom', color: 'from-indigo-500 to-blue-400', bg: 'bg-indigo-50' },
  { icon: Globe2, label: 'Study in Europe', query: 'Europe (Multiple)', color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50' },
  { icon: Banknote, label: 'Fully Funded', query: 'Fully funded', color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50' },
  { icon: BookOpen, label: 'STEM', query: 'STEM', color: 'from-sky-500 to-cyan-400', bg: 'bg-sky-50' },
  { icon: Plane, label: 'Global', query: 'Global', color: 'from-rose-500 to-pink-400', bg: 'bg-rose-50' },
]

// Inverse watermark pattern with larger dots
function InverseWatermarkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="category-watermark" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          {/* Grid of dots */}
          <circle cx="50" cy="50" r="2" fill="rgba(3,105,161,0.05)" />
          <circle cx="25" cy="25" r="1" fill="rgba(3,105,161,0.04)" />
          <circle cx="75" cy="75" r="1" fill="rgba(3,105,161,0.04)" />
          <circle cx="25" cy="75" r="0.8" fill="rgba(3,105,161,0.03)" />
          <circle cx="75" cy="25" r="0.8" fill="rgba(3,105,161,0.03)" />
          <circle cx="0" cy="50" r="1" fill="rgba(3,105,161,0.02)" />
          <circle cx="50" cy="0" r="1" fill="rgba(3,105,161,0.02)" />
          <circle cx="100" cy="50" r="1" fill="rgba(3,105,161,0.02)" />
          <circle cx="50" cy="100" r="1" fill="rgba(3,105,161,0.02)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#category-watermark)" />
    </svg>
  )
}

export default function CategoryBrowse() {
  const router = useRouter()

  return (
    <section className="relative py-20 bg-gray-50 overflow-hidden">
      {/* Inverse watermark pattern */}
      <InverseWatermarkPattern />
      
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 text-brand-600 text-sm font-medium mb-3">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
            Browse by Category
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Find scholarships by category
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Explore opportunities organized by study level, location, and funding type
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, i) => {
            const Icon = cat.icon
            return (
              <motion.button
                key={cat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/opportunities?search=${encodeURIComponent(cat.query)}`)}
                className="group relative bg-white rounded-2xl border border-gray-100 p-6 text-left hover:shadow-lg hover:border-brand-200 transition-all duration-300"
              >
                {/* Subtle background gradient on hover */}
                <div className={`absolute inset-0 rounded-2xl ${cat.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {cat.label}
                  </span>
                  
                  {/* Arrow indicator on hover */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
