import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'
import ProNotice from '@/components/dashboard/ProNotice'
import WritingToolForm from '@/components/dashboard/WritingToolForm'
import { WRITING_TOOLS, isToolId } from '@/lib/writing-tools'

export default function WritingToolPage({ params }: { params: { tool: string } }) {
  if (!isToolId(params.tool)) notFound()
  const tool = WRITING_TOOLS[params.tool]
  return (
    <div>
      <Link href="/dashboard/tools" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> All writing tools
      </Link>
      <DashHeader eyebrow="Writing tools" title={tool.name} pro subtitle={tool.tagline} />
      <ProNotice />
      <WritingToolForm toolId={tool.id} />
    </div>
  )
}
