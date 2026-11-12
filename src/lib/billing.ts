/**
 * Credit packs for the AI writing and Launchpad tools.
 * Edit prices here. One credit = one new draft. Fixing issues on a draft and
 * restoring versions are free. Safe to import in the browser.
 */

export const FREE_CREDITS = 3

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
  { id: 'starter', name: 'Starter', credits: 10, priceNaira: 3000, blurb: 'One application: CV, SOP and a few emails.' },
  { id: 'standard', name: 'Standard', credits: 30, priceNaira: 7500, blurb: 'Several applications with room to redraft.', featured: true },
  { id: 'season', name: 'Application season', credits: 80, priceNaira: 16000, blurb: 'A full season of scholarships and jobs.' },
]

export function findPack(id: unknown): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`
}
