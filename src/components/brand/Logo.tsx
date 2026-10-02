/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'

/**
 * The official XCEL wordmark (extracted from the brand files into
 * /public/brand). `tone="ink"` is the brand-blue version for light
 * backgrounds; `tone="light"` is white for blue/dark backgrounds.
 */
interface LogoProps {
  className?: string
  tone?: 'ink' | 'light'
  /** Small caption beside the wordmark, e.g. "Admin". */
  tag?: string
  /** Height utility for the wordmark, default h-6 (24px). */
  size?: string
}

export default function Logo({ className, tone = 'ink', tag, size = 'h-6' }: LogoProps) {
  const light = tone === 'light'
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src={light ? '/brand/xcel-white.png' : '/brand/xcel-blue.png'}
        alt="Xcel360"
        width={120}
        height={24}
        className={cn(size, 'w-auto select-none')}
        draggable={false}
      />
      {tag && (
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-[0.16em] px-1.5 py-0.5 rounded border',
            light ? 'text-brand-50 border-white/30' : 'text-brand-700 border-brand-200 bg-brand-50'
          )}
        >
          {tag}
        </span>
      )}
    </span>
  )
}

/** The X mark on its own - for tight spaces such as avatars and badges. */
export function LogoMark({ className, tone = 'ink' }: { className?: string; tone?: 'ink' | 'light' }) {
  return (
    <img
      src={tone === 'light' ? '/brand/x-white.png' : '/brand/x-blue.png'}
      alt=""
      aria-hidden
      className={cn('h-6 w-auto', className)}
    />
  )
}
