import prisma from '@/lib/prisma'
import { Calendar, Video, ExternalLink, Users, BookOpen, MessageCircle, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import ScrollingBeneficiaries from '@/components/programs/ScrollingBeneficiaries'

export const metadata = { title: 'Events & Programs — Xcel360' }

async function getData() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const [events, programs, beneficiaries] = await Promise.all([
      prisma.event.findMany({
        where: { published: true },
        orderBy: { date: 'asc' },
      }),
      db.program.findMany({
        where: { published: true },
        orderBy: { cohortNumber: 'asc' },
        include: { _count: { select: { beneficiaries: true } } },
      }),
      db.beneficiary.findMany({
        select: { id: true, firstName: true, department: true, school: true },
        orderBy: { createdAt: 'desc' },
      }),
    ])
    return { events, programs, beneficiaries }
  } catch {
    return { events: [], programs: [], beneficiaries: [] }
  }
}

export default async function EventsPage() {
  const { events, programs, beneficiaries } = await getData()
  const upcoming = events.filter((e) => new Date(e.date) > new Date())
  const past = events.filter((e) => new Date(e.date) <= new Date())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Events &amp; Programs</h1>
          <p className="text-blue-200 text-lg">Webinars, workshops, info sessions, and our cohort mentorship programs.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">

        {/* ── Events ── */}
        {upcoming.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                      <Video className="h-4 w-4 text-brand-700" />
                    </div>
                    <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{event.type}</span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">Upcoming</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>
                  )}
                  {event.host && <p className="text-xs text-gray-400 mb-3">Hosted by {event.host}</p>}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Calendar className="h-4 w-4 text-brand-600" />
                    {formatDate(event.date)}
                  </div>
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
                    >
                      Register <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((event) => (
                <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 opacity-75">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{event.type}</span>
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full ml-auto">Past</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
                  {event.host && <p className="text-xs text-gray-400 mb-3">Hosted by {event.host}</p>}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No events scheduled yet. Check back soon.</p>
          </div>
        )}

        {/* ── Divider ── */}
        {(events.length > 0 || programs.length > 0) && (
          <hr className="border-gray-200" />
        )}

        {/* ── Mentorship Programs ── */}
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
                        <span>{formatDate(prog.startDate)}{prog.endDate ? ` — ${formatDate(prog.endDate)}` : ''}</span>
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

        {/* ── Beneficiaries ── */}
        {beneficiaries.length > 0 && (
          <div>
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900">Our Beneficiaries</h2>
              <p className="text-gray-500 mt-1">Students who have gone through our cohort mentorship programs.</p>
            </div>
            <ScrollingBeneficiaries beneficiaries={beneficiaries} />
          </div>
        )}

        {/* ── CTA ── */}
        <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' }}>
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
