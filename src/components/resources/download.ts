export interface DownloadableResource {
  id: string
  fileUrl: string
  filename?: string | null
  title: string
  isUploaded?: boolean
}

/** Starts a resource download in the browser. */
export function startResourceDownload(resource: DownloadableResource, { newTab = true } = {}) {
  if (resource.isUploaded) {
    // Navigate directly to the proxy endpoint.
    // The server returns Content-Disposition: attachment so the browser
    // downloads the file natively  -  no JS binary handling, no corruption.
    const a = document.createElement('a')
    a.href = `/api/resources/${resource.id}/download`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } else if (newTab) {
    window.open(resource.fileUrl, '_blank', 'noopener,noreferrer')
  } else {
    // Outside a click handler pop-up blockers stop window.open, so open in place.
    window.location.assign(resource.fileUrl)
  }
}
