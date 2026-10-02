import Link from 'next/link'
import { ArrowUpRight, FileSearch, MessagesSquare, Users, GraduationCap, Mic, Headset } from 'lucide-react'
import DashHeader from '@/components/dashboard/DashHeader'

const SERVICES = [
  {
    icon: FileSearch,
    title: 'Application review',
    text: 'An advisor reads your SOP, CV and essays against the scholarship criteria and returns tracked comments.',
    href: '/dashboard/services/advisor?topic=Application%20review',
    cta: 'Request a review',
  },
  {
    icon: Headset,
    title: 'One-to-one strategy call',
    text: '30 minutes to shortlist the right scholarships for your profile and plan your timeline.',
    href: '/dashboard/services/advisor?topic=Strategy%20call',
    cta: 'Book a call',
  },
  {
    icon: Mic,
    title: 'Interview preparation',
    text: 'Mock interview with feedback for Chevening, Commonwealth, Rhodes and university panels.',
    href: '/dashboard/services/advisor?topic=Interview%20preparation',
    cta: 'Prepare with us',
  },
  {
    icon: Users,
    title: 'Mentorship',
    text: 'Get matched with scholars who have won the awards you are applying for.',
    href: '/mentorship',
    cta: 'Find a mentor',
  },
  {
    icon: GraduationCap,
    title: 'Cohort programs',
    text: 'Structured, multi-week programs that take you from shortlist to submitted application.',
    href: '/programs',
    cta: 'See programs',
  },
  {
    icon: MessagesSquare,
    title: 'Events & clinics',
    text: 'Live info sessions, CV clinics and Q&As with scholarship alumni.',
    href: '/events',
    cta: 'Browse events',
  },
]

export default function ServicesPage() {
  return (
    <div>
      <DashHeader
        eyebrow="Services"
        title="All services"
        subtitle="Human help when you need it, from a quick strategy call to a full application review."
        actions={<Link href="/dashboard/services/advisor" className="btn-primary">Speak with an advisor</Link>}
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SERVICES.map(({ icon: Icon, title, text, href, cta }) => (
          <Link key={title} href={href} className="group paper-card p-6 flex flex-col hover:border-ink-200 hover:shadow-premium transition-all">
            <span className="w-11 h-11 rounded-xl bg-surface-100 text-ink-800 flex items-center justify-center group-hover:bg-ink-900 group-hover:text-accent-300 transition-colors">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 font-bold text-lg text-ink-900 font-sans">{title}</h2>
            <p className="text-sm text-ink-500 mt-1.5 leading-relaxed flex-1">{text}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink-900">
              {cta} <ArrowUpRight className="h-4 w-4 text-ink-300 group-hover:text-ink-900 transition-colors" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
