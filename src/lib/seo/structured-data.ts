import type { Opportunity } from '@prisma/client'

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

/** BreadcrumbList for a detail page: Home > section > page. Paths are site-relative. */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

const EMPLOYMENT_TYPES: [RegExp, string][] = [
  [/intern/i, 'INTERN'],
  [/part[\s-]?time/i, 'PART_TIME'],
  [/full[\s-]?time|permanent/i, 'FULL_TIME'],
  [/contract|freelance|consult/i, 'CONTRACTOR'],
  [/temp|fixed[\s-]?term|seasonal/i, 'TEMPORARY'],
  [/volunt/i, 'VOLUNTEER'],
]

/** Values in the country field that are not a real place. */
const NOT_A_PLACE = /^(worldwide|global|international|multiple|various|any|anywhere|remote|online|virtual|tbc|tba|n\/?a)\b/i

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Schema.org JobPosting for Google's job search experience.
 * Returns null when the listing is closed or past its deadline: Google asks for
 * expired postings to drop the markup rather than keep advertising them.
 */
export function jobPostingLd(job: Opportunity, path: string) {
  const expired = job.status !== 'OPEN' || (job.deadline !== null && job.deadline.getTime() < Date.now())
  if (expired) return null

  const org = job.company || job.hostOrg
  const employmentType = EMPLOYMENT_TYPES.find(([re]) => re.test(job.jobType ?? ''))?.[1]
    ?? (job.category === 'INTERNSHIP' ? 'INTERN' : undefined)
  const realPlace = Boolean(job.country) && !NOT_A_PLACE.test(job.country.trim())

  // Google wants the full description, and allows basic HTML in it.
  const description = [job.description, job.eligibility && `Requirements: ${job.eligibility}`]
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(String(block)).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`)
    .join('')

  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: description || escapeHtml(`${job.title} at ${org}`),
    datePosted: job.createdAt.toISOString(),
    ...(job.deadline && { validThrough: job.deadline.toISOString() }),
    ...(employmentType && { employmentType }),
    hiringOrganization: { '@type': 'Organization', name: org },
    identifier: { '@type': 'PropertyValue', name: org, value: job.id },
    url: `${SITE_URL}${path}`,
    // Applying happens on the employer's own site, not on Xcel360.
    directApply: false,
    ...(job.remote
      ? {
          jobLocationType: 'TELECOMMUTE',
          ...(realPlace && { applicantLocationRequirements: { '@type': 'Country', name: job.country } }),
        }
      : realPlace && {
          jobLocation: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressCountry: job.country,
              ...(job.region && { addressRegion: job.region }),
            },
          },
        }),
    ...(job.skills.length > 0 && { skills: job.skills.join(', ') }),
    ...(job.experienceLevel && { experienceRequirements: job.experienceLevel }),
    ...(job.field && { occupationalCategory: job.field }),
  }
}

/** A meta description of at most ~155 characters, cut at a word boundary. */
export function metaDescription(text: string | null | undefined, max = 155): string {
  const clean = (text ?? '').replace(/<[^>]+>/g, ' ').replace(/[#*_>`]+/g, '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return cut.slice(0, cut.lastIndexOf(' ') > max * 0.6 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:.\s-]+$/, '') + '…'
}
