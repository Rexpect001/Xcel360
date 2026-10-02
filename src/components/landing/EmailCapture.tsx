'use client'
import { useState } from 'react'
import { CheckCircle, ArrowRight, MessageCircle, Youtube } from 'lucide-react'
import { toast } from 'react-hot-toast'

/** Closing band: weekly email digest + the two community channels. */
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
    <section className="bg-ink-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid lg:grid-cols-[minmax(0,1fr)_420px] gap-10 items-center">
        <div>
          <p className="eyebrow !text-accent-300 mb-3">The Friday digest</p>
          <h2 className="font-display text-3xl sm:text-4xl text-white">New scholarships in your inbox, once a week.</h2>
          <p className="text-ink-200 mt-3 max-w-xl">
            A short list of the best new opportunities and the deadlines closing soon. No spam, unsubscribe in one click.
          </p>

          {submitted ? (
            <p className="mt-7 inline-flex items-center gap-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-5 py-3.5 text-sm font-semibold text-emerald-200">
              <CheckCircle className="h-5 w-5" /> You&apos;re subscribed. See you Friday.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col sm:flex-row gap-2.5 max-w-lg">
              <label htmlFor="digest-email" className="sr-only">Email address</label>
              <input
                id="digest-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 rounded-xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-accent-300"
              />
              <button type="submit" disabled={loading} className="btn-gold">
                {loading ? 'Subscribing…' : <>Subscribe <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}
        </div>

        <div className="grid gap-3">
          <a
            href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.08] transition-colors"
          >
            <span className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">WhatsApp channel</span>
              <span className="block text-xs text-ink-300 mt-0.5">Daily opportunity drops, straight to your phone</span>
            </span>
            <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </a>
          <a
            href="https://www.youtube.com/@Xcel_360"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:bg-white/[0.08] transition-colors"
          >
            <span className="w-11 h-11 rounded-xl bg-[#FF0000] flex items-center justify-center shrink-0">
              <Youtube className="h-5 w-5 text-white" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">YouTube</span>
              <span className="block text-xs text-ink-300 mt-0.5">Application walkthroughs and interview prep</span>
            </span>
            <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </a>
        </div>
      </div>
    </section>
  )
}
