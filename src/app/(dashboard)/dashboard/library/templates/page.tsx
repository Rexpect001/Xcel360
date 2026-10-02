export const revalidate = 600
import Link from 'next/link'
import { FileText, ArrowUpRight, BookOpen } from 'lucide-react'
import prisma from '@/lib/prisma'
import DashHeader from '@/components/dashboard/DashHeader'
import ProNotice from '@/components/dashboard/ProNotice'
import ResourceDownloadButton from '@/components/resources/ResourceDownloadButton'

async function getData() {
  const [resources, guides] = await Promise.all([
    prisma.resource
      .findMany({
        where: { published: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 120,
      })
      .catch(() => []),
    prisma.blogPost
      .findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, title: true, slug: true, excerpt: true },
      })
      .catch(() => []),
  ])
  return { resources, guides }
}

export default async function TemplatesLibraryPage() {
  const { resources, guides } = await getData()
  const byCategory: Record<string, (typeof resources)[number][]> = {}
  for (const r of resources) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  }

  return (
    <div>
      <DashHeader
        eyebrow="Resources"
        title="Templates library"
        pro
        subtitle="CV, SOP and reference templates that have worked for past winners. Download, adapt, and make them yours."
      />
      <ProNotice />

      {resources.length === 0 ? (
        <div className="paper-card p-10 text-center text-ink-500">New templates are on the way. Check back soon.</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(byCategory).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-400 mb-3 font-sans">{category}</h2>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((r) => (
                  <article key={r.id} className="paper-card p-5 flex flex-col">
                    <div className="flex items-start gap-3">
                      <span className="w-10 h-10 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-ink-900 leading-snug">{r.title}</h3>
                        {r.description && <p className="text-sm text-ink-500 mt-1 line-clamp-3">{r.description}</p>}
                      </div>
                    </div>
                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-ink-400">
                      <span>{r.downloads.toLocaleString()} downloads</span>
                      <ResourceDownloadButton resource={r} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {guides.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink-400 mb-3 font-sans">Guides to go with them</h2>
          <div className="paper-card divide-y divide-surface-100">
            {guides.map((g) => (
              <Link key={g.id} href={`/news/${g.slug}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-surface-50">
                <BookOpen className="h-4 w-4 text-ink-400 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink-900 truncate">{g.title}</span>
                  {g.excerpt && <span className="block text-sm text-ink-500 truncate">{g.excerpt}</span>}
                </span>
                <ArrowUpRight className="h-4 w-4 text-ink-200 group-hover:text-ink-700" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
