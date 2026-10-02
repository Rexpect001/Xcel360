import { cn } from '@/lib/utils'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

/**
 * Shared page header band for public pages: deep ink with a fine grid,
 * Fraunces headline and a gold eyebrow. Deliberately quiet so content leads.
 */
export default function PageHero({ eyebrow, title, subtitle, children, className }: PageHeroProps) {
  return (
    <section className={cn('relative bg-hero-gradient text-white pt-28 pb-14 overflow-hidden', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(180deg, black 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 85%)',
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {eyebrow && <p className="eyebrow !text-accent-300 mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base md:text-lg text-ink-200 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </section>
  )
}
