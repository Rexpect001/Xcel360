import Link from 'next/link'
import { ArrowRight, Bookmark, FileCheck2, PenLine, Send, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Explains the pipeline to someone who has not saved anything yet: what it is,
 * the stages, and the one action that starts it. Used on the dashboard and on
 * the Pipeline page's empty state, so both say the same thing.
 */
const STEPS = [
  { icon: Bookmark, title: 'Save', text: 'Tap the bookmark on any scholarship you like. It lands here.' },
  { icon: PenLine, title: 'Prepare', text: 'Gather documents and draft your CV, SOP and letters with the writing tools.' },
  { icon: Send, title: 'Submit', text: 'Mark it submitted so we stop reminding you about the deadline.' },
  { icon: Trophy, title: 'Result', text: 'Record interviews and outcomes, and keep a history of every application.' },
]

export default function PipelineGuide({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <section className={cn('dash-panel p-5 sm:p-7', className)} aria-labelledby="pipeline-guide-title">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow mb-1.5">Your application pipeline</p>
          <h2 id="pipeline-guide-title" className="font-display text-2xl text-ink-900">
            {compact ? 'Start tracking your applications' : 'Nothing in your pipeline yet'}
          </h2>
          <p className="mt-1.5 text-sm text-ink-700 leading-relaxed">
            The pipeline is your personal board for every scholarship, job or internship you are going for.
            It shows what stage each one is at and which deadline is next, so nothing slips.
          </p>
        </div>
        <Link href="/opportunities" className="btn-primary !rounded-full shrink-0">
          Find scholarships to save <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <ol className="mt-6 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {STEPS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="relative rounded-2xl border border-surface-200 bg-surface-50 p-4">
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-white ring-1 ring-surface-200 flex items-center justify-center text-brand-700">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-ink-600">Step {i + 1}</span>
            </div>
            <p className="mt-3 font-semibold text-ink-900">{title}</p>
            <p className="mt-1 text-sm text-ink-700 leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>

      {!compact && (
        <p className="mt-5 flex items-start gap-2 text-sm text-ink-700">
          <FileCheck2 className="h-4 w-4 mt-0.5 text-brand-700 shrink-0" />
          Each saved item gets a document checklist, and its deadline appears under Notifications → Deadlines.
        </p>
      )}
    </section>
  )
}
