'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import { Bookmark, BookmarkCheck, ArrowUpRight, GraduationCap, MapPin, Wallet, CalendarClock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { deadlineInfo, eligibilitySnippet, monogram, fundingTone, categoryMeta } from '@/lib/opportunity-display'

export interface CardOpportunity {
  id: string
  title: string
  hostOrg: string
  country: string
  fundingType: string
  deadline: Date | string | null
  programLevel: string[]
  field?: string
  category?: string
  eligibility?: string | null
  featured?: boolean
  createdAt?: Date | string
  applicationLink?: string | null
  company?: string | null
}

interface Props {
  opp: CardOpportunity
  /** Optional personalised match score (dashboard). */
  match?: number
  className?: string
}

/**
 * The Xcel360 "scholarship snapshot". Every listing uses the same four facts
 * in the same order - Level, Destination, Funding, Deadline - plus one line of
 * eligibility, so readers can compare at a glance before opening the details.
 */
export default function OpportunityCard({ opp, match, className }: Props) {
  const { data: session } = useSession()
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const dl = deadlineInfo(opp.deadline)
  const cat = categoryMeta(opp.category)
  const snippet = eligibilitySnippet(opp.eligibility)
  const isNew = opp.createdAt ? Date.now() - new Date(opp.createdAt).getTime() < 7 * 864e5 : false
  const href = cat.href(opp.id)
  const rawOrg = (opp.company || opp.hostOrg || '').trim()
  const org = /^(unknown|not specified|n\/a|-)?$/i.test(rawOrg) ? '' : rawOrg

  const save = async () => {
    if (!session) {
      toast.error('Sign in to save opportunities')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opp.id }),
      })
      if (res.ok || res.status === 409) {
        setSaved(true)
        toast.success('Saved to your dashboard')
      } else {
        toast.error('Could not save right now')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const facts = [
    { icon: GraduationCap, label: 'Level', value: opp.programLevel.slice(0, 2).join(', ') || 'All levels' },
    { icon: MapPin, label: 'Destination', value: opp.country || 'Global' },
    { icon: Wallet, label: cat.key === 'SCHOLARSHIP' ? 'Funding' : 'Type', value: opp.fundingType || '-' },
    { icon: CalendarClock, label: 'Deadline', value: dl.date, tone: dl.tone },
  ]

  return (
    <article
      className={cn(
        'group relative flex flex-col bg-white rounded-2xl border border-surface-200 shadow-soft transition-all duration-200 hover:border-ink-200 hover:shadow-premium',
        className
      )}
    >
      <div className="p-5 pb-4 flex-1 flex flex-col">
        {/* Header: monogram + org + chips */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="w-10 h-10 rounded-xl bg-brand-600 text-accent-200 font-display text-sm font-semibold flex items-center justify-center shrink-0"
          >
            {monogram(org || opp.title)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink-400 truncate">{org || opp.country || 'Xcel360 listing'}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={cn('text-[10.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded', cat.chip)}>{cat.label}</span>
              <span className={cn('text-[10.5px] font-bold px-1.5 py-0.5 rounded', fundingTone(opp.fundingType))}>{opp.fundingType}</span>
              {isNew && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-accent-100 text-accent-700">New</span>}
              {typeof match === 'number' && match >= 50 && (
                <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  <Sparkles className="h-2.5 w-2.5" /> {match}% match
                </span>
              )}
            </div>
          </div>
        </div>

        <Link href={href} className="mt-3.5 block">
          <h3 className="text-[15.5px] font-bold leading-snug text-ink-900 line-clamp-2 group-hover:text-brand-700 transition-colors">
            {opp.title}
            <span className="absolute inset-0" aria-hidden />
          </h3>
        </Link>

        {/* The four-fact snapshot */}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-surface-50 border border-surface-100 p-3.5">
          {facts.map(({ icon: Icon, label, value, tone }) => (
            <div key={label} className="min-w-0">
              <dt className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                <Icon className="h-3 w-3" /> {label}
              </dt>
              <dd className={cn('mt-0.5 text-[13px] font-semibold text-ink-800 truncate', tone)}>{value}</dd>
            </div>
          ))}
        </dl>

        {snippet && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-500 line-clamp-2">
            <span className="font-semibold text-ink-700">Who can apply: </span>
            {snippet}
          </p>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-2 border-t border-surface-100 px-5 py-3">
        <span className={cn('text-xs font-bold', dl.tone)}>{dl.label}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={save}
            disabled={saving || saved}
            aria-label={saved ? 'Saved' : 'Save opportunity'}
            className="p-2 rounded-lg text-ink-400 hover:bg-surface-100 hover:text-ink-900 transition-colors disabled:opacity-100"
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <Bookmark className="h-4 w-4" />}
          </button>
          <Link
            href={href}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Details <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

