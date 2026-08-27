'use client'
import { useState } from 'react'
import { Bell, CheckCircle, ArrowRight, MessageCircle, Youtube } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function EmailCapture() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) { setSubmitted(true); toast.success("You're on the list!") }
      else toast.error('Something went wrong. Try again.')
    } catch { toast.error('Something went wrong.') }
    finally { setLoading(false) }
  }

  return (
    <section className="relative py-20 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f8faff 50%, #fffbf5 100%)' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(3,105,161,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      <div className="relative max-w-xl mx-auto px-4 text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 shadow-sm text-white"
          style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)' }}>
          <Bell className="h-5 w-5" />
        </div>

        {/* Heading  -  smaller */}
        <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2" style={{ color: '#0f172a' }}>
          Never miss a scholarship
        </h2>
        <p className="text-sm mb-7" style={{ color: '#475569' }}>
          Be the first to know when new opportunities are posted.
        </p>

        {/* Email form */}
        {submitted ? (
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl mb-8"
            style={{ background: '#ecfdf5', border: '1.5px solid #bbf7d0' }}>
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium text-sm" style={{ color: '#065f46' }}>You&apos;re subscribed!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-3.5 rounded-2xl text-sm focus:outline-none bg-white placeholder:text-gray-400"
              style={{ border: '1.5px solid #bae6fd', boxShadow: '0 2px 12px rgba(3,105,161,0.08)', color: '#0f172a' }}
            />
            <button type="submit" disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)', boxShadow: '0 4px 16px rgba(3,105,161,0.2)' }}>
              {loading ? 'Subscribing...' : <><ArrowRight className="h-4 w-4" />Get Alerts</>}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
          <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>or stay connected via</span>
          <div className="flex-1 h-px" style={{ background: '#e2e8f0' }} />
        </div>

        {/* WhatsApp + YouTube */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 3px 12px rgba(22,163,74,0.2)' }}
          >
            <MessageCircle className="h-4 w-4 flex-shrink-0" />
            Join WhatsApp Channel
          </Link>
          <Link
            href="https://www.youtube.com/@Xcel_360"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: '0 3px 12px rgba(220,38,38,0.2)' }}
          >
            <Youtube className="h-4 w-4 flex-shrink-0" />
            Watch on YouTube
          </Link>
        </div>

      </div>
    </section>
  )
}
