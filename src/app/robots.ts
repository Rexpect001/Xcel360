import { MetadataRoute } from 'next'

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://thexcel360.com'

// Named explicitly (on top of the wildcard rule below) so there is no
// ambiguity about AI crawlers being welcome - they power citations in
// ChatGPT, Claude, Perplexity, Google AI Overviews and Bing Copilot.
const AI_CRAWLERS = [
  'GPTBot', 'ChatGPT-User', 'OAI-SearchBot',
  'ClaudeBot', 'Claude-Web', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended',
  'Bytespider', 'CCBot', 'Meta-ExternalAgent',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/', '/auth/'],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: ['/admin/', '/dashboard/', '/api/', '/auth/'],
      })),
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}
