/**
 * Bulk-upload a folder of files to Azure Blob Storage and create Resource rows.
 *
 * Usage:
 *   node scripts/upload-resources.mjs <folder> [--manifest <file.json>] [--dry-run]
 *
 * Manifest (optional) maps filename -> { title, description, category, sortOrder }.
 * Files without a manifest entry get a title from the filename and a guessed category.
 * Files whose filename already exists as a Resource are skipped, so re-running is safe.
 */
import { putBlob } from './azure-blob.mjs'
import { PrismaClient } from '@prisma/client'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const args = process.argv.slice(2)
const folder = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--manifest')
const dryRun = args.includes('--dry-run')
const manifestPath = args.includes('--manifest') ? args[args.indexOf('--manifest') + 1] : null
if (!folder) { console.error('Usage: node scripts/upload-resources.mjs <folder> [--manifest <file.json>] [--dry-run]'); process.exit(1) }

const MIME = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
}

function guessCategory(name) {
  const n = name.toLowerCase()
  if (/\bcv\b|resume/.test(n)) return 'CV Template'
  if (/\bsop\b|statement|personal-statement/.test(n)) return 'SOP Template'
  if (/cover-letter|cover letter/.test(n)) return 'Cover Letter'
  if (/proposal/.test(n)) return 'Research Proposal'
  if (/checklist/.test(n)) return 'Checklist'
  return 'Guide'
}
const titleFromName = (name) => basename(name, extname(name)).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

const manifest = manifestPath ? JSON.parse(readFileSync(manifestPath, 'utf8')) : {}
const files = readdirSync(folder).filter(f => MIME[extname(f).toLowerCase()] && statSync(join(folder, f)).isFile()).sort()
if (!files.length) { console.error('No supported files found in', folder); process.exit(1) }

const prisma = new PrismaClient()
const existing = new Set((await prisma.resource.findMany({ select: { filename: true } })).map(r => r.filename))
const maxSort = (await prisma.resource.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0

let created = 0, skipped = 0
for (const [i, file] of files.entries()) {
  if (existing.has(file)) { console.log(`skip (already exists)  ${file}`); skipped++; continue }
  const m = manifest[file] || {}
  const data = {
    title: m.title || titleFromName(file),
    description: m.description || null,
    category: m.category || guessCategory(file),
    filename: file,
    fileType: MIME[extname(file).toLowerCase()],
    fileSize: statSync(join(folder, file)).size,
    isUploaded: true,
    published: true,
    sortOrder: m.sortOrder ?? maxSort + i + 1,
  }
  if (dryRun) { console.log(`[dry-run] ${data.category.padEnd(17)} ${data.title}  <- ${file}`); continue }
  const blob = await putBlob(`resources/${Date.now()}-${file}`, readFileSync(join(folder, file)), {
    contentType: data.fileType,
  })
  await prisma.resource.create({ data: { ...data, fileUrl: blob.url } })
  console.log(`uploaded  ${data.category.padEnd(17)} ${data.title}`)
  created++
}
console.log(dryRun ? `\nDry run: ${files.length - skipped} would be uploaded, ${skipped} skipped.` : `\nDone: ${created} uploaded, ${skipped} skipped.`)
await prisma.$disconnect()
