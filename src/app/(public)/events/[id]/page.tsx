export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Calendar, Clock, User, Video, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import RegisterForm from './RegisterForm'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return { title: 'Event Not Found' }
  const description = event.description
    ? event.description.slice(0, 155).trim()
    : `Join the ${event.type} — ${event.title} hosted by Xcel360.`
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.id}` },
    openGraph: {
      title: event.title,
      description,
      url: `${BASE}/events/${event.id}`,
      type: 'article',
    },
  }
}

const TYPE_ICONS: Record<string, typeof Video> = {
  Zoom: Video,
  Webinar: Video,
  Workshop: MapPin,
  'In-person': MapPin,
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any

  const event = await prisma.event.findUnique({
    where: { id: params.id, published: true },
  })
  if (!event) notFound()

  const questions = await db.eventQuestion.findMany({
    where: { eventId: params.id },
    orderBy: { sortOrder: 'asc' },
  })

  const isPast = new Date(event.date) < new Date()
  const Icon = TYPE_ICONS[event.type] ?? Calendar

  const eventDate = new Date(event.date)
  const dateStr = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = eventDate.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  })

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description ?? `${event.type} hosted by Xcel360`,
    startDate: event.date.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      event.type === 'In-person'
        ? 'https://schema.org/OfflineEventAttendanceMode'
        : 'https://schema.org/OnlineEventAttendanceMode',
    organizer: {
      '@type': 'Organization',
      name: event.host ?? 'Xcel360',
      url: BASE,
    },
    url: `${BASE}/events/${event.id}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Events
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <span className="text-xs font-semibold text-brand-700 bg-white px-3 py-1 rounded-full">{event.type}</span>
            {isPast ? (
              <span className="text-xs font-semibold text-gray-400 bg-white/20 px-3 py-1 rounded-full">Past Event</span>
            ) : (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">Upcoming</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">{event.title}</h1>

          <div className="flex flex-wrap gap-4 text-blue-100 text-sm justify-center">
            <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{dateStr}</div>
            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{timeStr}</div>
            {event.host && <div className="flex items-center gap-1.5"><User className="h-4 w-4" />{event.host}</div>}
            <div className="flex items-center gap-1.5"><Icon className="h-4 w-4" />{event.type}</div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* About */}
        {event.description && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 text-center">About this Event</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line text-center">{event.description}</p>
          </div>
        )}

        {/* Registration form / closed state */}
        {isPast ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">This event has ended</p>
            <p className="text-sm text-gray-400 mb-6">Registration is now closed.</p>
            <a
              href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
            >
              Join WhatsApp for future events
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Register for this Event</h2>
              <p className="text-sm text-gray-500">Fill in your details below to secure your spot.</p>
            </div>
            <RegisterForm eventId={event.id} eventTitle={event.title} questions={questions} />
          </div>
        )}

      </div>
    </div>
    </>
  )
}
