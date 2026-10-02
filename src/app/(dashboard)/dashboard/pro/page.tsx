import Link from 'next/link'
import { Check, Sparkles } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'

const FREE = [
  'Search every scholarship, job and internship',
  'Save opportunities and get deadline reminders',
  'Personal match scores from your profile',
  'Weekly digest email',
]

const PRO = [
  { label: 'Application tracker', href: '/dashboard/applications' },
  { label: 'CV Builder', href: '/dashboard/tools/cv' },
  { label: 'SOP Generator', href: '/dashboard/tools/sop' },
  { label: 'Cover Letter Builder', href: '/dashboard/tools/cover-letter' },
  { label: 'Cold Email Generator', href: '/dashboard/tools/cold-email' },
  { label: 'Templates library', href: '/dashboard/library/templates' },
  { label: 'Video hub', href: '/dashboard/library/videos' },
]

export default function ProPage() {
  return (
    <div>
      <DashHeader
        eyebrow="Your plan"
        title="Xcel360 Pro"
        subtitle="Everything in Pro is free while we are in early access. Use it, tell us what works, and help shape what comes next."
      />
      <div className="grid lg:grid-cols-2 gap-5 max-w-5xl">
        <section className="paper-card p-6 sm:p-7">
          <h2 className="font-display text-2xl text-ink-900">Free</h2>
          <p className="text-sm text-ink-500 mt-1">Always free, for every student.</p>
          <ul className="mt-6 space-y-3">
            {FREE.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-ink-700">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-brand-600 text-white p-6 sm:p-7 relative overflow-hidden">
          <span className="absolute top-5 right-5 rounded-full bg-accent-300 px-3 py-1 text-[11px] font-bold text-ink-900">Early access: free</span>
          <h2 className="font-display text-2xl text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-200" /> Pro
          </h2>
          <p className="text-sm text-brand-100 mt-1">Everything in Free, plus the tools to apply well.</p>
          <ul className="mt-6 space-y-2">
            {PRO.map((p) => (
              <li key={p.href}>
                <Link href={p.href} className="flex items-center gap-2.5 text-sm rounded-lg px-2 py-1.5 -mx-2 hover:bg-white/5">
                  <Check className="h-4 w-4 text-accent-200 shrink-0" /> {p.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/tools" className="btn-light mt-7">Start with the writing tools</Link>
        </section>
      </div>
    </div>
  )
}
