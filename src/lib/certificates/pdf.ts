import { readFileSync } from 'fs'
import { join } from 'path'
import { PDFDocument, StandardFonts, rgb, RGB, PDFFont, PDFImage, PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'

const FONT_DIR = join(process.cwd(), 'src', 'lib', 'certificates', 'fonts')

// Cache font bytes across invocations (read once per process).
let _fontCache: { script: Buffer } | null = null
function loadFontBytes() {
  if (!_fontCache) {
    _fontCache = {
      script: readFileSync(join(FONT_DIR, 'GreatVibes-Regular.ttf')), // script (recipient name + signature)
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

// ── Palette (from the provided CSS design) ─────────────────────────────────────
const BLUE = rgb(0.184, 0.49, 0.882)      // #2f7de1 — main border
const LIGHT_BORDER = rgb(0.498, 0.71, 1)  // #7fb5ff — inner border
const TITLE_BLUE = rgb(0.416, 0.643, 0.957) // #6aa4f4 — CERTIFICATE
const ORANGE = rgb(1, 0.42, 0)            // #ff6b00 — accents
const ORANGE2 = rgb(1, 0.478, 0)          // #ff7a00 — logo "X"
const NAVY = rgb(0, 0.122, 0.357)         // #001f5b — recipient name
const BLUE_DARK = rgb(0.071, 0.384, 0.839) // #1262d6 — corners, sig name
const LOGO_BLUE = rgb(0.04, 0.3, 0.74)    // logo badge fill
const INK = rgb(0.067, 0.067, 0.067)      // #111
const MUTED = rgb(0.44, 0.47, 0.53)
const FAINT = rgb(0.86, 0.92, 0.99)       // faint decorative blue
const BG = rgb(0.973, 0.988, 1)           // #f8fcff field

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
    const isPng = ct.includes('png') || (bytes[0] === 0x89 && bytes[1] === 0x50)
    return isPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
  } catch {
    return null
  }
}

/** Draw a string centered horizontally at the given y. */
function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: RGB = INK) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color })
}

/** Draw centered text, shrinking the size until it fits maxWidth. */
function drawCenteredFit(page: PDFPage, text: string, y: number, font: PDFFont, size: number, maxWidth: number, color: RGB = INK) {
  let s = size
  while (s > 10 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1
  drawCentered(page, text, y, font, s, color)
}

/** Draw centered text with letter-spacing (tracking), shrinking to fit maxWidth. */
function drawTracked(page: PDFPage, text: string, y: number, font: PDFFont, size: number, tracking: number, maxWidth: number, color: RGB) {
  const chars = text.split('')
  const measure = (sz: number) =>
    chars.reduce((sum, ch) => sum + font.widthOfTextAtSize(ch, sz), 0) + tracking * (chars.length - 1)
  let s = size
  while (s > 10 && measure(s) > maxWidth) s -= 1
  let x = (PAGE_W - measure(s)) / 2
  for (const ch of chars) {
    page.drawText(ch, { x, y, size: s, font, color })
    x += font.widthOfTextAtSize(ch, s) + tracking
  }
}

/** Word-wrap a paragraph and draw it centered, returning the final y position. */
function drawWrappedCentered(page: PDFPage, text: string, startY: number, font: PDFFont, size: number, maxWidth: number, lineHeight: number, color: RGB = MUTED): number {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) { lines.push(line); line = word }
    else line = test
  }
  if (line) lines.push(line)
  let y = startY
  for (const l of lines) { drawCentered(page, l, y, font, size, color); y -= lineHeight }
  return y
}

/**
 * Generate a personalized certificate PDF rendered from the Xcel360 design:
 * light-blue field, double border with corner brackets, skewed brand badge,
 * spaced "CERTIFICATE" title with orange subtitle, Great Vibes recipient name,
 * orange event accent, signature block and a QR verification code.
 */
export async function generateCertificatePdf(
  data: CertificateData,
  template: CertificateTemplateData = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage([PAGE_W, PAGE_H])

  const sans = await pdf.embedFont(StandardFonts.Helvetica)
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  let script = await pdf.embedFont(StandardFonts.TimesRomanBold)
  try { script = await pdf.embedFont(loadFontBytes().script) }
  catch (e) { console.error('[certificate fonts] script fallback:', e) }

  // ── Field background ───────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG })

  // ── Decorative motifs (faint) ──────────────────────────────────────────────
  // Globe — concentric circles bleeding off the right edge
  page.drawEllipse({ x: PAGE_W - 40, y: 360, xScale: 150, yScale: 150, borderColor: FAINT, borderWidth: 2 })
  page.drawEllipse({ x: PAGE_W - 40, y: 360, xScale: 108, yScale: 108, borderColor: FAINT, borderWidth: 1 })
  // Tech grid — faint squares on the lower left
  for (let gx = 40; gx <= 190; gx += 26) page.drawLine({ start: { x: gx, y: 150 }, end: { x: gx, y: 300 }, thickness: 0.5, color: FAINT })
  for (let gy = 150; gy <= 300; gy += 26) page.drawLine({ start: { x: 40, y: gy }, end: { x: 190, y: gy }, thickness: 0.5, color: FAINT })

  // ── Borders ────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 8, y: 8, width: PAGE_W - 16, height: PAGE_H - 16, borderColor: BLUE, borderWidth: 3 })
  page.drawRectangle({ x: 18, y: 18, width: PAGE_W - 36, height: PAGE_H - 36, borderColor: LIGHT_BORDER, borderWidth: 1.2 })

  // ── Corner brackets ────────────────────────────────────────────────────────
  const ci = 14, cl = 26, ct = 4
  const corner = (cx: number, cy: number, dx: number, dy: number) => {
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + dx * cl, y: cy }, thickness: ct, color: BLUE_DARK })
    page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + dy * cl }, thickness: ct, color: BLUE_DARK })
  }
  corner(ci, PAGE_H - ci, 1, -1)        // top-left
  corner(PAGE_W - ci, PAGE_H - ci, -1, -1) // top-right
  corner(ci, ci, 1, 1)                  // bottom-left
  corner(PAGE_W - ci, ci, -1, 1)        // bottom-right

  // ── Brand badge: XCEL360 with an orange "X" ────────────────────────────────
  {
    const word = 'XCEL360'
    const fs = 22
    const textW = sansBold.widthOfTextAtSize(word, fs)
    const padX = 34, badgeH = 38
    const badgeW = textW + padX * 2
    const badgeX = (PAGE_W - badgeW) / 2
    const badgeY = PAGE_H - 70 - badgeH
    page.drawRectangle({ x: badgeX, y: badgeY, width: badgeW, height: badgeH, color: LOGO_BLUE })
    const textY = badgeY + (badgeH - fs) / 2 + 3
    let tx = badgeX + padX
    const xW = sansBold.widthOfTextAtSize('X', fs)
    page.drawText('X', { x: tx, y: textY, size: fs, font: sansBold, color: ORANGE2 })
    tx += xW
    page.drawText('CEL360', { x: tx, y: textY, size: fs, font: sansBold, color: rgb(1, 1, 1) })
  }

  // ── Title: CERTIFICATE / OF PARTICIPATION ──────────────────────────────────
  const parts = data.certificateType.toUpperCase().split(/\s+/)
  const titleMain = parts[0] || 'CERTIFICATE'
  const titleSub = parts.slice(1).join(' ')
  drawTracked(page, titleMain, 452, sansBold, 56, 12, PAGE_W - 150, TITLE_BLUE)
  if (titleSub) drawTracked(page, titleSub, 424, sansBold, 19, 7, PAGE_W - 200, ORANGE)

  // ── Intro ──────────────────────────────────────────────────────────────────
  drawCentered(page, 'This is proudly presented to', 398, sans, 13, INK)

  // ── Recipient name (Great Vibes) ───────────────────────────────────────────
  const nameY = 350
  drawCenteredFit(page, data.fullName, nameY, script, 58, PAGE_W - 220, NAVY)
  {
    let s = 58
    while (s > 12 && script.widthOfTextAtSize(data.fullName, s) > PAGE_W - 220) s -= 1
    const uw = Math.min(script.widthOfTextAtSize(data.fullName, s) + 90, 520)
    page.drawLine({ start: { x: (PAGE_W - uw) / 2, y: nameY - 12 }, end: { x: (PAGE_W + uw) / 2, y: nameY - 12 }, thickness: 1.6, color: BLUE })
  }

  // ── Body: intro · orange event line · appreciation ─────────────────────────
  drawCentered(page, 'for active participation in', 316, sans, 13, INK)
  let afterEvent = drawWrappedCentered(page, data.eventName, 292, sansBold, 21, PAGE_W - 220, 26, ORANGE)
  drawCentered(page, `held on ${fmtDate(data.eventDate)}`, afterEvent, sans, 11, MUTED)
  afterEvent -= 26
  const appreciation = applyPlaceholders(
    template.bodyText?.trim() || 'We recognize and appreciate your commitment and contribution.',
    data,
  )
  drawWrappedCentered(page, appreciation, afterEvent, sans, 13, PAGE_W - 280, 19, INK)

  // ── Signature (left) & Date (right) — no rule clutter beyond design lines ───
  const baseY = 96
  const sigCenterX = 248
  const dateCenterX = PAGE_W - 270

  const sigImg = template.signatureUrl ? await embedRemoteImage(pdf, template.signatureUrl) : null
  if (sigImg) {
    const maxH = 44
    const w = Math.min((maxH / sigImg.height) * sigImg.width, 210)
    const h = w / (sigImg.width / sigImg.height)
    page.drawImage(sigImg, { x: sigCenterX - w / 2, y: baseY + 14, width: w, height: h })
  } else if (template.signatureName) {
    const t = template.signatureName
    const w = script.widthOfTextAtSize(t, 30)
    page.drawText(t, { x: sigCenterX - w / 2, y: baseY + 16, size: 30, font: script, color: INK })
  }
  page.drawLine({ start: { x: sigCenterX - 95, y: baseY + 8 }, end: { x: sigCenterX + 95, y: baseY + 8 }, thickness: 1.4, color: BLUE })
  if (template.signatureName) {
    const w = sansBold.widthOfTextAtSize(template.signatureName, 13)
    page.drawText(template.signatureName, { x: sigCenterX - w / 2, y: baseY - 8, size: 13, font: sansBold, color: BLUE_DARK })
  }
  if (template.signatureTitle) {
    const w = sans.widthOfTextAtSize(template.signatureTitle, 10)
    page.drawText(template.signatureTitle, { x: sigCenterX - w / 2, y: baseY - 22, size: 10, font: sans, color: MUTED })
  }

  // Date issued
  {
    const val = fmtDate(data.issueDate)
    const vw = sansBold.widthOfTextAtSize(val, 13)
    page.drawText(val, { x: dateCenterX - vw / 2, y: baseY - 8, size: 13, font: sansBold, color: INK })
    page.drawLine({ start: { x: dateCenterX - 95, y: baseY + 8 }, end: { x: dateCenterX + 95, y: baseY + 8 }, thickness: 1.4, color: BLUE })
    const label = 'Date Issued'
    const lw = sans.widthOfTextAtSize(label, 10)
    page.drawText(label, { x: dateCenterX - lw / 2, y: baseY - 22, size: 10, font: sans, color: MUTED })
  }

  // ── QR verification (bottom-right corner) ──────────────────────────────────
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 300 })
  const qrBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(',')[1], 'base64'))
  const qrImg = await pdf.embedPng(qrBytes)
  const qrSize = 58
  const qrX = PAGE_W - 46 - qrSize
  const qrY = 42
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize })
  {
    const idText = data.certificateId
    const w = sans.widthOfTextAtSize(idText, 8)
    page.drawText(idText, { x: qrX + qrSize / 2 - w / 2, y: qrY - 11, size: 8, font: sans, color: MUTED })
  }

  // ── Footer flourish (orange gradient-style rule + cert id) ─────────────────
  {
    const fy = 30
    page.drawLine({ start: { x: PAGE_W / 2 - 150, y: fy }, end: { x: PAGE_W / 2 - 40, y: fy }, thickness: 1.4, color: ORANGE })
    page.drawLine({ start: { x: PAGE_W / 2 + 40, y: fy }, end: { x: PAGE_W / 2 + 150, y: fy }, thickness: 1.4, color: ORANGE })
    const t = 'thexcel360.com'
    const w = sansBold.widthOfTextAtSize(t, 11)
    page.drawText(t, { x: (PAGE_W - w) / 2, y: fy - 4, size: 11, font: sansBold, color: BLUE_DARK })
  }

  return await pdf.save()
}
