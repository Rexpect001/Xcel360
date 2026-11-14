'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ADSENSE_CLIENT, ADS_ENABLED } from '@/lib/ads'
import { cn } from '@/lib/utils'

/**
 * Google AdSense unit with reserved space (no layout shift).
 *
 * Ads run in production builds (see lib/ads.ts). Each placement needs an ad
 * unit slot id, either its own or NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT. Without
 * one - or when Google has no ad to fill the unit, or an ad blocker stops the
 * script - nothing renders (the house banner was retired).
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so each one must be referenced
 * literally - do not build these names dynamically.
 */
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT

const SLOTS = {
  'home-feed':      process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  'listing-top':    process.env.NEXT_PUBLIC_ADSENSE_SLOT_LISTING,
  'listing-infeed': process.env.NEXT_PUBLIC_ADSENSE_SLOT_INFEED,
  'detail-top':     process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_TOP,
  'detail-inline':  process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_INLINE,
  'detail-sidebar': process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_SIDEBAR,
} as const

export type AdPlacement = keyof typeof SLOTS

const SHAPES = {
  leaderboard: { minH: 'min-h-[100px] sm:min-h-[110px]', format: 'horizontal' },
  rectangle:   { minH: 'min-h-[280px]',                  format: 'rectangle' },
  fluid:       { minH: 'min-h-[140px]',                  format: 'auto' },
} as const

/** How long to wait for the AdSense script before assuming it was blocked. */
const SCRIPT_TIMEOUT_MS = 10_000

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

interface GoogleAdProps {
  placement: AdPlacement
  shape?: keyof typeof SHAPES
  className?: string
}

export default function GoogleAd({ placement, shape = 'fluid', className }: GoogleAdProps) {
  const pathname = usePathname()
  const slot = SLOTS[placement] || DEFAULT_SLOT

  if (!ADS_ENABLED || !slot) {
    return <HouseAd placement={placement} shape={shape} className={className} />
  }

  // A unit can only be filled once, so give each page its own fresh unit.
  return <AdUnit key={pathname} placement={placement} slot={slot} shape={shape} className={className} />
}

/**
 * Fallback when no real ad can show. The old "Need a stronger scholarship
 * application? View resources" house banner was retired (Nov 2026): those tools
 * now live in the dashboard, so the space collapses instead. AdSlot is kept for
 * a future sponsor; return it here to bring a house banner back.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HouseAd(_props: { placement: string; shape: keyof typeof SHAPES; className?: string }) {
  return null
}

function AdUnit({ placement, slot, shape, className }: { placement: AdPlacement; slot: string; shape: keyof typeof SHAPES; className?: string }) {
  const ref = useRef<HTMLModElement>(null)
  const [fallback, setFallback] = useState(false)
  const { minH, format } = SHAPES[shape]

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!el.getAttribute('data-adsbygoogle-status')) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch {
        setFallback(true)
        return
      }
    }

    // AdSense marks the unit data-ad-status="unfilled" when it has no ad.
    const check = () => {
      if (el.getAttribute('data-ad-status') === 'unfilled') setFallback(true)
    }
    const observer = new MutationObserver(check)
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] })
    check()

    // The script never processed the unit: blocked or failed to load.
    const timer = window.setTimeout(() => {
      if (!el.getAttribute('data-adsbygoogle-status')) setFallback(true)
    }, SCRIPT_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  if (fallback) return <HouseAd placement={placement} shape={shape} className={className} />

  return (
    <div className={cn('ad-frame pt-5', minH, className)}>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
