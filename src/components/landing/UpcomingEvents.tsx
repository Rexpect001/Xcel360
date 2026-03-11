import Link from 'next/link'
import type { Event } from '@prisma/client'
import { Calendar, ExternalLink, Video, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type SerializedEvent = Omit<Event, 'date' | 'createdAt' | 'updatedAt'> & {
  date: string | Date
  createdAt: string | Date
  updatedAt: string | Date
}

export default function UpcomingEvents({ events }: { events: SerializedEvent[] }) {
  if (events.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Upcoming Events</h2>
            <p className="text-gray-500 mt-2">Webinars, workshops &amp; info sessions</p>
          </div>
          <Link href="/events" className="hidden sm:flex items-center gap-2 text-brand-700 font-semibold text-sm hover:text-brand-800">
            All events <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                  <Video className="h-4 w-4 text-brand-700" />
                </div>
                <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">{event.type}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
              {event.host && <p className="text-sm text-gray-500 mb-3">Hosted by {event.host}</p>}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4" />
                {formatDate(event.date)}
              </div>
              {event.link && (
                <a
                  href={event.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-700 font-medium hover:text-brand-800"
                >
                  Register <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
