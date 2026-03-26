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

  const handleDownload = async () => {
    setDownloading(true)
    // Increment download counter (non-blocking)
    fetch(`/api/resources/${resource.id}/download`, { method: 'POST' }).catch(() => {})

    try {
      if (resource.isUploaded) {
        // Fetch the file and trigger browser download
        const res = await fetch(resource.fileUrl)
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = resource.filename ?? resource.title
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // External link — open in new tab
        window.open(resource.fileUrl, '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.open(resource.fileUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setDownloading(false)
    }
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
