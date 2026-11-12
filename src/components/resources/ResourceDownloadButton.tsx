'use client'
import { Download } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { startResourceDownload, type DownloadableResource } from './download'

const BUTTON_CLASS =
  'flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-wait'

interface Props {
  resource: DownloadableResource
  /** Public pages route through /resources/download/[id], which shows an ad before the file starts. */
  viaAdPage?: boolean
}

export default function ResourceDownloadButton({ resource, viaAdPage = false }: Props) {
  const [downloading, setDownloading] = useState(false)

  if (viaAdPage) {
    return (
      <Link href={`/resources/download/${resource.id}`} className={BUTTON_CLASS}>
        <Download className="h-3.5 w-3.5" />
        Download
      </Link>
    )
  }

  const handleDownload = () => {
    setDownloading(true)
    startResourceDownload(resource)
    // Re-enable button after browser starts the download
    setTimeout(() => setDownloading(false), 2000)
  }

  return (
    <button onClick={handleDownload} disabled={downloading} className={BUTTON_CLASS}>
      <Download className="h-3.5 w-3.5" />
      {downloading ? 'Downloading...' : 'Download'}
    </button>
  )
}
