import Link from 'next/link'
import {
  Sparkles, Clock, Briefcase, Star, Cpu, HeartPulse, Scale, Leaf, ArrowRight,
} from 'lucide-react'

const categories = [
  { href: '/opportunities?funding=Fully%20funded', label: 'Fully Funded', desc: 'Tuition, stipend & travel covered', icon: Sparkles, color: 'bg-emerald-50 text-emerald-700' },
  { href: '/opportunities?soon=30', label: 'Closing Soon', desc: 'Deadlines in the next 30 days', icon: Clock, color: 'bg-red-50 text-red-600' },
  { href: '/jobs', label: 'Jobs', desc: 'Full-time & remote positions', icon: Briefcase, color: 'bg-brand-50 text-brand-700' },
  { href: '/internships', label: 'Internships', desc: 'Gain experience worldwide', icon: Star, color: 'bg-amber-50 text-amber-700' },
  { href: '/opportunities?field=Engineering', label: 'Engineering & STEM', desc: 'Technical fields & research', icon: Cpu, color: 'bg-violet-50 text-violet-700' },
  { href: '/opportunities?field=Medicine', label: 'Health & Medicine', desc: 'Medical & health sciences', icon: HeartPulse, color: 'bg-rose-50 text-rose-700' },
  { href: '/opportunities?field=Law', label: 'Law & Policy', desc: 'Legal studies & public policy', icon: Scale, color: 'bg-slate-100 text-slate-700' },
  { href: '/opportunities?field=Environmental Science', label: 'Environment', desc: 'Climate & sustainability', icon: Leaf, color: 'bg-teal-50 text-teal-700' },
]

/** Scholarships360-style category browse - deep links into filtered listings. */
export default function CategoryBrowse() {
  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
              Browse by category
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
              Find your fit, faster
            </h2>
          </div>
          <Link
            href="/opportunities"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            View everything <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map(({ href, label, desc, icon: Icon, color }) => (
            <Link
              key={label}
              href={href}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-premium hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base group-hover:text-brand-700 transition-colors">
                {label}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
