'use client'
import { motion } from 'framer-motion'
import { MessageCircle, Users, Zap, Globe } from 'lucide-react'

const benefits = [
  { icon: Users, text: 'Connect with 10,000+ scholars' },
  { icon: Zap, text: 'Get instant opportunity alerts' },
  { icon: Globe, text: 'Network across 80+ countries' },
]

// Inverse watermark pattern
function InverseWatermarkPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="community-watermark" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <circle cx="50" cy="50" r="2" fill="rgba(3,105,161,0.06)" />
          <circle cx="25" cy="25" r="1" fill="rgba(3,105,161,0.05)" />
          <circle cx="75" cy="75" r="1" fill="rgba(3,105,161,0.05)" />
          <circle cx="25" cy="75" r="0.7" fill="rgba(3,105,161,0.04)" />
          <circle cx="75" cy="25" r="0.7" fill="rgba(3,105,161,0.04)" />
          {/* Community symbol hints */}
          <circle cx="50" cy="20" r="0.8" fill="rgba(3,105,161,0.03)" />
          <circle cx="35" cy="35" r="0.8" fill="rgba(3,105,161,0.03)" />
          <circle cx="65" cy="35" r="0.8" fill="rgba(3,105,161,0.03)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#community-watermark)" />
    </svg>
  )
}

export default function CommunityJoin() {
  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Inverse watermark pattern */}
      <InverseWatermarkPattern />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-50/50 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-sky-50/50 to-transparent rounded-full blur-3xl" />
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-6 shadow-lg"
          >
            <MessageCircle className="h-8 w-8 text-white" />
          </motion.div>
          
          <span className="inline-flex items-center gap-1.5 text-brand-600 text-sm font-medium mb-3">
            <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
            Join the Community
          </span>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
            Join our WhatsApp Channel
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8">
            Get instant updates on new scholarships, deadline reminders, and connect with fellow applicants. 
            Be part of a supportive community that helps each other succeed.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <Icon className="h-4 w-4 text-brand-500" />
                  <span>{benefit.text}</span>
                </motion.div>
              )
            })}
          </div>

          <motion.a
            href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="h-5 w-5" />
            Join WhatsApp Channel
          </motion.a>
          
          <p className="text-gray-400 text-xs mt-4">
            Free to join · No spam · Instant notifications
          </p>
        </motion.div>
      </div>
    </section>
  )
}
