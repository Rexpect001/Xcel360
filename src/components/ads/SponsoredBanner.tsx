'use client'

import { useEffect, useState } from 'react'
import { Megaphone, ArrowRight } from 'lucide-react'

interface HomeAd {
  enabled: boolean
  title: string
  text: string
  link: string
  cta: string
  image: string
}

/**
 * Homepage sponsored banner - fully managed from Admin → Site Settings.
 * Renders nothing unless enabled with at least a title. Leaderboard-style:
 * slim, clearly labelled "Sponsored", never intrusive.
 */
export default function SponsoredBanner() {
  const [ad, setAd] = useState<HomeAd | null>(null)

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data) => {
        const a = data?.homeAd as HomeAd | undefined
        if (a?.enabled && a.title) setAd(a)
      })
      .catch(() => {})
  }, [])

  if (!ad) return null

  const Wrapper = ad.link ? 'a' : 'div'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Wrapper
        {...(ad.link ? { href: ad.link, target: '_blank', rel: 'noopener noreferrer sponsored' } : {})}
        className="block group"
      >
        <aside
          aria-label="Sponsored placement"
          className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-brand-50 shadow-sm hover:shadow-premium transition-shadow"
        >
          <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-5">
            {/* Optional creative image */}
            {ad.image && (
              <div className="hidden sm:block shrink-0 w-24 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.image} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="hidden xs:flex sm:flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Megaphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/80 mb-0.5">
                  Sponsored
                </p>
                <h3 className="font-display font-bold text-gray-900 text-sm sm:text-base truncate group-hover:text-brand-700 transition-colors">
                  {ad.title}
                </h3>
                {ad.text && (
                  <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">{ad.text}</p>
                )}
              </div>
            </div>

            {ad.link && (
              <span className="shrink-0 inline-flex items-center gap-1.5 bg-ink-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl group-hover:bg-ink-800 transition-colors">
                {ad.cta || 'Learn more'} <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </aside>
      </Wrapper>
    </div>
  )
}
