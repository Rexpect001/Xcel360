import { readFileSync } from 'fs'
import { join } from 'path'
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFImage, PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'

const FONT_DIR = join(process.cwd(), 'src', 'lib', 'certificates', 'fonts')

// Cache font bytes across invocations (read once per process).
let _fontCache: { display: Buffer; script: Buffer } | null = null
function loadFontBytes() {
  if (!_fontCache) {
    _fontCache = {
      display: readFileSync(join(FONT_DIR, 'Marcellus-Regular.ttf')), // elegant serif (title + event)
      script: readFileSync(join(FONT_DIR, 'GreatVibes-Regular.ttf')), // script (recipient name)
    }
  }
  return _fontCache
}

export interface CertificateData {
  fullName: string
  eventName: string
  eventDate: Date | string
  certificateId: string
  issueDate: Date | string
  certificateType: string
  verifyUrl: string
}

export interface CertificateTemplateData {
  backgroundUrl?: string | null
  logoUrl?: string | null
  signatureUrl?: string | null
  signatureName?: string | null
  signatureTitle?: string | null
  bodyText?: string | null
}

const NAVY = rgb(0.043, 0.137, 0.298) // #0b234c — deep brand navy for the title
const BRAND = rgb(0.012, 0.27, 0.51) // #033f82
const BRAND_LIGHT = rgb(0.011, 0.52, 0.78) // #0284c7
const GOLD = rgb(0.72, 0.55, 0.13) // #b88c21 — flourish accent
const BLACK = rgb(0.07, 0.09, 0.13) // near-black for name + event line
const INK = rgb(0.1, 0.12, 0.16)
const MUTED = rgb(0.44, 0.47, 0.53)

const PAGE_W = 842 // A4 landscape (pt)
const PAGE_H = 595

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Apply {{PLACEHOLDER}} substitutions used in custom body text. */
export function applyPlaceholders(template: string, data: CertificateData): string {
  return template
    .replace(/\{\{\s*FULL_NAME\s*\}\}/g, data.fullName)
    .replace(/\{\{\s*EVENT_NAME\s*\}\}/g, data.eventName)
    .replace(/\{\{\s*EVENT_DATE\s*\}\}/g, fmtDate(data.eventDate))
    .replace(/\{\{\s*CERTIFICATE_ID\s*\}\}/g, data.certificateId)
    .replace(/\{\{\s*ISSUE_DATE\s*\}\}/g, fmtDate(data.issueDate))
}

async function embedRemoteImage(pdf: PDFDocument, url: string): Promise<PDFImage | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    const ct = res.headers.get('content-type') ?? ''
    // Detect by content-type, falling back to PNG magic bytes (0x89 0x50)
    const isPng = ct.includes('png') || (bytes[0] === 0x89 && bytes[1] === 0x50)
    return isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
  } catch {
    return null
  }
}

/** Draw a string centered horizontally at the given y. */
function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = INK,
) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color })
}

/** Draw centered text, shrinking the size until it fits maxWidth. */
function drawCenteredFit(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  color = INK,
) {
  let s = size
  while (s > 12 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1
  drawCentered(page, text, y, font, s, color)
}

/** Word-wrap a paragraph and draw it centered, returning the final y position. */
function drawWrappedCentered(
  page: PDFPage,
  text: string,
  startY: number,
  font: PDFFont,
  size: number,
  maxWidth: number,
  lineHeight: number,
  color = MUTED,
): number {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)

  let y = startY
  for (const l of lines) {
    drawCentered(page, l, y, font, size, color)
    y -= lineHeight
  }
  return y
}

/**
 * Generate a personalized certificate PDF.
 * If a background image is supplied it is drawn full-page and content is
 * overlaid on top; otherwise a clean default certificate is rendered.
 */
export async function generateCertificatePdf(
  data: CertificateData,
  template: CertificateTemplateData = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage([PAGE_W, PAGE_H])

  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const timesItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const timesBold = await pdf.embedFont(StandardFonts.TimesRomanBold)

  // Custom display + script fonts (fall back to standard fonts if unreadable)
  let display = helvBold // elegant serif — title & event name
  let script = timesBold // flowing script — recipient name
  try {
    const { display: dBytes, script: sBytes } = loadFontBytes()
    display = await pdf.embedFont(dBytes)
    script = await pdf.embedFont(sBytes)
  } catch (e) {
    console.error('[certificate fonts] falling back to standard fonts:', e)
  }

  // ── Background ─────────────────────────────────────────────────────────────
  const bg = template.backgroundUrl ? await embedRemoteImage(pdf, template.backgroundUrl) : null
  if (bg) {
    page.drawImage(bg, { x: 0, y: 0, width: PAGE_W, height: PAGE_H })
  } else {
    // Default design: white field + double border + corner accents
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(1, 1, 1) })
    page.drawRectangle({
      x: 24, y: 24, width: PAGE_W - 48, height: PAGE_H - 48,
      borderColor: BRAND, borderWidth: 2.5,
    })
    page.drawRectangle({
      x: 32, y: 32, width: PAGE_W - 64, height: PAGE_H - 64,
      borderColor: GOLD, borderWidth: 0.8,
    })
    // Top accent band
    page.drawRectangle({ x: 32, y: PAGE_H - 32 - 6, width: PAGE_W - 64, height: 6, color: BRAND_LIGHT })
  }

  // ── Inner border frame ─────────────────────────────────────────────────────
  // A bold navy outline with a fine gold inner rule — frames the content and
  // sits cleanly inside any background template.
  {
    const m = 30 // outer inset
    page.drawRectangle({
      x: m, y: m, width: PAGE_W - 2 * m, height: PAGE_H - 2 * m,
      borderColor: NAVY, borderWidth: 3,
    })
    const g = 38 // inner gold line inset
    page.drawRectangle({
      x: g, y: g, width: PAGE_W - 2 * g, height: PAGE_H - 2 * g,
      borderColor: GOLD, borderWidth: 1,
    })
  }

  // ── Logo ───────────────────────────────────────────────────────────────────
  // Only render a logo on the bare default design. When a background template
  // is supplied it already carries the brand mark, so we avoid duplicating it.
  if (!bg) {
    const logo = template.logoUrl ? await embedRemoteImage(pdf, template.logoUrl) : null
    if (logo) {
      const maxH = 50
      const scale = maxH / logo.height
      const w = logo.width * scale
      page.drawImage(logo, { x: (PAGE_W - w) / 2, y: PAGE_H - 64 - maxH, width: w, height: maxH })
    } else {
      drawCentered(page, 'XCEL360', PAGE_H - 78, helvBold, 18, BRAND)
    }
  }

  // ── Title ──────────────────────────────────────────────────────────────────
  // Vertically balanced block: title high, recipient mid, body below.
  drawCenteredFit(page, data.certificateType.toUpperCase(), 410, display, 34, PAGE_W - 130, NAVY)
  drawCentered(page, 'This is proudly presented to', 380, helv, 12, MUTED)

  // ── Recipient name (stylish script) ───────────────────────────────────────
  const nameY = 326
  const nameSize = 58
  drawCenteredFit(page, data.fullName, nameY, script, nameSize, PAGE_W - 220, BLACK)
  // Gold flourish beneath the name (kept — it reads as the "jewelry" accent)
  {
    let s = nameSize
    while (s > 12 && script.widthOfTextAtSize(data.fullName, s) > PAGE_W - 220) s -= 1
    const w = Math.min(script.widthOfTextAtSize(data.fullName, s) + 80, PAGE_W - 200)
    page.drawLine({
      start: { x: (PAGE_W - w) / 2, y: nameY - 12 }, end: { x: (PAGE_W + w) / 2, y: nameY - 12 },
      thickness: 1.2, color: GOLD,
    })
  }

  // ── Body: intro · bold event line · recognition ──────────────────────────
  drawCentered(page, 'for active participation in', 292, timesItalic, 13, MUTED)
  // Event name on its own line — elegant serif, prominent (wraps if long)
  let afterEvent = drawWrappedCentered(page, data.eventName, 268, display, 22, PAGE_W - 200, 26, BLACK)
  // Subtle "held on …" beneath the event line
  drawCentered(page, `held on ${fmtDate(data.eventDate)}`, afterEvent, helv, 11, MUTED)
  afterEvent -= 26
  const recognition = applyPlaceholders(
    template.bodyText?.trim() || 'We recognize and appreciate your commitment and contribution.',
    data,
  )
  drawWrappedCentered(page, recognition, afterEvent, timesItalic, 13, PAGE_W - 260, 20, MUTED)

  // ── Signature & Date (footer, no rule lines) ───────────────────────────────
  const baseY = 96 // baseline for the name / date value
  const sigCenterX = 235
  const dateCenterX = PAGE_W - 235

  // Signature image sits just above the bold name — no underline.
  const sig = template.signatureUrl ? await embedRemoteImage(pdf, template.signatureUrl) : null
  if (sig) {
    const maxH = 46
    const scale = maxH / sig.height
    const w = Math.min(sig.width * scale, 220)
    const h = w / (sig.width / sig.height)
    page.drawImage(sig, { x: sigCenterX - w / 2, y: baseY + 8, width: w, height: h })
  }
  if (template.signatureName) {
    const t = template.signatureName
    const w = helvBold.widthOfTextAtSize(t, 12)
    page.drawText(t, { x: sigCenterX - w / 2, y: baseY, size: 12, font: helvBold, color: BLACK })
  }
  if (template.signatureTitle) {
    const t = template.signatureTitle
    const w = helv.widthOfTextAtSize(t, 9.5)
    page.drawText(t, { x: sigCenterX - w / 2, y: baseY - 13, size: 9.5, font: helv, color: MUTED })
  }

  // Date issued — bold value, label beneath, no rule line.
  {
    const val = fmtDate(data.issueDate)
    const vw = helvBold.widthOfTextAtSize(val, 12)
    page.drawText(val, { x: dateCenterX - vw / 2, y: baseY, size: 12, font: helvBold, color: BLACK })
    const label = 'Date Issued'
    const lw = helv.widthOfTextAtSize(label, 9.5)
    page.drawText(label, { x: dateCenterX - lw / 2, y: baseY - 13, size: 9.5, font: helv, color: MUTED })
  }

  // QR + certificate ID (bottom-right corner)
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 300 })
  const qrBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(',')[1], 'base64'))
  const qrImg = await pdf.embedPng(qrBytes)
  const qrSize = 62
  const qrX = PAGE_W - 84 - qrSize
  const qrY = 74
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize })
  {
    const idText = data.certificateId
    const w = helv.widthOfTextAtSize(idText, 8)
    page.drawText(idText, { x: qrX + qrSize / 2 - w / 2, y: qrY - 12, size: 8, font: helv, color: MUTED })
    const scan = 'Scan to verify'
    const sw = helv.widthOfTextAtSize(scan, 7)
    page.drawText(scan, { x: qrX + qrSize / 2 - sw / 2, y: qrY - 22, size: 7, font: helv, color: MUTED })
  }

  return await pdf.save()
}
