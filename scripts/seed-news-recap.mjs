/**
 * Upsert the "Leveraging AI in Today's World" event recap as a published
 * news post. Safe to re-run (keyed on slug).
 *   node scripts/seed-news-recap.mjs
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'
function loadEnv(file){try{for(const line of readFileSync(file,'utf8').split('\n')){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]]){let v=m[2].trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}}catch{}}
const here=(p)=>new URL(p,import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')
loadEnv(here('../.env.local')); loadEnv(here('../.env'))

const prisma = new PrismaClient()

const slug = 'leveraging-ai-in-todays-world-recap'

const content = `Xcel360 hosted "Leveraging AI in Today's World: From Learning to Opportunity" on Saturday, 27 June 2026 at 4:00 PM WAT, a free live session held on Zoom for students and early-career professionals.

The session drew 472 registrations from across Africa — mostly from Nigeria, with participants also joining from Ghana, Kenya and Zimbabwe. It focused on practical ways to apply artificial intelligence to everyday academic and professional work — from scholarship applications and research to career growth and finding global opportunities.

Certificates of Participation

Certificates of Participation have now been issued to registered participants. Each certificate carries a unique certificate ID and a QR code, so any employer, school or institution can independently verify that it is genuine.

Participants can access their certificate at thexcel360.com/certificate by entering the email address they registered with. Certificates can be viewed, downloaded or printed directly from there.

AI Poster Presentation Competition

The session runs alongside the AI Poster Presentation Competition, themed "What Can You Do With AI?". The competition invites participants to showcase an AI-powered project or innovative idea, competing for a share of a ₦300,000 prize pool.

Looking ahead

Xcel360 continues to run free webinars, workshops and mentorship programs focused on scholarships, study abroad and career development. Upcoming sessions are listed on the Events page, and announcements are shared through the Xcel360 WhatsApp channel and YouTube.

Thank you to everyone who registered, joined and shared the session — and to FUOYE iHub for partnering on this edition.`

const data = {
  title: "Leveraging AI in Today's World: 472 Register for Xcel360's Free AI Session",
  slug,
  excerpt:
    "A recap of the 27 June 2026 session on using artificial intelligence for scholarships, research and career growth — plus how to claim your Certificate of Participation.",
  content,
  coverImage:
    'https://xroogngayha6w4h2.public.blob.vercel-storage.com/fifa-worldcup-2026-6YkyYDMfhIoNTy3aPVJHD1BHBNa1wP.png',
  author: 'Xcel360',
  tags: ['Event Recap', 'Artificial Intelligence', 'Webinar'],
  published: true,
}

const post = await prisma.blogPost.upsert({ where: { slug }, update: data, create: data })
console.log('✅ News post ready:', post.slug, '| published:', post.published)
console.log('   /news/' + post.slug)
await prisma.$disconnect()
