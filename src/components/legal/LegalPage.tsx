import Link from 'next/link'
import { FileText, Mail, Shield } from 'lucide-react'
import { parseInline, type LegalBlock, type LegalDoc } from '@/content/legal'

function Rich({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((part, i) => {
        if (part.bold) return <strong key={i}>{part.text}</strong>
        if (!part.href) return <span key={i}>{part.text}</span>
        const cls = 'text-brand-700 font-medium hover:underline'
        if (part.href.startsWith('/')) return <Link key={i} href={part.href} className={cls}>{part.text}</Link>
        if (part.href.startsWith('https://')) return <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className={cls}>{part.text}</a>
        return <a key={i} href={part.href} className={cls}>{part.text}</a>
      })}
    </>
  )
}

function Block({ block }: { block: LegalBlock }) {
  if ('h' in block) return <h3 className="font-semibold text-gray-900 mt-4 mb-2">{block.h}</h3>
  if ('ul' in block) {
    return (
      <ul className="list-disc pl-5 space-y-1.5">
        {block.ul.map((li) => <li key={li}><Rich text={li} /></li>)}
      </ul>
    )
  }
  return <p><Rich text={block.p} /></p>
}

/** Terms and Privacy pages; the text lives in src/content/legal.ts (shared with the mobile app). */
export default function LegalPage({ doc, icon }: { doc: LegalDoc; icon: 'terms' | 'privacy' }) {
  const Icon = icon === 'privacy' ? Shield : FileText
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-hero-gradient text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur">
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">{doc.title}</h1>
          </div>
          <p className="text-brand-100 max-w-2xl">{doc.intro}</p>
          <p className="text-sm text-brand-100 mt-4">Last updated: {doc.lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">On this page</h2>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {doc.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-brand-700 hover:underline">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10 space-y-10">
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h2>
              <div className="text-gray-600 text-[15px] leading-relaxed space-y-3">
                {s.blocks.map((b, i) => <Block key={i} block={b} />)}
              </div>
            </section>
          ))}

          <div className="border-t border-gray-100 pt-6 flex items-center gap-3 text-sm text-gray-500">
            <Mail className="h-4 w-4 text-brand-600" />
            <span>
              Questions? Email{' '}
              <a href="mailto:hello@thexcel360.com" className="text-brand-700 font-medium hover:underline">hello@thexcel360.com</a>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
