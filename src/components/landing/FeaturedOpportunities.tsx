'use client'
import Link from 'next/link'
import type { Opportunity } from '@prisma/client'
import { Calendar, MapPin, ArrowRight, Bookmark, Sparkles } from 'lucide-react'
import { formatDate, daysUntilDeadline, getFundingBadgeColor } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { motion } from 'framer-motion'

type SerializedOpportunity = Omit<Opportunity, 'deadline' | 'createdAt' | 'updatedAt'> & {
  deadline: string | Date
  createdAt: string | Date
  updatedAt: string | Date
}

function OpportunityCard({ opp }: { opp: SerializedOpportunity }) {
  const days = daysUntilDeadline(opp.deadline)
  const isUrgent = days <= 30

  return (
    <Link
      href={`/opportunities/${opp.id}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Top accent with gradient */}
      <div className="h-1.5 bg-gradient-to-r from-brand-600 via-brand-500 to-sky-400" />
      <div className="relative p-6">
        {/* Subtle watermark on card */}
        <svg className="absolute top-2 right-2 w-16 h-16 opacity-30" xmlns="http://www.w3.org/2000/svg">
          <pattern id={`card-pattern-${opp.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="0.8" fill="rgba(3,105,161,0.1)" />
          </pattern>
          <rect width="100%" height="100%" fill={`url(#card-pattern-${opp.id})`} />
        </svg>

        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFundingBadgeColor(opp.fundingType)}`}>
              {opp.fundingType}
            </span>
          </div>
          {opp.featured && (
            <span className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
        </div>

        <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-brand-700 transition-colors line-clamp-2">
          {opp.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{opp.hostOrg}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {opp.programLevel.slice(0, 2).map((lvl) => (
            <Badge key={lvl} variant="blue">{lvl}</Badge>
          ))}
          <Badge variant="gray">{opp.field}</Badge>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {opp.country}
          </span>
          <span className={`flex items-center gap-1 font-medium ${isUrgent ? 'text-orange-600' : 'text-gray-600'}`}>
            <Calendar className="h-3.5 w-3.5" />
            {days > 0 ? `${days}d left` : 'Closed'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <span className="text-xs text-gray-400">Deadline: {formatDate(opp.deadline)}</span>
          <span className="text-brand-600 group-hover:text-brand-700 transition-colors">
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// Inverse watermark for the section background
function SectionWatermark() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="featured-watermark" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="1.5" fill="rgba(3,105,161,0.04)" />
          <circle cx="15" cy="15" r="0.8" fill="rgba(3,105,161,0.03)" />
          <circle cx="45" cy="45" r="0.8" fill="rgba(3,105,161,0.03)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#featured-watermark)" />
    </svg>
  )
}

export default function FeaturedOpportunities({ opportunities }: { opportunities: SerializedOpportunity[] }) {
  return (
    <section className="relative py-20 bg-gray-50 overflow-hidden">
      {/* Inverse watermark pattern */}
      <SectionWatermark />
      
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 text-brand-600 text-sm font-medium mb-2">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
              Featured
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Featured Opportunities
            </h2>
            <p className="text-gray-500 mt-2">Curated scholarships with upcoming deadlines</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/opportunities"
              className="hidden sm:flex items-center gap-2 text-brand-700 font-semibold text-sm hover:text-brand-800 transition-colors group"
            >
              View all 
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {opportunities.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {opportunities.map((opp, i) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <OpportunityCard opp={opp} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Opportunities will appear here once added.</p>
          </div>
        )}

        <div className="text-center mt-8 sm:hidden">
          <Link href="/opportunities" className="text-brand-700 font-semibold text-sm">
            View all opportunities →
          </Link>
        </div>
      </div>
    </section>
  )
}
