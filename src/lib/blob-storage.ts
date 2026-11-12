import { BlobServiceClient } from '@azure/storage-blob'
import { randomBytes } from 'node:crypto'

type BlobBody = Blob | ArrayBuffer | ArrayBufferView | Buffer | ReadableStream<Uint8Array>

interface PutBlobOptions {
  contentType?: string
  /** Keep false for stable assets such as generated social images. */
  addRandomSuffix?: boolean
}

let serviceClient: BlobServiceClient | undefined

function getContainerClient() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured')
  }

  serviceClient ??= BlobServiceClient.fromConnectionString(connectionString)
  const containerName = process.env.AZURE_STORAGE_CONTAINER ?? 'xcel360-public'
  return serviceClient.getContainerClient(containerName)
}

function withRandomSuffix(pathname: string) {
  const suffix = randomBytes(12).toString('hex')
  const slash = pathname.lastIndexOf('/')
  const dot = pathname.lastIndexOf('.')
  if (dot > slash) return `${pathname.slice(0, dot)}-${suffix}${pathname.slice(dot)}`
  return `${pathname}-${suffix}`
}

async function toBuffer(body: BlobBody): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body
  if (body instanceof ArrayBuffer) return Buffer.from(body)
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength)
  }
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return Buffer.from(await body.arrayBuffer())
  }
  return Buffer.from(await new Response(body as ReadableStream<Uint8Array>).arrayBuffer())
}

/** Upload a publicly readable object to the project's Azure Blob container. */
export async function putBlob(
  pathname: string,
  body: BlobBody,
  options: PutBlobOptions = {},
) {
  const container = getContainerClient()
  const blobName = options.addRandomSuffix === false ? pathname : withRandomSuffix(pathname)
  const client = container.getBlockBlobClient(blobName)
  const data = await toBuffer(body)

  await client.uploadData(data, {
    blobHTTPHeaders: {
      blobContentType: options.contentType ?? 'application/octet-stream',
      blobCacheControl: 'public, max-age=31536000, immutable',
    },
  })

  return { url: client.url, pathname: blobName }
}
