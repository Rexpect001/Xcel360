import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'

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
  "description": "concise overview of what the scholarship covers and its purpose",
  "applicationLink": "direct application URL if found, else empty string",
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
    return NextResponse.json({ error: 'AI service not configured. Add ANTHROPIC_API_KEY to .env.local' }, { status: 503 })
  }

  // Build content array — image first (if provided), then text prompt
  const content: object[] = []

  if (image?.data) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mediaType || 'image/jpeg',
        data: image.data,
      },
    })
  }

  content.push({
    type: 'text',
    text: text?.trim() || 'Extract all scholarship details from this image.',
  })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const responseText = data.content?.[0]?.text
    if (!responseText) throw new Error('Empty response from AI')

    const extracted = JSON.parse(responseText.trim())
    return NextResponse.json(extracted)
  } catch (error) {
    console.error('AI extraction error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to extract: ${message}` }, { status: 500 })
  }
}
