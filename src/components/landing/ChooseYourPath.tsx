import Link from 'next/link'
import { GraduationCap, BookOpen, FlaskConical, Award, ArrowRight } from 'lucide-react'

const paths = [
  {
    level: 'Undergrad',
    title: 'Undergraduate',
    description: 'Full and partial scholarships to fund your first degree abroad or at home.',
    icon: BookOpen,
    accent: 'bg-sky-50 text-sky-700',
    hoverRing: 'hover:border-sky-300',
  },
  {
    level: 'Masters',
    title: 'Masters',
    description: 'Fully funded taught and research masters — Chevening, DAAD, Erasmus+ and more.',
    icon: GraduationCap,
    accent: 'bg-brand-50 text-brand-700',
    hoverRing: 'hover:border-brand-300',
  },
  {
    level: 'PhD',
    title: 'PhD & Research',
    description: 'Doctoral funding, research grants and assistantships across the globe.',
    icon: FlaskConical,
    accent: 'bg-violet-50 text-violet-700',
    hoverRing: 'hover:border-violet-300',
  },
  {
    level: 'Postdoc',
    title: 'Fellowships & Postdoc',
    description: 'Career-advancing fellowships, postdocs and professional development awards.',
    icon: Award,
    accent: 'bg-amber-50 text-amber-700',
    hoverRing: 'hover:border-amber-300',
  },
]

/** ProFellow-style "Choose Your Path" — routes into pre-filtered listings. */
export default function ChooseYourPath() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
            Choose your path
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            Funding for every stage of your journey
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Whether you are starting out or advancing your research career — pick your level and
            see only what fits you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paths.map(({ level, title, description, icon: Icon, accent, hoverRing }) => (
            <Link
              key={level}
              href={`/opportunities?level=${encodeURIComponent(level)}`}
              className={`group bg-white rounded-2xl border-2 border-gray-100 p-6 transition-all hover:-translate-y-1 hover:shadow-premium ${hoverRing}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${accent}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{description}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 group-hover:gap-2.5 transition-all">
                Explore <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
