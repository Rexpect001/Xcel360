const DAY = 864e5
const utcDay = (d: Date) => Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY)
// Fixed names rather than Intl: Node and browsers disagree on some ("Sep" vs "Sept").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const UTC_DATE = { format: (d: Date) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }

/**
 * Deadline presentation shared by every card and list row.
 * Days and the date are computed in UTC: deadlines are stored as calendar dates,
 * and UTC makes the server-rendered HTML match the browser in every time zone
 * (local time made "5 days left" vs "6 days left" hydration errors, and could
 * show 14 Dec for a 15 Dec deadline west of UTC).
 */
export function deadlineInfo(deadline: Date | string | null | undefined) {
  if (!deadline) return { date: 'Rolling', label: 'Rolling deadline', tone: 'text-ink-500', days: null as number | null, closed: false }
  const d = new Date(deadline)
  const days = utcDay(d) - utcDay(new Date())
  const date = UTC_DATE.format(d)
  if (days < 0) return { date, label: 'Closed', tone: 'text-ink-400', days, closed: true }
  if (days === 0) return { date, label: 'Closes today', tone: 'text-red-600', days, closed: false }
  if (days <= 7) return { date, label: `${days} day${days === 1 ? '' : 's'} left`, tone: 'text-red-600', days, closed: false }
  if (days <= 30) return { date, label: `${days} days left`, tone: 'text-amber-700', days, closed: false }
  return { date, label: `${days} days left`, tone: 'text-emerald-700', days, closed: false }
}

/** First meaningful line of the eligibility text, stripped of bullets/markdown. */
export function eligibilitySnippet(text: string | null | undefined, max = 140): string {
  if (!text) return ''
  const line = text
    .split('\n')
    .map((l) => l.replace(/^[\s•*\-#]+/, '').replace(/\*\*/g, '').trim())
    .find((l) => l.length > 3)
  if (!line) return ''
  return line.length > max ? line.slice(0, max).trimEnd() + '…' : line
}

/** Two-letter monogram for an organisation - used instead of random poster crops. */
export function monogram(name: string | null | undefined): string {
  const words = (name ?? '').replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !/^(of|the|and|for|de|du|la)$/i.test(w))
  if (words.length === 0) return 'X'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

export function fundingTone(funding: string | null | undefined): string {
  const f = (funding ?? '').toLowerCase()
  if (f.includes('fully')) return 'bg-emerald-50 text-emerald-700'
  if (f.includes('partial')) return 'bg-amber-50 text-amber-800'
  if (f.includes('tuition')) return 'bg-accent-50 text-brand-700'
  if (f.includes('stipend')) return 'bg-violet-50 text-violet-700'
  return 'bg-surface-100 text-ink-600'
}

const CATEGORY = {
  SCHOLARSHIP: { key: 'SCHOLARSHIP', label: 'Scholarship', chip: 'bg-brand-50 text-brand-700', href: (id: string) => `/opportunities/${id}` },
  JOB:         { key: 'JOB',         label: 'Job',         chip: 'bg-teal-50 text-teal-800', href: (id: string) => `/jobs/${id}` },
  INTERNSHIP:  { key: 'INTERNSHIP',  label: 'Internship',  chip: 'bg-violet-50 text-violet-800', href: (id: string) => `/internships/${id}` },
} as const

export function categoryMeta(category: string | null | undefined) {
  return CATEGORY[(category as keyof typeof CATEGORY) ?? 'SCHOLARSHIP'] ?? CATEGORY.SCHOLARSHIP
}

// Level labels in the data are inconsistent ("Masters", "Master's/PhD",
// "Bachelor's", "Undergraduate"...), so filters match on keyword families.
const LEVEL_KEYWORDS: Record<string, RegExp> = {
  undergrad: /undergrad|bachelor|bsc|b\.sc/i,
  masters: /master|msc|m\.sc|mba|llm/i,
  phd: /phd|doctor/i,
  postdoc: /postdoc|post-doc|fellowship|research/i,
}

function levelKey(level: string): string | null {
  const l = level.toLowerCase()
  if (l.startsWith('under') || l.startsWith('bachelor')) return 'undergrad'
  if (l.startsWith('master')) return 'masters'
  if (l.startsWith('phd') || l.startsWith('doctor')) return 'phd'
  if (l.startsWith('post') || l.startsWith('fellow')) return 'postdoc'
  return null
}

/** True if any of the opportunity's level labels belongs to the requested level family. */
export function matchesLevel(levels: string[], wanted: string): boolean {
  if (!wanted) return true
  const key = levelKey(wanted)
  if (!key) return levels.includes(wanted)
  const re = LEVEL_KEYWORDS[key]
  return levels.some((l) => re.test(l) || /^any$|all levels/i.test(l))
}
