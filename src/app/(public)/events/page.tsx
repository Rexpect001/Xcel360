export const revalidate = 900
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { Calendar, Video, Users, BookOpen, MessageCircle, ArrowRight, MapPin, Zap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ScrollingBeneficiaries from '@/components/programs/ScrollingBeneficiaries'
import { CountdownBadge } from '@/components/events/CountdownTimer'

export const metadata: Metadata = {
  title: 'Events & Webinars',
  description:
    'Join free webinars, workshops, and Q&A sessions on scholarships, study abroad, and career development. Register for upcoming Xcel360 events.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Events & Webinars  -  Xcel360',
    description: 'Join free webinars, workshops, and Q&A sessions on scholarships and study abroad.',
    url: '/events',
  },
}

async function getData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any
  const [events, programs, beneficiaries] = await Promise.all([
    db.event.findMany({ where: { published: true }, orderBy: { date: 'asc' } }).catch(() => []),
    db.program.findMany({
      where: { published: true },
      orderBy: { cohortNumber: 'asc' },
      include: { _count: { select: { beneficiaries: true } } },
    }).catch(() => []),
    db.beneficiary.findMany({
      select: { id: true, firstName: true, department: true, school: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []),
  ])
  return { events, programs, beneficiaries }
}

const TYPE_COLORS: Record<string, string> = {
  Webinar: 'from-brand-600 to-sky-500',
  Workshop: 'from-violet-600 to-purple-500',
  'Q&A': 'from-emerald-600 to-teal-500',
  'Info Session': 'from-orange-500 to-amber-400',
  Zoom: 'from-brand-600 to-sky-500',
}

const TYPE_BG: Record<string, string> = {
  Webinar: 'bg-sky-50 text-sky-700',
  Workshop: 'bg-violet-50 text-violet-700',
  'Q&A': 'bg-emerald-50 text-emerald-700',
  'Info Session': 'bg-orange-50 text-orange-700',
  Zoom: 'bg-sky-50 text-sky-700',
}

function typeGrad(type: string) {
  return TYPE_COLORS[type] ?? 'from-brand-600 to-brand-400'
}

function typeBadge(type: string) {
  return TYPE_BG[type] ?? 'bg-brand-50 text-brand-700'
}

export default async function EventsPage() {
  const { events, programs, beneficiaries } = await getData()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcoming = events.filter((e: any) => new Date(e.date) > new Date())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const past = events.filter((e: any) => new Date(e.date) <= new Date())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 pt-28 pb-20 px-4 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 -left-10 w-48 h-48 bg-sky-400/10 rounded-full" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-white/10 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Zap className="h-3 w-3" /> Live Events & Programs
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Events &amp; Programs</h1>
          <p className="text-blue-200 text-lg max-w-xl">
            Webinars, workshops, info sessions, and our cohort mentorship programs  -  all free for students.
          </p>
          {upcoming.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-3 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{upcoming.length} Upcoming Event{upcoming.length > 1 ? 's' : ''}</p>
                  <p className="text-blue-300 text-xs">Registration open</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
              <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{upcoming.length} open</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {upcoming.map((event: any) => (
                <div key={event.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                  {/* Flyer image or gradient bar */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(event as any).coverImage ? (
                    <div className="relative h-40 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={(event as any).coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  ) : (
                    <div className={`h-1.5 bg-gradient-to-r ${typeGrad(event.type)}`} />
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadge(event.type)}`}>{event.type}</span>
                      <CountdownBadge targetDate={event.date} />
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 leading-snug group-hover:text-brand-700 transition-colors line-clamp-2 text-base">
                      {event.title}
                    </h3>

                    {event.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{event.description}</p>
                    )}

                    {!event.description && <div className="flex-1" />}

                    {/* Meta */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                        <span className="font-medium">{formatDate(event.date)}</span>
                      </div>
                      {event.host && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {event.type === 'In-person' || event.type === 'Workshop'
                            ? <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            : <Video className="h-3.5 w-3.5 flex-shrink-0" />
                          }
                          <span>Hosted by <span className="font-medium text-gray-600">{event.host}</span></span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${typeGrad(event.type)} hover:opacity-90 transition-opacity`}
                    >
                      Register Now <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past events */}
        {past.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-6">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {past.map((event: any) => (
                <div key={event.id} className="bg-white/60 rounded-2xl border border-gray-100 p-5 flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-700 text-sm line-clamp-2 mb-1">{event.title}</h3>
                    {event.host && <p className="text-xs text-gray-400">by {event.host}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(event.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No events scheduled yet.</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon  -  new events are added regularly.</p>
          </div>
        )}

        {(events.length > 0 || programs.length > 0) && <hr className="border-gray-200" />}

        {/* Mentorship Programs */}
        <div>
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Mentorship Programs</h2>
            <p className="text-gray-500 mt-1">Cohort-based programs guiding students through the scholarship application journey.</p>
          </div>

          {programs.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {programs.map((prog: any) => (
                <div key={prog.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-2 bg-gradient-to-r from-brand-600 to-sky-400" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                        {prog.cohortNumber ? `Cohort ${prog.cohortNumber}` : 'Program'}
                      </span>
                      <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
                        <Users className="h-4 w-4 text-sky-600" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{prog.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">{prog.description}</p>
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-brand-500" />
                        <span>{prog.focus}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-brand-500" />
                        <span>{formatDate(prog.startDate)}{prog.endDate ? `  -  ${formatDate(prog.endDate)}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-brand-500" />
                        <span><strong className="text-gray-800">{prog._count.beneficiaries || prog.participants}</strong> participants</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Programs will appear here once added.</p>
            </div>
          )}
        </div>

        {/* Beneficiaries */}
        {beneficiaries.length > 0 && (
          <div>
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Our Beneficiaries</h2>
              <p className="text-gray-500 mt-1">Students who have gone through our cohort mentorship programs.</p>
            </div>
            <ScrollingBeneficiaries beneficiaries={beneficiaries} />
          </div>
        )}

        {/* CTA */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #004ca3 0%, #006fec 100%)' }}>
          <div className="px-8 py-12 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready for the next cohort?</h2>
            <p className="text-sky-100 mb-8 max-w-lg mx-auto">
              Join our WhatsApp channel to be the first to know when we open applications for the next mentorship cohort.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="h-5 w-5" /> Join WhatsApp Channel
              </a>
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 bg-white text-brand-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Browse Scholarships <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
