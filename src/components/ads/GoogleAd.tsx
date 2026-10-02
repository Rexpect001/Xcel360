'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import AdSlot from '@/components/ads/AdSlot'
import { cn } from '@/lib/utils'

/**
 * Google AdSense unit with reserved space (no layout shift).
 *
 * Set NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-...) to switch ads on site-wide, and
 * optionally a slot id per placement below. Without a client id the slot shows
 * the Xcel360 house ad instead, so the space is never empty.
 *
 * NEXT_PUBLIC_* vars are inlined at build time, so each one must be referenced
 * literally - do not build these names dynamically.
 */
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
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
  const ref = useRef<HTMLModElement>(null)
  const slot = SLOTS[placement] || DEFAULT_SLOT
  const { minH, format } = SHAPES[shape]

  useEffect(() => {
    if (!CLIENT || !slot || !ref.current) return
    // A unit can only be filled once; skip if AdSense already processed it.
    if (ref.current.getAttribute('data-adsbygoogle-status')) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* ad blockers throw here - the reserved frame simply stays empty */
    }
  }, [slot, pathname])

  if (!CLIENT || !slot) {
    return (
      <div className={className}>
        <AdSlot placement={placement} compact={shape !== 'rectangle'} />
      </div>
    )
  }

  return (
    <div className={cn('ad-frame pt-5', minH, className)}>
      <ins
        key={pathname}
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
