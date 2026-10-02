import Link from 'next/link'
import { ArrowUpRight, SquareUser, ScrollText, Mail, Send } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import ProNotice from '@/components/dashboard/ProNotice'
import { WRITING_TOOLS, TOOL_ORDER } from '@/lib/writing-tools'

const ICONS = { cv: SquareUser, sop: ScrollText, 'cover-letter': Mail, 'cold-email': Send } as const

export default function ToolsIndexPage() {
  return (
    <div>
      <DashHeader
        eyebrow="Materials"
        title="Writing tools"
        pro
        subtitle="Draft the documents every application asks for. Each tool uses only what you tell it, so the result sounds like you."
      />
      <ProNotice />
      <div className="grid sm:grid-cols-2 gap-4">
        {TOOL_ORDER.map((id) => {
          const t = WRITING_TOOLS[id]
          const Icon = ICONS[id]
          return (
            <Link key={id} href={`/dashboard/tools/${id}`} className="group paper-card p-6 hover:border-ink-200 hover:shadow-premium transition-all">
              <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-xl bg-brand-600 text-accent-200 flex items-center justify-center"><Icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-5 w-5 text-ink-200 group-hover:text-ink-700 transition-colors" />
              </div>
              <h2 className="mt-5 font-bold text-lg text-ink-900">{t.name}</h2>
              <p className="text-sm text-ink-500 mt-1 leading-relaxed">{t.tagline}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
