'use client'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Download } from 'lucide-react'
import { startResourceDownload, type DownloadableResource } from './download'

const SECONDS = 5

/** Counts down, then starts the download once; a button covers blocked or failed starts. */
export default function DownloadCountdown({ resource }: { resource: DownloadableResource }) {
  const [left, setLeft] = useState(SECONDS)
  const started = useRef(false)

  useEffect(() => {
    if (left <= 0) {
      if (!started.current) {
        started.current = true
        startResourceDownload(resource, { newTab: false })
      }
      return
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [left, resource])

  const ready = left <= 0

  return (
    <div className="text-center">
      {ready ? (
        <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle className="h-4 w-4" /> Your download has started
        </p>
      ) : (
        <p className="text-sm text-ink-600" aria-live="polite">
          Your download will start in <span className="font-bold text-ink-900">{left}</span> second{left === 1 ? '' : 's'}…
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          started.current = true
          setLeft(0)
          startResourceDownload(resource)
        }}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        <Download className="h-4 w-4" />
        {ready ? 'Download again' : 'Download now'}
      </button>
    </div>
  )
}
