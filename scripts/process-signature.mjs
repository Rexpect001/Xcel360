/**
 * Clean a signature photo for certificate use:
 *  - makes the (near-white) background transparent via luminance->alpha
 *  - crops to the ink bounding box with small padding
 *   node scripts/process-signature.mjs <input.png> <output.png>
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const src = process.argv[2]
const out = process.argv[3] || 'signature-clean.png'
if (!src) { console.error('Usage: node scripts/process-signature.mjs <input.png> <output.png>'); process.exit(1) }

const png = PNG.sync.read(readFileSync(src))
const { width: W, height: H, data } = png

// The image already has a transparent background (alpha=0) with opaque ink.
// Crop to the alpha bounding box; recolor visible ink to a consistent navy.
const NAVY = [26, 41, 107] // #1a296b, matches the certificate name color
let minX = W, minY = H, maxX = 0, maxY = 0
for (let i = 0; i < data.length; i += 4) {
  const a = data[i + 3]
  if (a > 40) {
    data[i] = NAVY[0]; data[i + 1] = NAVY[1]; data[i + 2] = NAVY[2]
    const px = (i / 4) % W, py = Math.floor((i / 4) / W)
    if (px < minX) minX = px; if (px > maxX) maxX = px
    if (py < minY) minY = py; if (py > maxY) maxY = py
  }
}

if (maxX < minX) { console.error('No ink detected - check thresholds'); process.exit(1) }
const pad = 16
minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad)
maxX = Math.min(W - 1, maxX + pad); maxY = Math.min(H - 1, maxY + pad)
const cw = maxX - minX + 1, ch = maxY - minY + 1

const cropped = new PNG({ width: cw, height: ch })
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const si = ((minY + y) * W + (minX + x)) * 4
    const di = (y * cw + x) * 4
    cropped.data[di] = data[si]
    cropped.data[di + 1] = data[si + 1]
    cropped.data[di + 2] = data[si + 2]
    cropped.data[di + 3] = data[si + 3]
  }
}
writeFileSync(out, PNG.sync.write(cropped))
console.log(`Cropped ${W}x${H} -> ${cw}x${ch}, wrote ${out}`)
