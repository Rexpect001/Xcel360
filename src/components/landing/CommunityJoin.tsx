'use client'
import { motion } from 'framer-motion'
import { MessageCircle, Users, Zap, Globe, Youtube } from 'lucide-react'

const benefits = [
  { icon: Users, text: 'Connect with 10,000+ scholars' },
  { icon: Zap, text: 'Get instant opportunity alerts' },
  { icon: Globe, text: 'Network across 80+ countries' },
]

export default function CommunityJoin() {
  return (
    <section className="relative py-24 overflow-hidden" style={{ background: '#0f172a' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.12) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Glows */}
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)' }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
          <MessageCircle className="h-8 w-8 text-white" />
        </motion.div>

        <motion.span
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-5"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
          Join the Community
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">
          Stay connected, stay ahead
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-lg max-w-2xl mx-auto mb-10"
          style={{ color: '#94a3b8' }}>
          Get instant updates on new scholarships, deadline reminders, and connect with fellow applicants who are on the same journey.
        </motion.p>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-6 mb-12">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-center gap-2 text-sm"
                style={{ color: '#cbd5e1' }}>
                <Icon className="h-4 w-4" style={{ color: '#6366f1' }} />
                {benefit.text}
              </motion.div>
            )
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a
            href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 8px 32px rgba(34,197,94,0.3)' }}>
            <MessageCircle className="h-5 w-5" />
            Join WhatsApp Channel
          </motion.a>
          <motion.a
            href="https://www.youtube.com/@Xcel_360"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1.5px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}>
            <Youtube className="h-5 w-5 text-red-400" />
            Watch on YouTube
          </motion.a>
        </div>

        <p className="mt-6 text-xs" style={{ color: '#475569' }}>
          Free to join · No spam · Instant notifications
        </p>
      </div>
    </section>
  )
}
