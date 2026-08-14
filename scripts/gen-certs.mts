/**
 * Generate certificates for ALL registrations of the Leveraging AI event.
 * Skips registrations that already have a certificate (resumable). Does NOT
 * email — emailing is handled separately. Writes PDFs to Vercel Blob and
 * Certificate records to the DB.
 *   npx tsx scripts/gen-certs.mts            # dry run (counts only)
 *   npx tsx scripts/gen-certs.mts --yes      # generate
 */
import { readFileSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { put } from '@vercel/blob'

function loadEnv(file: string) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) {
        let v = m[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        process.env[m[1]] = v
      }
    }
  } catch {}
}
const here = (p: string) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
loadEnv(here('../.env.local'))
loadEnv(here('../.env'))

const { generateCertificatePdf } = await import('../src/lib/certificates/pdf.ts')

const prisma = new PrismaClient()
const db = prisma as any
const EVENT_ID = 'cmobns2gx0000u9klishjmwqr'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'
const confirmed = process.argv.includes('--yes')
const regenerate = process.argv.includes('--regenerate')

async function nextCertificateId(): Promise<string> {
  const yearStr = String(new Date().getFullYear())
  const row = await db.certificateSequence.upsert({
    where: { year: yearStr },
    create: { year: yearStr, seq: 1 },
    update: { seq: { increment: 1 } },
  })
  return `XCL360-${yearStr}-${String(row.seq).padStart(6, '0')}`
}

async function main() {
  const event = await db.event.findUnique({ where: { id: EVENT_ID } })
  const tpl = await db.certificateTemplate.findFirst({ where: { eventId: EVENT_ID } })
    ?? await db.certificateTemplate.findFirst({ where: { eventId: null } }).catch(() => null)
  const template = {
    certificateType: tpl?.certificateType ?? 'Certificate of Participation',
    backgroundUrl: tpl?.backgroundUrl ?? null,
    logoUrl: tpl?.logoUrl ?? null,
    signatureUrl: tpl?.signatureUrl ?? null,
    signatureName: tpl?.signatureName ?? null,
    signatureTitle: tpl?.signatureTitle ?? null,
    bodyText: tpl?.bodyText ?? null,
  }

  const regs = await db.eventRegistration.findMany({ where: { eventId: EVENT_ID }, select: { id: true, fullName: true, email: true } })
  const existing = await db.certificate.findMany({ where: { eventId: EVENT_ID }, select: { id: true, registrationId: true, certificateId: true } })
  const exMap = new Map(existing.map((c: any) => [c.registrationId, c]))
  const todo = regenerate ? regs : regs.filter((r: any) => !exMap.has(r.id))
  console.log(`Registrations: ${regs.length} | already have cert: ${exMap.size} | ${regenerate ? 'to REGENERATE' : 'to generate'}: ${todo.length}`)
  console.log(`Template signature: ${template.signatureName ?? '(none)'} | sig image: ${template.signatureUrl ? 'yes' : 'no'}`)

  if (!confirmed) { console.log('\nDry run — pass --yes to generate.'); return }
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN not set')

  let made = 0, failed = 0
  for (const reg of todo) {
    try {
      const ex: any = exMap.get(reg.id)
      const certificateId = ex?.certificateId ?? await nextCertificateId()
      const pdfBytes = await generateCertificatePdf(
        {
          fullName: reg.fullName,
          eventName: event.title,
          eventDate: event.date,
          certificateId,
          issueDate: new Date(),
          certificateType: template.certificateType,
          verifyUrl: `${APP_URL}/verify/${certificateId}`,
        },
        template,
      )
      const blob = await put(`certificates/${certificateId}.pdf`, Buffer.from(pdfBytes), {
        access: 'public', contentType: 'application/pdf', token, addRandomSuffix: true,
      })
      if (ex) {
        await db.certificate.update({
          where: { id: ex.id },
          data: { fullName: reg.fullName, email: reg.email, pdfUrl: blob.url, status: 'ISSUED' },
        })
      } else {
        await db.certificate.create({
          data: {
            certificateId, eventId: event.id, registrationId: reg.id,
            fullName: reg.fullName, email: reg.email,
            certificateType: template.certificateType, status: 'ISSUED',
            pdfUrl: blob.url, issuedAt: new Date(),
          },
        })
      }
      made++
    } catch (e: any) {
      failed++
      console.log(`\n  fail ${reg.fullName} <${reg.email}>: ${e?.message}`)
    }
    if ((made + failed) % 20 === 0 || made + failed === todo.length) {
      process.stdout.write(`\r  progress: ${made + failed}/${todo.length} (made ${made}, failed ${failed})   `)
    }
  }
  console.log(`\n\n✅ Done. generated=${made} failed=${failed}`)
}
main().catch(e => { console.error('❌', e?.message); process.exit(1) }).finally(() => prisma.$disconnect())
