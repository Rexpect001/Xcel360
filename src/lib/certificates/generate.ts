import { put } from '@vercel/blob'
import prisma from '@/lib/prisma'
import { nextCertificateId } from './id'
import { generateCertificatePdf, CertificateTemplateData } from './pdf'
import { sendCertificateReadyEmail } from './email'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://xcel360.com'

/** Heuristically pull institution / course-department from custom registration answers. */
export function extractInstitutionCourse(registration: {
  answers?: { answer: string; question?: { label: string } }[]
}): { institution: string | null; course: string | null } {
  let institution: string | null = null
  let course: string | null = null
  for (const a of registration.answers ?? []) {
    const label = (a.question?.label ?? '').toLowerCase()
    if (!a.answer?.trim()) continue
    if (!institution && /(institution|school|university|college|organi[sz]ation)/.test(label)) {
      institution = a.answer.trim()
    }
    if (!course && /(course|department|program|programme|field|major|study)/.test(label)) {
      course = a.answer.trim()
    }
  }
  return { institution, course }
}

/** Resolve the design template for an event, falling back to the global default. */
export async function resolveTemplate(eventId: string): Promise<CertificateTemplateData & { certificateType: string }> {
  const [forEvent, global] = await Promise.all([
    db.certificateTemplate.findFirst({ where: { eventId } }),
    db.certificateTemplate.findFirst({ where: { eventId: null } }).catch(() => null),
  ])
  const t = forEvent ?? global
  return {
    certificateType: t?.certificateType ?? 'Certificate of Participation',
    backgroundUrl: t?.backgroundUrl ?? null,
    logoUrl: t?.logoUrl ?? null,
    signatureUrl: t?.signatureUrl ?? null,
    signatureName: t?.signatureName ?? null,
    signatureTitle: t?.signatureTitle ?? null,
    bodyText: t?.bodyText ?? null,
  }
}

interface IssueResult {
  ok: boolean
  certificateId?: string
  skipped?: boolean
  error?: string
}

/**
 * Issue (or regenerate) a certificate for one registration.
 * - Reuses the existing certificate record + human ID on regenerate.
 * - Always relinks to the original registration & event.
 * - Generates the PDF, uploads to Blob, persists pdfUrl, emails the participant.
 */
export async function issueCertificate(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registration: any
  template: CertificateTemplateData & { certificateType: string }
  regenerate?: boolean
  sendEmail?: boolean
}): Promise<IssueResult> {
  const { event, registration, template, regenerate = false, sendEmail = true } = opts

  try {
    const existing = await db.certificate.findUnique({
      where: { eventId_registrationId: { eventId: event.id, registrationId: registration.id } },
    })

    if (existing && !regenerate) {
      return { ok: true, skipped: true, certificateId: existing.certificateId }
    }

    const certificateId = existing?.certificateId ?? (await nextCertificateId())
    const { institution, course } = extractInstitutionCourse(registration)
    const issueDate = new Date()
    const verifyUrl = `${APP_URL}/verify/${certificateId}`

    const pdfBytes = await generateCertificatePdf(
      {
        fullName: registration.fullName,
        eventName: event.title,
        eventDate: event.date,
        certificateId,
        issueDate,
        certificateType: template.certificateType,
        verifyUrl,
      },
      template,
    )

    // Upload PDF to Vercel Blob (public, unguessable URL)
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) return { ok: false, error: 'BLOB_READ_WRITE_TOKEN is not configured' }
    // addRandomSuffix makes the blob URL unguessable so certificate PDFs
    // can't be enumerated by incrementing the certificate ID.
    const blob = await put(`certificates/${certificateId}.pdf`, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
      token,
      addRandomSuffix: true,
    })

    const data = {
      eventId: event.id,
      registrationId: registration.id,
      fullName: registration.fullName,
      email: registration.email,
      institution,
      course,
      certificateType: template.certificateType,
      status: 'ISSUED' as const,
      pdfUrl: blob.url,
      issuedAt: issueDate,
      revokedAt: null,
    }

    const cert = existing
      ? await db.certificate.update({ where: { id: existing.id }, data: { ...data, certificateId } })
      : await db.certificate.create({ data: { ...data, certificateId } })

    if (sendEmail) {
      try {
        await sendCertificateReadyEmail({
          to: cert.email,
          fullName: cert.fullName,
          eventName: event.title,
          certificateType: cert.certificateType,
          // Proxy URL, not the raw Blob URL, so storage links aren't exposed.
          downloadUrl: `${APP_URL}/api/certificate/download/${certificateId}`,
        })
        await db.certificate.update({ where: { id: cert.id }, data: { emailSentAt: new Date() } })
      } catch (e) {
        console.error('[certificate email]', e)
        // PDF is issued regardless of email outcome
      }
    }

    return { ok: true, certificateId }
  } catch (e: any) {
    console.error('[issueCertificate]', e)
    return { ok: false, error: e?.message ?? 'Generation failed' }
  }
}
