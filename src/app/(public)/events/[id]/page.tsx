export const revalidate = 3600
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Calendar, Clock, User, Video, MapPin, ArrowLeft, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import RegisterForm from './RegisterForm'
import CountdownTimer from '@/components/events/CountdownTimer'

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
      title: event.title, description, url: `${BASE}/events/${event.id}`, type: 'article',
      images: [{ url: `${BASE}/api/og?id=${event.id}&type=event`, width: 1200, height: 630, alt: event.title }],
    },
    twitter: { card: 'summary_large_image', title: event.title, description, images: [`${BASE}/api/og?id=${event.id}&type=event`] },
  }
}

const TYPE_GRAD: Record<string, string> = {
  Webinar: 'from-brand-950 via-brand-900 to-sky-700',
  Workshop: 'from-violet-950 via-violet-900 to-purple-700',
  'Q&A': 'from-emerald-950 via-emerald-900 to-teal-700',
  'Info Session': 'from-orange-900 via-orange-800 to-amber-700',
  Zoom: 'from-brand-950 via-brand-900 to-sky-700',
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event = await (prisma as any).event.findUnique({ where: { id: params.id, published: true } })
  if (!event) notFound()

  const questions = await db.eventQuestion.findMany({
    where: { eventId: params.id },
    orderBy: { sortOrder: 'asc' },
  })

  const isPast = new Date(event.date) < new Date()
  const heroGrad = TYPE_GRAD[event.type] ?? 'from-brand-950 via-brand-900 to-brand-700'

  const eventDate = new Date(event.date)
  // Format in West Africa Time so the date/time match the audience's locale
  // regardless of the server timezone (UTC on Vercel).
  const dateStr = eventDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos',
  })
  const timeStr = eventDate.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos',
  }) + ' WAT'

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
    organizer: { '@type': 'Organization', name: event.host ?? 'Xcel360', url: BASE },
    url: `${BASE}/events/${event.id}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-gray-50">

        {/* Hero */}
        <div className={`relative bg-gradient-to-br ${heroGrad} pt-28 pb-24 px-4 overflow-hidden`}>
          {/* Decorative blobs */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl" />

          <div className="max-w-3xl mx-auto relative">
            <Link href="/events" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Events
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                {event.type}
              </span>
              {isPast ? (
                <span className="text-xs font-semibold text-gray-300 bg-black/20 px-3 py-1 rounded-full">Past Event</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-300 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Registration Open
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
              {event.title}
            </h1>

            {/* Countdown */}
            {!isPast && (
              <div className="mb-8">
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-3">Starts in</p>
                <CountdownTimer targetDate={event.date} />
              </div>
            )}

            {/* Event meta chips */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <Calendar className="h-4 w-4 text-white/70" />
                <span className="text-sm text-white font-medium">{dateStr}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <Clock className="h-4 w-4 text-white/70" />
                <span className="text-sm text-white font-medium">{timeStr}</span>
              </div>
              {event.host && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                  <User className="h-4 w-4 text-white/70" />
                  <span className="text-sm text-white font-medium">{event.host}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                {event.type === 'In-person' || event.type === 'Workshop'
                  ? <MapPin className="h-4 w-4 text-white/70" />
                  : <Video className="h-4 w-4 text-white/70" />
                }
                <span className="text-sm text-white font-medium">{event.type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">

          {/* Flyer image */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(event as any).coverImage && (
            <div className="rounded-2xl overflow-hidden shadow-lg -mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={(event as any).coverImage}
                alt={`${event.title} flyer`}
                className="w-full object-cover max-h-96"
              />
            </div>
          )}

          {/* About card */}
          {event.description && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-gray-900">About this Event</h2>
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>
          )}

          {/* Registration */}
          {isPast ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-gray-300 to-gray-400" />
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">This event has ended</h3>
                <p className="text-sm text-gray-400 mb-8">Registration is now closed. Join our community to hear about future events.</p>
                <a
                  href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  <Users className="h-4 w-4" /> Join WhatsApp for future events
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className={`h-1.5 bg-gradient-to-r ${heroGrad.replace('from-', 'from-').split(' ').slice(0, 2).join(' ')}`} />
              <div className="p-8">
                {/* Form header */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-brand-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Secure your spot</h2>
                    <p className="text-sm text-gray-500">Free registration · Takes less than a minute</p>
                  </div>
                </div>
                <RegisterForm eventId={event.id} eventTitle={event.title} questions={questions} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
