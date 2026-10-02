import { cn } from '@/lib/utils'

/**
 * Xcel360 brand mark: an "X" inside an open 360° orbit. The gold arc stops
 * short of a full circle and ends in a dot - progress that keeps moving.
 * Pure SVG so it stays crisp at every size and needs no image requests.
 */
export function LogoMark({ className, tone = 'ink' }: { className?: string; tone?: 'ink' | 'light' }) {
  const tile = tone === 'ink' ? '#0b1f3a' : '#ffffff'
  const stroke = tone === 'ink' ? '#ffffff' : '#0b1f3a'
  return (
    <svg viewBox="0 0 64 64" className={cn('h-9 w-9 shrink-0', className)} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill={tile} />
      <path
        d="M47.6 18.4A21 21 0 1 0 53 32"
        fill="none"
        stroke="#dfad3f"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <circle cx="53" cy="24.5" r="3.4" fill="#dfad3f" />
      <path
        d="M24 23.5 40 40.5M40 23.5 24 40.5"
        stroke={stroke}
        strokeWidth="5.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface LogoProps {
  className?: string
  /** 'ink' for light backgrounds, 'light' for dark backgrounds. */
  tone?: 'ink' | 'light'
  /** Small caption under the wordmark, e.g. "Admin". */
  tag?: string
  markClassName?: string
}

export default function Logo({ className, tone = 'ink', tag, markClassName }: LogoProps) {
  const word = tone === 'ink' ? 'text-ink-900' : 'text-white'
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} tone={tone === 'ink' ? 'ink' : 'light'} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display text-[1.35rem] font-semibold tracking-tight', word)}>
          Xcel<span className="text-accent-500">360</span>
        </span>
        {tag && (
          <span className={cn('mt-1 text-[10px] font-bold uppercase tracking-[0.16em]', tone === 'ink' ? 'text-ink-400' : 'text-ink-200')}>
            {tag}
          </span>
        )}
      </span>
    </span>
  )
}
