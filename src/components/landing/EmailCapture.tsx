'use client'
import { useState } from 'react'
import { Bell, CheckCircle, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
    <section className="relative py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #eef4ff 0%, #f8faff 50%, #fffbf5 100%)' }}>
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

      <div className="relative max-w-xl mx-auto px-4 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 shadow-md text-white"
          style={{ background: 'linear-gradient(135deg, #0369a1, #6366f1)' }}>
          <Bell className="h-7 w-7" />
        </div>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: '#0f172a' }}>
          Never miss a scholarship
        </h2>
        <p className="text-lg mb-10" style={{ color: '#64748b' }}>
          Be the first to know when opportunities matching your profile are posted.
        </p>

        {submitted ? (
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
            style={{ background: '#ecfdf5', border: '1.5px solid #bbf7d0' }}>
            <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <span className="font-medium" style={{ color: '#065f46' }}>You&apos;re subscribed! We&apos;ll be in touch.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 px-5 py-4 rounded-2xl text-sm focus:outline-none bg-white placeholder:text-gray-400"
              style={{
                border: '1.5px solid #e0e7ff',
                boxShadow: '0 2px 12px rgba(99,102,241,0.08)',
                color: '#0f172a',
              }}
            />
            <button type="submit" disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #0369a1, #6366f1)', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
              {loading ? 'Subscribing...' : <><ArrowRight className="h-4 w-4" />Get Alerts</>}
            </button>
          </form>
        )}

      </div>
    </section>
  )
}
