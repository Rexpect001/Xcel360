/** Generates Resend-ready assets from the master CSV:
 *   - resend-contacts.csv  (email,first_name,last_name) for Audience import
 *   - general-broadcast-resend.html  (uses {{{FIRST_NAME}}} merge tag)
 *  Run: node scripts/gen-resend-assets.mjs */
import { readFileSync, writeFileSync } from 'node:fs'
const here = (p) => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SRC = here('../.tmp/master-registrants.csv')
const OUT_DIR = here('../../../Xcel360/events/email-reminders/')
const HTML_IN = OUT_DIR + 'general-broadcast.html'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const idx = line.lastIndexOf(',')
    if (idx === -1) continue
    let name = line.slice(0, idx).trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    const email = line.slice(idx + 1).trim().toLowerCase()
    rows.push({ name, email })
  }
  return rows
}

// First name = token after comma if "Surname, Given" form, else first token.
function splitName(name) {
  if (!name) return { first: '', last: '' }
  if (name.includes(',')) {
    const [sur, rest] = name.split(',')
    const given = (rest || '').trim().split(/\s+/)
    return { first: given[0] || '', last: sur.trim() }
  }
  const t = name.split(/\s+/)
  return { first: t[0] || '', last: t.slice(1).join(' ') }
}

function csvField(s) {
  if (s == null) return ''
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const rows = parseCsv(readFileSync(SRC, 'utf8'))
const seen = new Set()
const out = ['email,first_name,last_name']
let n = 0
for (const r of rows) {
  if (!EMAIL_RE.test(r.email) || seen.has(r.email)) continue
  seen.add(r.email)
  const { first, last } = splitName(r.name)
  out.push([csvField(r.email), csvField(first), csvField(last)].join(','))
  n++
}
writeFileSync(OUT_DIR + 'resend-contacts.csv', out.join('\n') + '\n', 'utf8')
console.log(`✅ resend-contacts.csv  -> ${n} unique contacts`)

// HTML with Resend merge tag + default fallback
const html = readFileSync(HTML_IN, 'utf8')
  .replace(/^<!--[\s\S]*?-->\s*/gm, '')
  .replace(/\[First Name\]/g, "{{{FIRST_NAME|'Scholar'}}}")
  .trim()
writeFileSync(OUT_DIR + 'general-broadcast-resend.html', html, 'utf8')
console.log('✅ general-broadcast-resend.html  (uses {{{FIRST_NAME}}})')
