import type { Palette } from '@/constants/theme'

const DAY = 864e5
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const utcDay = (d: Date) => Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY)

export type Urgency = 'closed' | 'urgent' | 'soon' | 'open' | 'rolling'

/**
 * Deadline label, computed in UTC exactly like the website (deadlines are calendar
 * dates), so the app and thexcel360.com always show the same number of days.
 */
export function deadlineInfo(deadline: string | null | undefined) {
  if (!deadline) return { date: 'Rolling', label: 'Rolling deadline', short: 'Open', days: null as number | null, urgency: 'rolling' as Urgency }
  const d = new Date(deadline)
  const days = utcDay(d) - utcDay(new Date())
  const date = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
  if (days < 0) return { date, label: 'Closed', short: 'Closed', days, urgency: 'closed' as Urgency }
  if (days === 0) return { date, label: 'Closes today', short: 'Today', days, urgency: 'urgent' as Urgency }
  const label = `${days} day${days === 1 ? '' : 's'} left`
  return { date, label, short: `${days} d`, days, urgency: (days <= 7 ? 'urgent' : days <= 30 ? 'soon' : 'open') as Urgency }
}

export function urgencyColors(u: Urgency, c: Palette) {
  switch (u) {
    case 'urgent': return { fg: c.bad, bg: c.badSoft }
    case 'soon': return { fg: c.warn, bg: c.warnSoft }
    case 'open': return { fg: c.ok, bg: c.okSoft }
    default: return { fg: c.muted, bg: c.bg }
  }
}

export function levels(programLevel: string[]) {
  return programLevel.join(', ') || 'Any level'
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
