'use client'
import { motion } from 'framer-motion'
import { Quote, Star } from 'lucide-react'
import type { SuccessStory } from '@prisma/client'

type SerializedStory = Omit<SuccessStory, 'createdAt'> & { createdAt: string | Date }

const defaultStories = [
  {
    id: '1',
    name: 'Amara Osei',
    scholarship: 'Fulbright Scholarship',
    university: 'Columbia University, USA',
    quote: 'Xcel360 helped me find and track the Fulbright scholarship step by step. The deadline tracker kept me on schedule and I got in!',
    image: null,
    year: 2024,
    published: true,
    createdAt: new Date(),
    avatarColor: 'from-pink-500 to-rose-600',
    flag: '🇺🇸',
  },
  {
    id: '2',
    name: 'Fatima Al-Rashid',
    scholarship: 'Gates Cambridge',
    university: 'University of Cambridge, UK',
    quote: "I found Gates Cambridge on Xcel360 and used the document checklist to make sure I had everything. Now I'm at Cambridge  -  a dream come true!",
    image: null,
    year: 2024,
    published: true,
    createdAt: new Date(),
    avatarColor: 'from-violet-500 to-purple-600',
    flag: '🇬🇧',
  },
  {
    id: '3',
    name: 'Chen Wei',
    scholarship: 'DAAD Scholarship',
    university: 'TU Munich, Germany',
    quote: "The mentorship feature connected me with someone who'd already been through DAAD. That guidance was invaluable  -  I couldn't have done it without Xcel360.",
    image: null,
    year: 2023,
    published: true,
    createdAt: new Date(),
    avatarColor: 'from-amber-500 to-orange-600',
    flag: '🇩🇪',
  },
]

const avatarColors = ['from-pink-500 to-rose-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-sky-500 to-blue-600']

// Light watermark pattern for dark/blue background
function LightWatermarkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="light-watermark" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* Light dots on blue background */}
          <circle cx="40" cy="40" r="2" fill="rgba(255,255,255,0.05)" />
          <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.04)" />
          <circle cx="60" cy="60" r="1" fill="rgba(255,255,255,0.04)" />
          <circle cx="20" cy="60" r="0.6" fill="rgba(255,255,255,0.03)" />
          <circle cx="60" cy="20" r="0.6" fill="rgba(255,255,255,0.03)" />
          {/* Subtle curved lines */}
          <path d="M40 15 Q52 32 40 50 Q28 68 40 85" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none"/>
          <path d="M15 40 Q32 28 50 40 Q68 52 85 40" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none"/>
          {/* Quote mark hint */}
          <text x="65" y="25" fontSize="10" fill="rgba(255,255,255,0.02)" fontFamily="serif">"</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#light-watermark)" />
    </svg>
  )
}

export default function Testimonials({ stories }: { stories: SerializedStory[] }) {
  const displayStories = stories.length > 0
    ? stories.map((s, i) => ({ ...s, avatarColor: avatarColors[i % avatarColors.length], flag: '' }))
    : defaultStories

  return (
    <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #004ca3 0%, #005fc9 40%, #006fec 75%, #4b95f5 100%)' }}>
      {/* Light watermark pattern for blue background */}
      <LightWatermarkPattern />
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />
      
      {/* Decorative floating dots */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-white/10 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-3 h-3 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-20 w-2 h-2 bg-amber-300/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-5 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            Success Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Students who made it
          </h2>
          <p className="text-blue-200 mt-4 text-lg max-w-xl mx-auto">
            Real stories from the Xcel360 community who secured their dream scholarships.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayStories.map((story, i) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative bg-white/[0.07] border border-white/10 rounded-3xl p-7 backdrop-blur-sm hover:bg-white/[0.12] transition-all hover:-translate-y-1 duration-300 group overflow-hidden"
            >
              {/* Card watermark */}
              <svg className="absolute top-0 right-0 w-24 h-24 opacity-20" xmlns="http://www.w3.org/2000/svg">
                <pattern id={`testimonial-pattern-${story.id}`} x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
                  <circle cx="7.5" cy="7.5" r="1" fill="rgba(255,255,255,0.1)" />
                </pattern>
                <rect width="100%" height="100%" fill={`url(#testimonial-pattern-${story.id})`} />
              </svg>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              <Quote className="h-8 w-8 text-blue-300/50 mb-4" />
              <p className="text-white/85 text-sm leading-relaxed mb-7 italic">
                &ldquo;{story.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                <div className={`w-11 h-11 bg-gradient-to-br ${story.avatarColor} rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                  {story.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm">{story.name}</div>
                  <div className="text-blue-200 text-xs font-medium truncate">{story.scholarship}</div>
                  <div className="text-blue-300 text-xs truncate">{story.university}</div>
                </div>
                {story.flag && (
                  <div className="ml-auto text-xl flex-shrink-0 group-hover:scale-125 transition-transform">{story.flag}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="text-blue-200 mb-5">Ready to write your own success story?</p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-brand-800 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-lg hover:scale-105 transform"
          >
            Start for Free  -  It Takes 2 Minutes
          </a>
        </motion.div>
      </div>
    </section>
  )
}
