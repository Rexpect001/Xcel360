import Link from 'next/link'
import { ArrowUpRight, Lightbulb, MessageCircleQuestion, CalendarRange } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import { STARTUP_TOOL_ORDER, WRITING_TOOLS } from '@/lib/writing-tools'

const ICONS = { 'startup-idea': Lightbulb, 'startup-interviews': MessageCircleQuestion, 'startup-roadmap': CalendarRange } as const

export default function LaunchpadPage() {
  return (
    <div>
      <DashHeader
        eyebrow="Build something useful"
        title="Xcel360 Launchpad"
        subtitle="Work through an idea, talk to potential customers, and make a practical first-month plan. Each step uses your own details and shows what still needs testing."
      />
      <div className="grid sm:grid-cols-3 gap-4">
        {STARTUP_TOOL_ORDER.map((id, index) => {
          const tool = WRITING_TOOLS[id]
          const Icon = ICONS[id]
          return (
            <Link key={id} href={`/dashboard/tools/${id}`} className="group paper-card p-6 hover:border-ink-200 hover:shadow-premium transition-all">
              <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-xl bg-brand-600 text-accent-200 flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-5 w-5 text-ink-200 group-hover:text-ink-700" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-accent-700">Step {index + 1}</p>
              <h2 className="mt-1 font-bold text-lg text-ink-900">{tool.name}</h2>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed">{tool.tagline}</p>
            </Link>
          )
        })}
      </div>
      <p className="mt-6 text-sm text-ink-500 max-w-2xl">Launchpad drafts are starting points. Check every assumption with real people before spending money or building a product.</p>
    </div>
  )
}
