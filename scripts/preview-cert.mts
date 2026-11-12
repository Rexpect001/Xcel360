/** Render a sample certificate PDF for design review.
 *   npx tsx scripts/preview-cert.mts [outfile]
 */
import { writeFileSync } from 'node:fs'
const { generateCertificatePdf } = await import('../src/lib/certificates/pdf.ts')

const out = process.argv[2] || 'sample-certificate.pdf'

const bytes = await generateCertificatePdf(
  {
    fullName: 'OLUWATOBI OLADIPUPO SOBANDE',
    eventName: "Leveraging AI in Today's World",
    eventDate: new Date('2026-06-27T15:00:00.000Z'),
    certificateId: 'XCL360-2026-000123',
    issueDate: new Date(),
    certificateType: 'Certificate of Participation',
    verifyUrl: 'https://thexcel360.com/verify/XCL360-2026-000123',
  },
  {
    signatureUrl: process.env.CERTIFICATE_SIGNATURE_URL ?? null,
    signatureName: 'Johnson Alabi',
    signatureTitle: 'Coordinator, Xcel360',
  },
)

writeFileSync(out, bytes)
console.log(`Wrote ${out} (${bytes.length} bytes)`)
