import { cn } from '@/lib/utils'
import BrandPattern from '@/components/brand/BrandPattern'

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
      <BrandPattern opacity={0.09} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {eyebrow && <p className="eyebrow !text-accent-200 mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base md:text-lg text-brand-100 leading-relaxed">{subtitle}</p>}
        {children}
      </div>
    </section>
  )
}
