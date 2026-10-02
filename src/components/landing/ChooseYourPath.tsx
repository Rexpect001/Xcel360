import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const paths = [
  { level: 'Undergrad', title: 'Undergraduate', description: 'Full and partial awards for your first degree, at home or abroad.' },
  { level: 'Masters', title: 'Masters', description: 'Chevening, DAAD, Erasmus Mundus and hundreds of university awards.' },
  { level: 'PhD', title: 'PhD & research', description: 'Doctoral funding, studentships and research assistantships.' },
  { level: 'Postdoc', title: 'Fellowships', description: 'Postdocs, leadership fellowships and professional development.' },
]

/** Entry points by study level - each routes into a pre-filtered listing. */
export default function ChooseYourPath() {
  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-2">Browse by level</p>
          <h2 className="font-display text-3xl sm:text-4xl text-ink-900">Funding for every stage</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-surface-200 rounded-2xl overflow-hidden border border-surface-200">
          {paths.map(({ level, title, description }, i) => (
            <Link
              key={level}
              href={`/opportunities?level=${encodeURIComponent(level)}`}
              className="group bg-white p-6 sm:p-7 hover:bg-ink-900 transition-colors"
            >
              <span className="font-display text-sm text-accent-600 group-hover:text-accent-300">0{i + 1}</span>
              <h3 className="mt-6 font-display text-2xl font-semibold text-ink-900 group-hover:text-white flex items-center justify-between">
                {title}
                <ArrowUpRight className="h-5 w-5 text-ink-200 group-hover:text-accent-300 transition-colors" />
              </h3>
              <p className="text-sm text-ink-500 group-hover:text-ink-200 mt-2 leading-relaxed">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
