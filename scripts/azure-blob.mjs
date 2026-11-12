import { BlobServiceClient } from '@azure/storage-blob'
import { randomBytes } from 'node:crypto'

let serviceClient

function withRandomSuffix(pathname) {
  const suffix = randomBytes(12).toString('hex')
  const slash = pathname.lastIndexOf('/')
  const dot = pathname.lastIndexOf('.')
  if (dot > slash) return `${pathname.slice(0, dot)}-${suffix}${pathname.slice(dot)}`
  return `${pathname}-${suffix}`
}

export async function putBlob(pathname, body, options = {}) {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured')

  serviceClient ??= BlobServiceClient.fromConnectionString(connectionString)
  const container = serviceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER ?? 'xcel360-public')
  const blobName = options.addRandomSuffix === false ? pathname : withRandomSuffix(pathname)
  const client = container.getBlockBlobClient(blobName)

  await client.uploadData(Buffer.isBuffer(body) ? body : Buffer.from(body), {
    blobHTTPHeaders: {
      blobContentType: options.contentType ?? 'application/octet-stream',
      blobCacheControl: 'public, max-age=31536000, immutable',
    },
  })

  return { url: client.url, pathname: blobName }
}
