'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'
import type { ChannelVideo } from '@/lib/youtube'

/** Thumbnail grid that opens a privacy-enhanced YouTube player in a modal. */
export default function VideoGrid({ videos }: { videos: ChannelVideo[] }) {
  const [active, setActive] = useState<ChannelVideo | null>(null)
  return (
    <>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setActive(v)}
            className="group text-left paper-card overflow-hidden hover:shadow-premium transition-shadow"
          >
            <span className="relative block aspect-video bg-ink-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Play className="h-5 w-5 text-ink-900 fill-ink-900 ml-0.5" />
                </span>
              </span>
            </span>
            <span className="block p-4">
              <span className="block font-semibold text-ink-900 leading-snug line-clamp-2">{v.title}</span>
              {v.published && (
                <span className="block text-xs text-ink-400 mt-1.5">
                  {new Date(v.published).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 text-white">
              <p className="font-semibold truncate pr-4">{active.title}</p>
              <button type="button" onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close video">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0`}
                title={active.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
