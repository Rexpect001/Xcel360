'use client'
import { useState } from 'react'
import { Bell, CheckCircle } from 'lucide-react'
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
      if (res.ok) {
        setSubmitted(true)
        toast.success("You're on the list!")
      } else {
        toast.error('Something went wrong. Try again.')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-100 rounded-xl mb-6">
          <Bell className="h-6 w-6 text-brand-700" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Get alerts for new scholarships
        </h2>
        <p className="text-gray-600 mb-8">
          Be the first to know when opportunities matching your profile are posted.
        </p>

        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-gray-900">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="font-medium">You&apos;re subscribed! We&apos;ll be in touch.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white border border-blue-200 text-gray-900 placeholder:text-gray-400 shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-brand-700 text-white rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? 'Subscribing...' : 'Get Alerts'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
