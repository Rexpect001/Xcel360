import { readFileSync } from 'fs'
import { join } from 'path'
import { PDFDocument, StandardFonts, rgb, RGB, PDFFont, PDFImage, PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import QRCode from 'qrcode'

const FONT_DIR = join(process.cwd(), 'src', 'lib', 'certificates', 'fonts')

let _fontCache: { script: Buffer } | null = null
function loadFontBytes() {
  if (!_fontCache) {
    _fontCache = { script: readFileSync(join(FONT_DIR, 'GreatVibes-Regular.ttf')) }
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

// ── Palette (sampled from the Xcel360 reference design) ────────────────────────
const TITLE_BLUE = rgb(0.231, 0.51, 0.84)  // #3b82d6 — CERTIFICATE
const EVENT_BLUE = rgb(0.114, 0.435, 0.816) // #1d6fd0 — event line + sig name
const BORDER_BLUE = rgb(0.36, 0.56, 0.84)  // #5c8fd6 — borders
const CORNER_BLUE = rgb(0.114, 0.384, 0.78) // corner brackets
const ORANGE = rgb(0.96, 0.51, 0.12)       // #f5821f — accents / "X"
const NAVY = rgb(0.1, 0.16, 0.42)          // #1a296b — recipient name
const GRAY = rgb(0.33, 0.34, 0.38)         // body text
const MUTED = rgb(0.5, 0.53, 0.58)
const LOGO_BLUE = rgb(0.114, 0.42, 0.78)   // badge fill
const BG = rgb(0.984, 0.992, 1)            // near-white field
const DECO_BLUE = rgb(0.36, 0.56, 0.86)    // decorations (drawn low-opacity)
const BLOB_PEACH = rgb(0.99, 0.86, 0.74)
const BLOB_BLUE = rgb(0.82, 0.89, 0.98)

const PAGE_W = 842 // A4 landscape (pt)
const PAGE_H = 595

function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

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

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: RGB = GRAY) {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: (PAGE_W - w) / 2, y, size, font, color })
}

function drawCenteredFit(page: PDFPage, text: string, y: number, font: PDFFont, size: number, maxWidth: number, color: RGB = GRAY) {
  let s = size
  while (s > 10 && font.widthOfTextAtSize(text, s) > maxWidth) s -= 1
  drawCentered(page, text, y, font, s, color)
}

function drawTracked(page: PDFPage, text: string, y: number, font: PDFFont, size: number, tracking: number, maxWidth: number, color: RGB) {
  const chars = text.split('')
  const measure = (sz: number) => chars.reduce((sum, ch) => sum + font.widthOfTextAtSize(ch, sz), 0) + tracking * (chars.length - 1)
  let s = size
  while (s > 10 && measure(s) > maxWidth) s -= 1
  let x = (PAGE_W - measure(s)) / 2
  for (const ch of chars) {
    page.drawText(ch, { x, y, size: s, font, color })
    x += font.widthOfTextAtSize(ch, s) + tracking
  }
}

function drawWrappedCentered(page: PDFPage, text: string, startY: number, font: PDFFont, size: number, maxWidth: number, lineHeight: number, color: RGB = GRAY): number {
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

// ── Decorative motif helpers (drawn faint via opacity) ─────────────────────────
function drawDottedGrid(page: PDFPage, x0: number, y0: number, cols: number, rows: number, gap: number) {
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      page.drawEllipse({ x: x0 + i * gap, y: y0 - j * gap, xScale: 1.4, yScale: 1.4, color: DECO_BLUE, opacity: 0.5 })
    }
  }
}

function drawGlobe(page: PDFPage, cx: number, cy: number, r: number) {
  const o = 0.28
  page.drawEllipse({ x: cx, y: cy, xScale: r, yScale: r, borderColor: DECO_BLUE, borderWidth: 0.8, borderOpacity: o })
  for (const f of [0.32, 0.66]) page.drawEllipse({ x: cx, y: cy, xScale: r * f, yScale: r, borderColor: DECO_BLUE, borderWidth: 0.6, borderOpacity: o })
  for (const dy of [-r * 0.55, 0, r * 0.55]) {
    const half = Math.sqrt(Math.max(0, r * r - dy * dy))
    page.drawLine({ start: { x: cx - half, y: cy + dy }, end: { x: cx + half, y: cy + dy }, thickness: 0.6, color: DECO_BLUE, opacity: o })
  }
  // network nodes around + a few inside
  const nodes: [number, number][] = []
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    nodes.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  for (let k = 0; k < 6; k++) {
    const a = Math.random() * Math.PI * 2, rr = r * (0.3 + (k % 3) * 0.2)
    nodes.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr])
  }
  for (const [nx, ny] of nodes) page.drawEllipse({ x: nx, y: ny, xScale: 1.5, yScale: 1.5, color: DECO_BLUE, opacity: 0.55 })
  for (let k = 0; k < 10; k++) {
    const a = nodes[k], b = nodes[(k * 3 + 5) % nodes.length]
    page.drawLine({ start: { x: a[0], y: a[1] }, end: { x: b[0], y: b[1] }, thickness: 0.4, color: DECO_BLUE, opacity: 0.22 })
  }
}

function drawCircuit(page: PDFPage, baseX: number, baseY: number) {
  const o = 0.25
  const traces: [number, number][][] = [
    [[0, 0], [34, 0], [34, -26], [70, -26]],
    [[0, 40], [50, 40], [50, 18], [88, 18]],
    [[0, 78], [28, 78], [28, 104], [64, 104]],
    [[0, 120], [60, 120], [60, 96], [96, 96]],
    [[0, -40], [44, -40], [44, -64], [80, -64]],
  ]
  for (const t of traces) {
    for (let i = 0; i < t.length - 1; i++) {
      page.drawLine({
        start: { x: baseX + t[i][0], y: baseY + t[i][1] },
        end: { x: baseX + t[i + 1][0], y: baseY + t[i + 1][1] },
        thickness: 0.7, color: DECO_BLUE, opacity: o,
      })
    }
    const end = t[t.length - 1]
    page.drawEllipse({ x: baseX + end[0], y: baseY + end[1], xScale: 2, yScale: 2, color: DECO_BLUE, opacity: 0.4 })
  }
}

/** Dash-dot accent flanking a centered label: •—— LABEL ——• */
function drawFlankers(page: PDFPage, labelWidth: number, y: number, color: RGB) {
  const gap = labelWidth / 2 + 18
  const lineLen = 46
  for (const dir of [-1, 1]) {
    const x1 = PAGE_W / 2 + dir * gap
    const x2 = x1 + dir * lineLen
    page.drawLine({ start: { x: x1, y: y + 4 }, end: { x: x2, y: y + 4 }, thickness: 1.2, color })
    page.drawEllipse({ x: x2 + dir * 7, y: y + 4, xScale: 2, yScale: 2, color })
  }
}

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

  // Field background
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG })

  // Soft blobs (corners)
  page.drawEllipse({ x: PAGE_W - 30, y: PAGE_H - 90, xScale: 95, yScale: 70, color: BLOB_PEACH, opacity: 0.5 })
  page.drawEllipse({ x: 20, y: 70, xScale: 90, yScale: 75, color: BLOB_BLUE, opacity: 0.55 })

  // Globe (right) + circuit (left) + dotted grids
  drawGlobe(page, PAGE_W - 70, 300, 105)
  drawCircuit(page, 28, 300)
  drawDottedGrid(page, PAGE_W - 120, PAGE_H - 70, 5, 5, 9)
  drawDottedGrid(page, PAGE_W - 120, 120, 5, 5, 9)

  // Borders + corner brackets
  page.drawRectangle({ x: 14, y: 14, width: PAGE_W - 28, height: PAGE_H - 28, borderColor: BORDER_BLUE, borderWidth: 1.4 })
  page.drawRectangle({ x: 20, y: 20, width: PAGE_W - 40, height: PAGE_H - 40, borderColor: BORDER_BLUE, borderWidth: 0.6 })
  {
    const ci = 14, cl = 24, ct = 2.4
    const corner = (cx: number, cy: number, dx: number, dy: number) => {
      page.drawLine({ start: { x: cx, y: cy }, end: { x: cx + dx * cl, y: cy }, thickness: ct, color: CORNER_BLUE })
      page.drawLine({ start: { x: cx, y: cy }, end: { x: cx, y: cy + dy * cl }, thickness: ct, color: CORNER_BLUE })
    }
    corner(ci, PAGE_H - ci, 1, -1); corner(PAGE_W - ci, PAGE_H - ci, -1, -1)
    corner(ci, ci, 1, 1); corner(PAGE_W - ci, ci, -1, 1)
  }

  // ── Brand badge: skewed parallelogram with "XCEL", orange X ────────────────
  {
    const word = 'XCEL'
    const fs = 21
    const textW = sansBold.widthOfTextAtSize(word, fs)
    const padX = 26, badgeH = 36, skew = 12
    const badgeW = textW + padX * 2
    const topY = PAGE_H - 56
    const left = (PAGE_W - badgeW) / 2
    // parallelogram via SVG path (y-down from topY)
    const path = `M ${skew} 0 L ${badgeW + skew} 0 L ${badgeW} ${badgeH} L 0 ${badgeH} Z`
    page.drawSvgPath(path, { x: left, y: topY, color: LOGO_BLUE })
    const textY = topY - badgeH + (badgeH - fs) / 2 + 2
    let tx = left + padX + skew / 2
    page.drawText('X', { x: tx, y: textY, size: fs, font: sansBold, color: ORANGE })
    tx += sansBold.widthOfTextAtSize('X', fs)
    page.drawText('CEL', { x: tx, y: textY, size: fs, font: sansBold, color: rgb(1, 1, 1) })
  }

  // ── Title ──────────────────────────────────────────────────────────────────
  const parts = data.certificateType.toUpperCase().split(/\s+/)
  const titleMain = parts[0] || 'CERTIFICATE'
  const titleSub = parts.slice(1).join(' ')
  drawTracked(page, titleMain, 452, sansBold, 50, 11, PAGE_W - 150, TITLE_BLUE)
  if (titleSub) {
    drawTracked(page, titleSub, 426, sansBold, 16, 6, PAGE_W - 240, ORANGE)
    drawFlankers(page, sansBold.widthOfTextAtSize(titleSub, 16) + 6 * (titleSub.length - 1), 426, ORANGE)
  }

  // ── Recipient ──────────────────────────────────────────────────────────────
  drawCentered(page, 'This is to certify that', 400, sans, 12.5, GRAY)
  const nameY = 356
  drawCenteredFit(page, data.fullName, nameY, script, 50, PAGE_W - 260, NAVY)
  {
    let s = 50
    while (s > 12 && script.widthOfTextAtSize(data.fullName, s) > PAGE_W - 260) s -= 1
    const uw = Math.min(script.widthOfTextAtSize(data.fullName, s) + 80, 460)
    page.drawLine({ start: { x: (PAGE_W - uw) / 2, y: nameY - 12 }, end: { x: (PAGE_W + uw) / 2, y: nameY - 12 }, thickness: 1, color: NAVY })
  }

  // ── Event line + appreciation ──────────────────────────────────────────────
  drawCentered(page, 'has actively participated in', 318, sans, 12.5, GRAY)
  let afterEvent = drawWrappedCentered(page, data.eventName, 292, sansBold, 22, PAGE_W - 220, 26, EVENT_BLUE)
  // small dot-line under the event title
  page.drawEllipse({ x: PAGE_W / 2, y: afterEvent + 12, xScale: 2, yScale: 2, color: EVENT_BLUE })
  drawCentered(page, `held on ${fmtDate(data.eventDate)}`, afterEvent - 4, sans, 11.5, MUTED)
  afterEvent -= 28
  const appreciation = applyPlaceholders(
    template.bodyText?.trim() ||
      'Your engagement and commitment to continuous learning and personal growth are highly appreciated.',
    data,
  )
  drawWrappedCentered(page, appreciation, afterEvent, sans, 12.5, PAGE_W - 320, 18, GRAY)

  // ── Signature (centered, like the reference) ───────────────────────────────
  const sigCenterX = PAGE_W / 2
  const baseY = 110
  const sigImg = template.signatureUrl ? await embedRemoteImage(pdf, template.signatureUrl) : null
  if (sigImg) {
    const maxH = 42
    const w = Math.min((maxH / sigImg.height) * sigImg.width, 200)
    const h = w / (sigImg.width / sigImg.height)
    page.drawImage(sigImg, { x: sigCenterX - w / 2, y: baseY + 6, width: w, height: h })
  } else if (template.signatureName) {
    const t = template.signatureName
    const fs = 33
    const w = script.widthOfTextAtSize(t, fs)
    const sx = sigCenterX - w / 2, sy = baseY + 8
    const col = rgb(0.06, 0.07, 0.1)
    // Faux-bold: overdraw at sub-pixel offsets to thicken the thin script strokes
    for (const [dx, dy] of [[0, 0], [0.6, 0], [0, 0.6], [0.6, 0.6], [0.3, 0.3]]) {
      page.drawText(t, { x: sx + dx, y: sy + dy, size: fs, font: script, color: col })
    }
  }
  page.drawLine({ start: { x: sigCenterX - 110, y: baseY }, end: { x: sigCenterX + 110, y: baseY }, thickness: 1, color: BORDER_BLUE })
  if (template.signatureName) {
    const w = sansBold.widthOfTextAtSize(template.signatureName, 13)
    page.drawText(template.signatureName, { x: sigCenterX - w / 2, y: baseY - 16, size: 13, font: sansBold, color: EVENT_BLUE })
  }
  if (template.signatureTitle) {
    const w = sans.widthOfTextAtSize(template.signatureTitle, 10.5)
    page.drawText(template.signatureTitle, { x: sigCenterX - w / 2, y: baseY - 30, size: 10.5, font: sans, color: GRAY })
  }

  // ── Footer brand line ──────────────────────────────────────────────────────
  {
    const brand = 'Xcel360'
    const bw = sansBold.widthOfTextAtSize(brand, 14)
    page.drawText(brand, { x: (PAGE_W - bw) / 2, y: 44, size: 14, font: sansBold, color: ORANGE })
    drawFlankers(page, bw, 44, ORANGE)
    const tag = 'Empowering students beyond limits'
    const tw = sans.widthOfTextAtSize(tag, 9.5)
    page.drawText(tag, { x: (PAGE_W - tw) / 2, y: 31, size: 9.5, font: sans, color: EVENT_BLUE })
  }

  // ── QR + certificate ID (bottom-right corner) ──────────────────────────────
  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl, { margin: 0, width: 300 })
  const qrBytes = Uint8Array.from(Buffer.from(qrDataUrl.split(',')[1], 'base64'))
  const qrImg = await pdf.embedPng(qrBytes)
  const qrSize = 50
  const qrX = PAGE_W - 44 - qrSize
  const qrY = 40
  page.drawImage(qrImg, { x: qrX, y: qrY, width: qrSize, height: qrSize })
  {
    const idText = data.certificateId
    const w = sans.widthOfTextAtSize(idText, 7)
    page.drawText(idText, { x: qrX + qrSize / 2 - w / 2, y: qrY - 9, size: 7, font: sans, color: MUTED })
  }

  return await pdf.save()
}
