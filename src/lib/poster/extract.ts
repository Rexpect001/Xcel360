import Anthropic from '@anthropic-ai/sdk'

// AI extraction for the poster page. Fallback chain: Claude -> Gemini -> DeepSeek.
// A provider whose API key is not set is skipped.

export type PostType = 'SCHOLARSHIP' | 'JOB' | 'INTERNSHIP'
export type ImageInput = { data: string; mediaType: string }

// ── Shared writing rules ───────────────────────────────────────────────────────
// The public page renders "### " headers, "• " bullets and **bold** (see
// RichDescription), so the prompts ask for exactly that format.

const RULES = `
WRITING RULES (apply to "description" and "eligibility"):
- Use ONLY facts stated in the source. Never invent amounts, dates, benefits, requirements or links. If a section has no facts in the source, leave that section out.
- Keep the specifics: exact amounts and currencies, durations, start dates, number of awards, age limits, grades/GPA, test scores, eligible countries, locations.
- Plain, friendly English for African students and graduates. Short bullets (one fact each, max ~25 words). No hype words ("amazing", "golden opportunity"), no emojis.
- Bold the key facts with **double asterisks** (amounts, deadlines, durations, levels, key requirements). At most one or two bold phrases per bullet.
- Use "\n" for line breaks inside the JSON string. Put a blank line between sections.
- If applications go to an email address (no URL), the How to apply section must include the bullet: '• Send your application to: **[email address]**' and applicationLink must be that email.`

const DESC_FORMAT = (sections: string) => `Markdown text built from these sections, in this order, skipping any with no facts in the source:
${sections}
Each section is a header line '### Section Name' followed by 2-6 bullets starting with '• '. Aim for 120-300 words in total, more if the source is detailed.`

const SCHOLARSHIP_PROMPT = `You are an editor for Xcel360, an opportunities site for African students. You extract scholarship details from text or images (flyers, screenshots, social posts, web pages) and write a clear, detailed listing.
Return ONLY a valid JSON object with exactly these fields:
{
  "title": "full official scholarship/programme name (add the year/intake if stated, e.g. '2027/2028')",
  "hostOrg": "hosting organisation, foundation or university",
  "country": "country of study (use 'Global' if several countries or online)",
  "fundingType": "one of: Fully funded, Partial, Tuition only, Stipend only, Other",
  "field": "one of: STEM, Non-STEM, Arts, Business, Law, Medicine, Social Sciences, Humanities, General",
  "programLevel": ["array from: Undergraduate, Masters, PhD, Postdoctoral, Professional, Any"],
  "deadline": "YYYY-MM-DD, or null if not stated",
  "eligibility": "bullets starting with '• ', one requirement each: eligible nationalities, level/degree held, grades, age, language tests, work experience, other conditions",
  "description": "${DESC_FORMAT(`### Overview  (what it is, who offers it, how many awards, programme length)
### What the scholarship covers  (tuition, stipend amount, flights, housing, insurance, other benefits)
### Eligible fields and programmes
### How to apply  (steps, portal, documents to prepare, interviews/selection stages, key dates)`)}",
  "applicationLink": "direct application URL (http/https), else the application email, else empty string",
  "requiredDocs": ["documents applicants must submit, e.g. CV, Statement of Purpose, Transcripts, Reference Letters, Research Proposal, Passport, English Test Results"],
  "fieldTags": ["3-6 subject tags, e.g. Engineering, Public Health, Law"]
}
${RULES}
Return ONLY the JSON object, with no markdown fences and no explanation.`

const JOB_PROMPT = `You are an editor for Xcel360, an opportunities site for African students and graduates. You extract job details from text or images (flyers, screenshots, social posts, web pages) and write a clear, detailed listing.
Return ONLY a valid JSON object with exactly these fields:
{
  "title": "job title as advertised",
  "company": "company or organisation name",
  "hostOrg": "same as company",
  "country": "country where the job is based (use 'Remote' if fully remote and open worldwide)",
  "remote": true if remote or hybrid, else false,
  "jobType": "one of: Full-time, Part-time, Contract, Freelance, Volunteer",
  "experienceLevel": "one of: Entry Level, Mid Level, Senior Level, Executive, Internship",
  "salary": "salary or pay range with currency and period, or empty string if not stated",
  "field": "one of: STEM, Non-STEM, Arts, Business, Law, Medicine, Social Sciences, Humanities, General",
  "skills": ["required skills, tools and technologies"],
  "deadline": "YYYY-MM-DD, or null if not stated",
  "eligibility": "bullets starting with '• ': qualifications, years of experience, certifications, location/right-to-work, other requirements",
  "description": "${DESC_FORMAT(`### About the role  (company, team, location/work mode, contract length)
### Key responsibilities
### What you need  (must-have and nice-to-have skills)
### Pay and benefits
### How to apply  (steps, documents, key dates)`)}",
  "applicationLink": "direct application URL (http/https), else the application email, else empty string",
  "requiredDocs": ["documents to submit, e.g. CV, Cover Letter, Portfolio"],
  "fieldTags": ["3-6 tags, e.g. Software, Finance, Marketing"]
}
${RULES}
Return ONLY the JSON object, with no markdown fences and no explanation.`

const INTERNSHIP_PROMPT = `You are an editor for Xcel360, an opportunities site for African students and graduates. You extract internship details from text or images (flyers, screenshots, social posts, web pages) and write a clear, detailed listing.
Return ONLY a valid JSON object with exactly these fields:
{
  "title": "internship title or programme name (add the year/cohort if stated)",
  "company": "company or organisation offering the internship",
  "hostOrg": "same as company",
  "country": "country where the internship is based (use 'Remote' if fully remote)",
  "remote": true if remote or hybrid, else false,
  "jobType": "one of: Full-time, Part-time, Paid, Unpaid, Hybrid",
  "experienceLevel": "Internship",
  "salary": "stipend or pay with currency and period, or empty string if unpaid/not stated",
  "field": "one of: STEM, Non-STEM, Arts, Business, Law, Medicine, Social Sciences, Humanities, General",
  "programLevel": ["array from: Undergraduate, Masters, PhD, Any (who can apply)"],
  "skills": ["desired skills"],
  "deadline": "YYYY-MM-DD, or null if not stated",
  "eligibility": "bullets starting with '• ': student status, year of study, course, grades, nationality/location, other requirements",
  "description": "${DESC_FORMAT(`### About the internship  (organisation, duration, start date, location/work mode)
### What you will do
### What you will gain  (stipend, mentorship, training, certificate, job offer prospects)
### How to apply  (steps, documents, key dates)`)}",
  "applicationLink": "direct application URL (http/https), else the application email, else empty string",
  "requiredDocs": ["documents to submit, e.g. CV, Cover Letter, Transcripts, Letter of Recommendation"],
  "fieldTags": ["3-6 tags, e.g. Engineering, Marketing, Research"]
}
${RULES}
Return ONLY the JSON object, with no markdown fences and no explanation.`

function getPrompt(postType: PostType) {
  if (postType === 'JOB') return JOB_PROMPT
  if (postType === 'INTERNSHIP') return INTERNSHIP_PROMPT
  return SCHOLARSHIP_PROMPT
}

function parseJSON(raw: string) {
  const clean = raw.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(clean)
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageType = typeof IMAGE_TYPES[number]
const imageType = (t: string): ImageType =>
  (IMAGE_TYPES as readonly string[]).includes(t) ? (t as ImageType) : 'image/jpeg'

async function tryAnthropic(prompt: string, text?: string, image?: ImageInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('No Anthropic key')

  const client = new Anthropic({ apiKey })
  const content: Anthropic.MessageParam['content'] = []
  if (image?.data) {
    content.push({ type: 'image', source: { type: 'base64', media_type: imageType(image.mediaType), data: image.data } })
  }
  content.push({ type: 'text', text: text?.trim() || 'Extract all details from this image.' })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    system: prompt,
    messages: [{ role: 'user', content }],
  })
  const raw = message.content.filter((b) => b.type === 'text').map((b) => (b as Anthropic.TextBlock).text).join('')
  return parseJSON(raw)
}

async function tryGemini(prompt: string, text?: string, image?: ImageInput) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('No Gemini key')

  const parts: object[] = [{ text: prompt }]
  if (image?.data) parts.push({ inlineData: { mimeType: imageType(image.mediaType), data: image.data } })
  parts.push({ text: text?.trim() || 'Extract all details from this image.' })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { maxOutputTokens: 3000, temperature: 0.1 } }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error ${res.status}`)
  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Empty Gemini response')
  return parseJSON(raw)
}

async function tryDeepSeek(prompt: string, text?: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('No DeepSeek key')
  if (!text?.trim()) throw new Error('DeepSeek is text-only')

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      max_tokens: 3000,
      temperature: 0.1,
      messages: [{ role: 'system', content: prompt }, { role: 'user', content: text.trim() }],
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('Empty DeepSeek response')
  return parseJSON(raw)
}

export async function extractOpportunity(postType: PostType, text?: string, image?: ImageInput) {
  const prompt = getPrompt(postType)
  const errors: string[] = []
  const providers: Array<[string, () => Promise<any>]> = [
    ['Claude',   () => tryAnthropic(prompt, text, image)],
    ['Gemini',   () => tryGemini(prompt, text, image)],
    ['DeepSeek', () => tryDeepSeek(prompt, text)],
  ]
  for (const [name, run] of providers) {
    try {
      const result = await run()
      console.log(`[poster] Extracted via ${name}`)
      return { ok: true as const, result: { ...result, postType } }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[poster] ${name} failed: ${msg}`)
      errors.push(`${name}: ${msg}`)
    }
  }
  return { ok: false as const, error: `All AI providers failed. ${errors.join(' | ')}` }
}
