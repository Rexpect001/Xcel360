/**
 * Credit pricing for the AI writing and Launchpad tools. Edit numbers here only;
 * every page, button and API reads from this file. Safe to import in the browser.
 *
 * One "use" = one new AI draft. Fixing issues on a draft and restoring versions are free.
 */

import type { ToolId } from '@/lib/writing-tools'

/** Credits every account gets once, for free. */
export const FREE_CREDITS = 100

/**
 * Credits for one new draft, by tool. Priced by how much each tool writes:
 * long documents cost more than a short email. Change the numbers here only.
 */
export const TOOL_CREDITS: Record<ToolId, number> = {
  cv: 20,
  sop: 20,
  'cover-letter': 15,
  'cold-email': 10,
  'startup-idea': 15,
  'startup-interviews': 15,
  'startup-roadmap': 15,
}

export function creditsFor(toolId: ToolId): number {
  return TOOL_CREDITS[toolId]
}

/** Cheapest draft, used to tell whether a balance can still buy anything. */
export const MIN_TOOL_CREDITS = Math.min(...Object.values(TOOL_CREDITS))

/**
 * Standard draft cost used for the Nov 2026 unit conversion of old balances
 * (1 old credit = 1 draft = 20 new credits). Not a price; see TOOL_CREDITS.
 */
export const CREDITS_PER_USE = 20

export interface CreditPack {
  id: string
  name: string
  credits: number
  /** Price in Naira. */
  priceNaira: number
  blurb: string
  featured?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'starter', name: 'Starter', credits: 200, priceNaira: 10000, blurb: 'One or two applications: CVs, SOPs, cover letters and emails, with room to redraft.' },
  { id: 'season', name: 'Application season', credits: 500, priceNaira: 20000, blurb: 'A full season of scholarships, jobs and Launchpad plans.', featured: true },
]

export function findPack(id: unknown): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null
}

/** Whole uses a balance covers. */
export function usesFor(credits: number): number {
  return Math.max(0, Math.floor(credits / CREDITS_PER_USE))
}

export function pricePerUse(pack: CreditPack): number {
  return Math.round((pack.priceNaira / pack.credits) * CREDITS_PER_USE)
}

/** Percent saved per use against the smallest pack. */
export function savingsPercent(pack: CreditPack): number {
  const base = pricePerUse(CREDIT_PACKS[0])
  return Math.round((1 - pricePerUse(pack) / base) * 100)
}

/**
 * Credits to add when an account moves from the old units (1 credit = 1 draft) to
 * the new ones: the old balance keeps its value in drafts, and the welcome grant is
 * topped up to FREE_CREDITS.
 */
export function legacyConversionDelta(oldBalance: number, legacyFreeGrant: number): number {
  return Math.max(0, oldBalance) * (CREDITS_PER_USE - 1) + Math.max(0, FREE_CREDITS - legacyFreeGrant * CREDITS_PER_USE)
}

/** Old checkouts cost about N200-300 per credit (1 credit = 1 draft); new ones cost N50 or less. */
const LEGACY_NAIRA_PER_CREDIT = 100

/**
 * Credits to add for a confirmed payment. Checkouts started before the Nov 2026
 * pricing were sold in old units, so they are converted to keep the drafts paid for.
 */
export function purchaseCredits(amountKobo: number, credits: number): number {
  if (credits <= 0) return 0
  return amountKobo / 100 / credits > LEGACY_NAIRA_PER_CREDIT ? credits * CREDITS_PER_USE : credits
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}

/** Credits each side gets when someone signs up with a referral link. */
export const REFERRAL_CREDITS = 50

/** Most referral rewards one person can earn (limits fake-account farming). */
export const REFERRAL_MAX_REWARDS = 20

/** Largest single admin grant, as a guard against typos. */
export const ADMIN_GRANT_MAX = 600
