'use client'
import { Download } from 'lucide-react'
import { useState } from 'react'

interface Props {
  resource: {
    id: string
    fileUrl: string
    filename?: string | null
    title: string
    isUploaded?: boolean
  }
}

export default function ResourceDownloadButton({ resource }: Props) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    if (resource.isUploaded) {
      // Navigate directly to the proxy endpoint.
      // The server returns Content-Disposition: attachment so the browser
      // downloads the file natively — no JS binary handling, no corruption.
      const a = document.createElement('a')
      a.href = `/api/resources/${resource.id}/download`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer')
    }
    // Re-enable button after browser starts the download
    setTimeout(() => setDownloading(false), 2000)
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      <Download className="h-3.5 w-3.5" />
      {downloading ? 'Downloading...' : 'Download'}
    </button>
  )
}
