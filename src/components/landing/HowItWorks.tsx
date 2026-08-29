import { Search, Sparkles, Send, Trophy } from 'lucide-react'

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Search',
    text: 'Browse vetted scholarships, jobs and internships - filtered by level, field and country.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'Match',
    text: 'Complete your profile and our engine scores every opportunity against your course, degree and goals.',
  },
  {
    icon: Send,
    step: '03',
    title: 'Apply',
    text: 'Track applications, save deadlines and get reminders so you never miss a closing date.',
  },
  {
    icon: Trophy,
    step: '04',
    title: 'Succeed',
    text: 'Learn from mentors, guides and success stories - then become one yourself.',
  },
]

/** Scholarships360-style process strip. */
export default function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-3">
            How it works
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
            From search to success story
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map(({ icon: Icon, step, title, text }, i) => (
            <div key={step} className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 bg-brand-700 rounded-xl flex items-center justify-center shadow-glow-sm">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="font-display text-3xl font-bold text-gray-100">{step}</span>
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{text}</p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-brand-200" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
