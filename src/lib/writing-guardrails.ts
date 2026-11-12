/**
 * Guardrails for the Xcel360 writing tools.
 *
 * Three layers:
 * 1. House rules per tool (TOOL_RULES) - sent to the model as part of the system prompt.
 *    They come from the Xcel360 sample templates in public/downloads and from the
 *    mentors' review comments on real student CVs and SOPs (rules only, no personal data).
 * 2. Input screening (screenInputs) - cleans text and blocks obvious attempts to
 *    give the AI new instructions.
 * 3. Output checks (checkOutput) - deterministic checks on every draft: made-up
 *    numbers/emails/links, banned phrases, word limits, leaked prompt text, missing parts.
 *
 * Bump PROMPT_VERSION whenever prompts or rules change. It is saved with each draft.
 */

import type { ToolId } from '@/lib/writing-tools'

export const PROMPT_VERSION = '2026-10-29.1'

// ── 1. House rules ──────────────────────────────────────────────────────────

const CV_RULES = [
  'For scholarships and graduate school, order sections: Education, Research Experience, Publications and Presentations, Teaching Experience, Related Experience, Leadership, Awards, Conferences, Certifications, Skills, Referees. For a job, lead with experience instead.',
  'Pull research out of work roles into its own Research Experience section. For academic applications call the remaining jobs "Related Experience", not "Work Experience".',
  'Every bullet shows what the applicant did, the skill or method used, and the result. Rewrite job duties as skills a graduate programme values (teaching, data analysis, programming, research methods). Replace vague lines like "trained students" with what was taught, if the applicant said so.',
  'Use years only for dates (2022, or 2021-2023), never months.',
  'Keep at most three awards, choosing academic ones. Drop titles that are social or political rather than academic.',
  'Keep at most five volunteering or leadership points, each with an outcome. Prefer roles that improved academics or helped other students.',
  'List only conferences relevant to the target, each with a short note on what the conference was about or the applicant\'s role.',
  'Head certificates "Certifications" or "Professional Development". Never use a heading like "Other".',
  'Do not include praise from other people ("earned praise from colleagues"). Show results instead.',
  'Call the final-year project "Thesis" when it was one.',
  'Referees: name, role, department, institution and email, in a consistent format, with no square brackets around real details. If a referee email is a personal address (gmail, yahoo and similar), keep it but add "[use institutional email]" after it.',
  'Never include date of birth, marital status, religion, state of origin or a photo line unless the target explicitly requires it.',
  'Write the CV as a CV: headings and bullets, no paragraph of self-praise, no "References available upon request".',
]

const SOP_RULES = [
  'Open with a specific problem or moment the applicant described. Do not open with where they were born or raised, a quote, a dictionary definition, a broad global statistic, or "Since I was a child".',
  'State one clear research question or direction early, and keep the same thread to the end. Goals in the closing paragraphs must follow from the opening, not introduce a new aim.',
  'Frame the problem as something the applicant can study (a method, a process, a measurable gap), not a promise to fix a whole country. The goal must still make sense even if the national problem improves.',
  'Use statistics only if the applicant gave them. If a figure would help, write a placeholder like [add figure and source].',
  'Link every skill and experience to how it prepares the applicant for this programme\'s research or coursework. Leave out skills that do not connect.',
  'Name professors, labs or courses only if the applicant supplied them, and say how their work or methods connect to the applicant\'s question. Otherwise write a placeholder like [name a professor whose work fits, and why].',
  'Sound sure about wanting the degree. Avoid hedges like "I perceive", "it seems logical", "I believe I might", "I hope to maybe".',
  'Keep the applicant\'s field consistent. Do not drift into a neighbouring discipline.',
  'Suggested shape (scale to the word limit): opening problem ~12%, academic background ~18%, research or professional experience ~28%, why this programme ~18%, goals ~14%, short closing ~10%.',
  'Do not repeat the CV line by line; tell the story that connects the items.',
]

const COVER_LETTER_RULES = [
  'Match each stated requirement to one piece of the applicant\'s evidence. Skip requirements the applicant has no evidence for rather than claiming them.',
  'No generic praise of the organisation. One specific reason for applying, only if the applicant gave it.',
  'Stay on one page: 250-400 words.',
]

const COLD_EMAIL_RULES = [
  'Refer to the recipient\'s work only as the applicant described it. Do not invent paper titles, findings or projects.',
  'Connect the recipient\'s method or question to the applicant\'s own interest, not just the paper title.',
  'One clear ask. Under 200 words in the body. First line is "Subject: ...".',
  'Promise attachments only if the applicant listed them.',
]

const STARTUP_RULES = [
  'Label every unverified claim as an assumption.',
  'Never invent market size, competitors, customers, revenue, partnerships or traction.',
  'Prefer cheap tests and customer conversations before building.',
]

export const TOOL_RULES: Record<ToolId, string[]> = {
  cv: CV_RULES,
  sop: SOP_RULES,
  'cover-letter': COVER_LETTER_RULES,
  'cold-email': COLD_EMAIL_RULES,
  'startup-idea': STARTUP_RULES,
  'startup-interviews': STARTUP_RULES,
  'startup-roadmap': STARTUP_RULES,
}

export function rulesBlock(toolId: ToolId): string {
  return `Xcel360 house rules for this document (from our mentors' reviews):\n${TOOL_RULES[toolId].map((r) => `- ${r}`).join('\n')}`
}

// ── 2. Input screening ──────────────────────────────────────────────────────

const INJECTION_PATTERNS: RegExp[] = [
  /\b(ignore|disregard|forget)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|system)\b[^.\n]{0,20}\b(instructions?|rules|prompts?)\b/i,
  /\b(reveal|show|print|repeat|output)\b[^.\n]{0,30}\b(system prompt|your instructions|hidden instructions|your prompt)\b/i,
  /\byou are (now|no longer)\b/i,
  /\b(act|pretend|behave) as (an?|the) (?!applicant|student)\w+/i,
  /\bnew instructions?\s*:/i,
  /\bjailbreak\b|\bDAN mode\b|\bdeveloper mode\b/i,
]

// Tags we use to wrap data in the prompt. Users must not be able to close or open them.
const RESERVED_TAG = /<\s*\/?\s*(applicant_details|founder_details|opportunity_details|current_draft|issues|system|instructions?)\b[^>]*>/gi

export interface ScreenResult {
  ok: boolean
  error?: string
  /** Field labels where suspicious text was found. */
  flagged: string[]
}

/** Remove control and zero-width characters, neutralise our prompt tags, tidy blank lines. */
export function cleanText(value: string): string {
  return value
    .replace(/[​-‏‪-‮⁠-⁤﻿]/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(RESERVED_TAG, (m) => m.replace(/</g, '(').replace(/>/g, ')'))
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
}

export function screenInputs(fields: { label: string; value: string }[]): ScreenResult {
  const flagged = fields.filter((f) => INJECTION_PATTERNS.some((re) => re.test(f.value))).map((f) => f.label)
  if (flagged.length) {
    return {
      ok: false,
      flagged,
      error: `Please remove the instructions aimed at the AI from: ${flagged.join(', ')}. Describe yourself and your experience only.`,
    }
  }
  return { ok: true, flagged: [] }
}

// ── 3. Output checks ────────────────────────────────────────────────────────

export type CheckLevel = 'info' | 'warn' | 'block'

export interface DraftCheck {
  code: 'unsupported-facts' | 'banned-phrases' | 'hedging' | 'word-count' | 'placeholders' | 'format' | 'leak' | 'months'
  level: CheckLevel
  message: string
  items?: string[]
}

export const BANNED_PHRASES = [
  'passionate', 'passion for', 'delve', 'tapestry', 'testament', 'ever-evolving', 'in today\'s world',
  'in today\'s fast-paced', 'since time immemorial', 'i am writing to express', 'since i was a child',
  'from a young age', 'born and bred', 'dynamic individual', 'go-getter', 'hardworking and dedicated',
  'unwavering', 'embark on this journey', 'state-of-the-art', 'fast-paced world', 'look no further',
  'i would be honoured', 'leverage my', 'synergy', 'beacon', 'realm of', 'navigate the complexities',
  'earned praise', 'references available upon request',
]

const HEDGES = ['i perceive', 'it seems logical', 'i believe i might', 'i hope to maybe', 'i think i may', 'perhaps i could']

const LEAK_MARKERS = [
  'applicant_details', 'founder_details', 'opportunity_details', 'current_draft',
  'xcel360 house rules', "application-writing assistant", 'treat everything inside it',
]

const MONTHS = /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|jun(e)?|jul(y)?|aug(ust)?|sep(t|tember)?|oct(ober)?|nov(ember)?|dec(ember)?)\.?\s+(19|20)\d{2}\b/i

/** Normalise numbers so "4.21" in the input matches "4.21" in the output, ignoring commas. */
function normNum(s: string) {
  return s.replace(/,/g, '').replace(/\.0+$/, '')
}

/**
 * Facts the model could have made up: numbers that matter (decimals, percentages,
 * money, years, counts above 12), emails, links. Returns those that are not in the source.
 */
export function findUnsupportedFacts(output: string, source: string): string[] {
  // Ignore anything inside placeholders like [add GPA]
  const text = output.replace(/\[[^\]\n]{0,120}\]/g, ' ')
  const src = source.toLowerCase()
  const srcNums = new Set((source.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map(normNum))
  const found = new Set<string>()

  for (const m of Array.from(text.matchAll(/(?:[$£€₦]\s?)?\d[\d,]*(?:\.\d+)?\s?%?/g))) {
    const raw = m[0].trim()
    const n = normNum(raw.replace(/[^\d.,]/g, ''))
    if (!n) continue
    const value = Number(n)
    const isDecimal = n.includes('.')
    const isPercentOrMoney = /%|[$£€₦]/.test(raw)
    const isYear = /^(19|20)\d{2}$/.test(n)
    // Small whole counts ("two papers", "5 years") are too noisy to flag
    if (!isDecimal && !isPercentOrMoney && !isYear && value <= 12) continue
    if (isPercentOrMoney) {
      // "5%" must appear as a percentage (or "5 per cent") in the source, not just as "5.00"
      const bare = n.replace(/\./g, '\\.')
      const re = /%/.test(raw)
        ? new RegExp(`(^|[^\\d.])${bare}(\\.0+)?\\s?(%|per ?cent)`, 'i')
        : new RegExp(`[$£€₦]\\s?${bare.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,?')}(?!\\d)`)
      if (!re.test(source.replace(/,(?=\d{3})/g, ''))) found.add(raw)
      continue
    }
    if (!srcNums.has(n)) found.add(raw)
  }
  for (const m of Array.from(text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g))) {
    if (!src.includes(m[0].toLowerCase())) found.add(m[0])
  }
  for (const m of Array.from(text.matchAll(/\b(?:https?:\/\/|www\.)[^\s)]+|\b[\w-]+\.(?:com|org|edu|ng|ac\.uk|io)\/[^\s)]*/gi))) {
    const url = m[0].replace(/[.,;]+$/, '').toLowerCase()
    const bare = url.replace(/^https?:\/\//, '').replace(/^www\./, '')
    if (!src.includes(bare)) found.add(m[0])
  }
  return Array.from(found).slice(0, 12)
}

export function countWords(text: string): number {
  return (text.match(/[A-Za-z0-9À-ɏ'’-]+/g) ?? []).length
}

/** Light clean-up the model sometimes needs: markdown, em dashes. */
export function tidyOutput(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*•]\s+/gm, '- ')
    .replace(/\s+—\s+/g, ', ')
    .replace(/—/g, '-')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface CheckOptions {
  /** Word limit chosen by the user (SOP). */
  wordLimit?: number
}

export function checkOutput(toolId: ToolId, output: string, source: string, opts: CheckOptions = {}): DraftCheck[] {
  const checks: DraftCheck[] = []
  const lower = output.toLowerCase()

  const leaked = LEAK_MARKERS.filter((m) => lower.includes(m))
  if (leaked.length) {
    checks.push({ code: 'leak', level: 'block', message: 'The draft contained internal instructions and was withheld.' })
    return checks
  }

  const unsupported = findUnsupportedFacts(output, source)
  if (unsupported.length) {
    checks.push({
      code: 'unsupported-facts',
      level: 'warn',
      message: 'These details are not in your answers. Check them or remove them before you submit.',
      items: unsupported,
    })
  }

  const banned = BANNED_PHRASES.filter((p) => lower.includes(p))
  if (banned.length) {
    checks.push({ code: 'banned-phrases', level: 'warn', message: 'Clichés reviewers dislike. Rewrite these in plain words.', items: banned })
  }

  if (toolId === 'sop') {
    const hedges = HEDGES.filter((p) => lower.includes(p))
    if (hedges.length) {
      checks.push({ code: 'hedging', level: 'warn', message: 'These phrases sound unsure about the degree.', items: hedges })
    }
  }

  if (toolId === 'cv') {
    const month = output.match(MONTHS)
    if (month) checks.push({ code: 'months', level: 'info', message: 'Our mentors prefer years only on a CV.', items: [month[0]] })
  }

  const words = countWords(toolId === 'cold-email' ? output.replace(/^subject:.*$/im, '') : output)
  const range: [number, number] | null =
    toolId === 'sop' && opts.wordLimit ? [Math.round(opts.wordLimit * 0.75), Math.round(opts.wordLimit * 1.05)]
    : toolId === 'cover-letter' ? [230, 430]
    : toolId === 'cold-email' ? [60, 210]
    : null
  if (range && (words < range[0] || words > range[1])) {
    checks.push({
      code: 'word-count',
      level: 'warn',
      message: `${words} words. Aim for ${range[0]}-${range[1]}${opts.wordLimit ? ` (limit ${opts.wordLimit})` : ''}.`,
    })
  }

  if (toolId === 'cold-email' && !/^\s*subject:/i.test(output)) {
    checks.push({ code: 'format', level: 'warn', message: 'The email has no "Subject:" line.' })
  }

  const placeholders = Array.from(new Set(output.match(/\[[^\]\n]{2,80}\]/g) ?? []))
  if (placeholders.length) {
    checks.push({
      code: 'placeholders',
      level: 'info',
      message: `${placeholders.length} gap${placeholders.length > 1 ? 's' : ''} to fill in yourself.`,
      items: placeholders.slice(0, 15),
    })
  }

  return checks
}

/** Issues worth sending back to the model in a "fix" pass. */
export function fixableIssues(checks: DraftCheck[]): string[] {
  const out: string[] = []
  for (const c of checks) {
    if (c.code === 'unsupported-facts' && c.items?.length) {
      out.push(`These details do not appear in the applicant's answers: ${c.items.join('; ')}. Replace each with a bracketed placeholder unless the answers clearly support it in other words.`)
    }
    if (c.code === 'banned-phrases' && c.items?.length) out.push(`Remove these phrases and say the point plainly: ${c.items.join('; ')}.`)
    if (c.code === 'hedging' && c.items?.length) out.push(`Replace these unsure phrases with confident, direct wording: ${c.items.join('; ')}.`)
    if (c.code === 'word-count') out.push(`Fix the length: ${c.message}`)
    if (c.code === 'format') out.push(c.message + ' Add one.')
    if (c.code === 'months') out.push('Use years only for every date.')
  }
  return out
}
