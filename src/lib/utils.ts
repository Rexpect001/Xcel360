import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function formatRelativeDate(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function daysUntilDeadline(deadline: Date | string | null | undefined): number {
  if (!deadline) return 999
  return differenceInDays(new Date(deadline), new Date())
}

export function getDeadlineUrgency(daysLeft: number): 'critical' | 'urgent' | 'moderate' | 'safe' {
  if (daysLeft <= 2) return 'critical'
  if (daysLeft <= 7) return 'urgent'
  if (daysLeft <= 30) return 'moderate'
  return 'safe'
}

export function getDeadlineColor(daysLeft: number): string {
  const urgency = getDeadlineUrgency(daysLeft)
  switch (urgency) {
    case 'critical': return 'text-red-600 bg-red-50'
    case 'urgent': return 'text-orange-600 bg-orange-50'
    case 'moderate': return 'text-yellow-600 bg-yellow-50'
    default: return 'text-green-600 bg-green-50'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getFundingBadgeColor(fundingType: string): string {
  switch (fundingType) {
    case 'Fully funded': return 'bg-green-100 text-green-700'
    case 'Partial': return 'bg-blue-100 text-blue-700'
    case 'Stipend': return 'bg-purple-100 text-purple-700'
    case 'Tuition waiver': return 'bg-orange-100 text-orange-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
