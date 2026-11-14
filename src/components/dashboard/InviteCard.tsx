'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Check, Copy, Gift, Share2 } from 'lucide-react'
import { REFERRAL_CREDITS } from '@/lib/billing'
import { cn } from '@/lib/utils'

interface Referral {
  link: string
  reward: number
  rewards: number
  credits: number
  remaining: number
}

/**
 * "Invite a friend, you both get 50 credits" card with the user's link.
 * `compact` is for dialogs (e.g. when a user runs out of credits).
 */
export default function InviteCard({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [data, setData] = useState<Referral | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/me/referral')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  if (failed) return null

  const message = data
    ? `I use Xcel360 to find scholarships and write my CV and SOP with AI. Sign up with my link and we both get ${data.reward} free AI credits: ${data.link}`
    : ''

  const copy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.link)
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.')
    }
  }

  const share = async () => {
    if (!data) return
    if (navigator.share) {
      try { await navigator.share({ title: 'Join me on Xcel360', text: message }) } catch { /* cancelled */ }
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <section id="invite" className={cn('rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5', className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-200">
          <Gift className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-ink-900">Invite a friend, you both get {REFERRAL_CREDITS} credits</h2>
          <p className="mt-0.5 text-sm text-ink-700">
            When someone signs up with your link, {REFERRAL_CREDITS} credits land in each of your accounts. Use them on the CV, SOP and Cover Letter builders.
          </p>
        </div>
      </div>

      <div className={cn('mt-4 flex flex-col gap-2', !compact && 'sm:flex-row')}>
        <label htmlFor="invite-link" className="sr-only">Your invite link</label>
        <input
          id="invite-link"
          readOnly
          value={data?.link ?? 'Loading your link…'}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-ink-900"
        />
        <div className="flex gap-2">
          <button type="button" onClick={copy} disabled={!data} className="btn-light !px-4 !py-2.5 flex-1 sm:flex-none">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={share} disabled={!data} className="btn-primary !px-4 !py-2.5 flex-1 sm:flex-none">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </div>

      {data && !compact && (
        <p className="mt-3 text-xs text-ink-700">
          {data.rewards > 0
            ? `${data.rewards} friend${data.rewards === 1 ? '' : 's'} joined so far: ${data.credits} credits earned.`
            : 'No friends have joined with your link yet.'}
          {data.remaining === 0 && ' You have reached the referral reward limit, but friends still get their bonus.'}
        </p>
      )}
    </section>
  )
}
