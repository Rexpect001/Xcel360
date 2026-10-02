import Link from 'next/link'
import { Check } from 'lucide-react'
import Logo from '@/components/brand/Logo'
import BrandPattern from '@/components/brand/BrandPattern'

const POINTS = [
  'Scholarships matched to your level, field and countries',
  'Reminders at 30, 14, 7 and 2 days before each deadline',
  'CV, SOP and cover letter tools that write in your voice',
]

/** Split auth layout: quiet brand panel on the left, the form on the right. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] bg-surface-50">
      <aside className="hidden lg:flex flex-col justify-between bg-hero-gradient text-white p-12 relative overflow-hidden">
        <BrandPattern opacity={0.14} />
        <Link href="/" aria-label="Xcel360 home" className="relative">
          <Logo tone="light" size="h-7" />
        </Link>
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight text-white">Your education, fully funded.</h1>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-brand-50">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-accent-300 text-ink-900 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-100">© {new Date().getFullYear()} Xcel360. Free for every student.</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <Link href="/" className="lg:hidden mb-8" aria-label="Xcel360 home">
          <Logo />
        </Link>
        <div className="w-full max-w-md bg-white rounded-3xl border border-surface-200 shadow-premium overflow-hidden">
          {children}
        </div>
        <p className="mt-6 text-xs text-ink-400 text-center">
          By continuing you agree to our{' '}
          <Link href="/terms" className="underline hover:text-ink-700">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-ink-700">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  )
}
