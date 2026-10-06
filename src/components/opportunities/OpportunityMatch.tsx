'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Sparkles } from 'lucide-react'

type Match = { score: number; reasons: string[] }

export default function OpportunityMatch({ opportunityId }: { opportunityId: string }) {
  const { status } = useSession()
  const [match, setMatch] = useState<Match | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    const controller = new AbortController()
    fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/match`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setMatch(data?.match ?? null))
      .catch(() => {})
    return () => controller.abort()
  }, [opportunityId, status])

  if (!match || match.score < 40) return null

  return (
    <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-xl px-4 py-2.5 bg-white/10 border border-white/15">
      <Sparkles className="h-4 w-4 text-accent-200" />
      <span className="text-sm font-semibold">{match.score}% match for you</span>
      {match.reasons.length > 0 && <span className="text-xs text-brand-100">· {match.reasons.join(', ')}</span>}
    </div>
  )
}
