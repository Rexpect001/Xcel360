/**
 * Copy every Vercel Blob URL referenced by the database into Azure Blob Storage.
 * Preview: node scripts/migrate-vercel-blobs.mjs
 * Apply:   node scripts/migrate-vercel-blobs.mjs --apply
 */
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { putBlob } from './azure-blob.mjs'

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!match || process.env[match[1]]) continue
      let value = match[2].trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
      process.env[match[1]] = value
    }
  } catch {}
}

const here = (path) => new URL(path, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
loadEnv(here('../.env.local'))
loadEnv(here('../.env'))

const apply = process.argv.includes('--apply')
const prisma = new PrismaClient()
const copied = new Map()
let found = 0
let migrated = 0
let failed = 0

function isVercelBlob(value) {
  if (typeof value !== 'string') return false
  try { return new URL(value).hostname.endsWith('.public.blob.vercel-storage.com') } catch { return false }
}

async function copyUrl(sourceUrl) {
  if (copied.has(sourceUrl)) return copied.get(sourceUrl)
  const source = new URL(sourceUrl)
  const pathname = decodeURIComponent(source.pathname.replace(/^\//, ''))
  const response = await fetch(sourceUrl)
  if (!response.ok) throw new Error(`source returned HTTP ${response.status}`)
  const result = await putBlob(
    `migrated-vercel/${source.hostname}/${pathname}`,
    Buffer.from(await response.arrayBuffer()),
    {
      addRandomSuffix: false,
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
    },
  )
  copied.set(sourceUrl, result.url)
  return result.url
}

const urlFields = [
  ['user', ['image']],
  ['opportunity', ['imageUrl', 'pdfUrl']],
  ['event', ['coverImage']],
  ['mentorshipOffering', ['image']],
  ['blogPost', ['coverImage']],
  ['successStory', ['image']],
  ['resource', ['fileUrl']],
  ['certificate', ['pdfUrl']],
  ['certificateTemplate', ['backgroundUrl', 'logoUrl', 'signatureUrl']],
]

async function migrateField(modelName, row, field) {
  const sourceUrl = row[field]
  if (!isVercelBlob(sourceUrl)) return
  found++
  console.log(`${apply ? 'copy' : 'would copy'} ${modelName}.${field} ${row.id}`)
  if (!apply) return
  try {
    const url = await copyUrl(sourceUrl)
    await prisma[modelName].update({ where: { id: row.id }, data: { [field]: url } })
    migrated++
  } catch (error) {
    failed++
    console.error(`  failed: ${error instanceof Error ? error.message : error}`)
  }
}

async function migrateAttachments() {
  const campaigns = await prisma.emailCampaign.findMany({ select: { id: true, attachments: true } })
  for (const campaign of campaigns) {
    let attachments
    try { attachments = JSON.parse(campaign.attachments ?? '[]') } catch { continue }
    const oldAttachments = Array.isArray(attachments) ? attachments.filter((item) => isVercelBlob(item?.url)) : []
    if (!oldAttachments.length) continue
    found += oldAttachments.length
    console.log(`${apply ? 'copy' : 'would copy'} emailCampaign.attachments ${campaign.id}`)
    if (!apply) continue
    try {
      const updated = await Promise.all(attachments.map(async (item) => (
        isVercelBlob(item?.url) ? { ...item, url: await copyUrl(item.url) } : item
      )))
      await prisma.emailCampaign.update({ where: { id: campaign.id }, data: { attachments: JSON.stringify(updated) } })
      migrated += oldAttachments.length
    } catch (error) {
      failed++
      console.error(`  failed: ${error instanceof Error ? error.message : error}`)
    }
  }
}

try {
  for (const [modelName, fields] of urlFields) {
    const rows = await prisma[modelName].findMany({
      select: Object.fromEntries(['id', ...fields].map((field) => [field, true])),
    })
    for (const row of rows) {
      for (const field of fields) await migrateField(modelName, row, field)
    }
  }
  await migrateAttachments()
  console.log(`\n${apply ? 'Migration' : 'Preview'} complete: found=${found}, migrated=${migrated}, failed=${failed}`)
  if (!apply && found) console.log('Run again with --apply after reviewing the list.')
  if (failed) process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
