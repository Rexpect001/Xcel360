import Link from 'next/link'
import { MessageCircle, Youtube } from 'lucide-react'

export default function CommunityLinks() {
  return (
    <section className="py-16 border-t border-gray-100 bg-white">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3" style={{ color: '#0f172a' }}>
          Get More with Xcel360
        </h2>
        <p className="text-sm mb-10" style={{ color: '#475569' }}>
          Stay connected and never miss an opportunity
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 4px 16px rgba(22,163,74,0.25)' }}
          >
            <MessageCircle className="h-5 w-5 flex-shrink-0" />
            Join WhatsApp Channel
          </Link>

          <Link
            href="https://www.youtube.com/@Xcel_360"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white text-sm transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
            style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: '0 4px 16px rgba(220,38,38,0.25)' }}
          >
            <Youtube className="h-5 w-5 flex-shrink-0" />
            Watch on YouTube
          </Link>
        </div>
      </div>
    </section>
  )
}
