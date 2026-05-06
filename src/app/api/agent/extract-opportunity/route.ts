export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are an assistant that extracts scholarship information from text or images (e.g. flyers, screenshots, social media posts).
Extract all relevant details and return ONLY a valid JSON object with exactly these fields:
{
  "title": "full scholarship/program name",
  "hostOrg": "hosting organization or university name",
  "country": "country name (use 'Global' if international/multiple countries)",
  "fundingType": "one of: Fully funded, Partial, Tuition only, Stipend only, Other",
  "field": "one of: STEM, Non-STEM, Arts, Business, Law, Medicine, Social Sciences, Humanities, General",
  "programLevel": ["array from: Undergraduate, Masters, PhD, Postdoctoral, Professional, Any"],
  "deadline": "YYYY-MM-DD format string, or null if not found",
  "eligibility": "who can apply — nationalities, GPA, degree requirements, etc.",
  "description": "IMPORTANT: Format this as bullet points. Start each point with '• '. Bold key details (funding amount, duration, benefits) using **double asterisks** around the text. Example: '• **Fully funded** — covers tuition, accommodation, and living stipend\\n• Open to students from **all African countries**\\n• Duration: **2 years**'. Keep points concise and easy to scan.",
  "applicationLink": "CRITICAL: Extract the direct application URL (starting with http/https) OR the application email address if a URL is not available. This is the most important field — look carefully for phrases like 'apply at', 'apply here', 'applications to', 'send CV to', 'email your application'. Return empty string ONLY if absolutely no link or email is mentioned.",
  "requiredDocs": ["array of required document names, e.g. CV, SOP, Transcripts, References, Research Proposal"],
  "fieldTags": ["array of relevant subject tags, e.g. Engineering, Medicine, Law"]
}
Return ONLY the JSON object with no markdown, no explanation, no code fences.`

export async function POST(req: NextRequest) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { text, image } = body as {
    text?: string
    image?: { data: string; mediaType: string }
  }

  if (!text?.trim() && !image?.data) {
    return NextResponse.json({ error: 'Provide text or an image' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not set in environment variables.' },
      { status: 503 }
    )
  }

  const client = new Anthropic({ apiKey })

  const content: Anthropic.MessageParam['content'] = []

  if (image?.data) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: (image.mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: image.data,
      },
    })
  }

  content.push({
    type: 'text',
    text: text?.trim() || 'Extract all scholarship details from this image.',
  })

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const responseText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    if (!responseText) throw new Error('Empty response from AI')

    const clean = responseText.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    const extracted = JSON.parse(clean)
    return NextResponse.json(extracted)
  } catch (error) {
    console.error('AI extraction error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Extraction failed: ${message}` }, { status: 500 })
  }
}
