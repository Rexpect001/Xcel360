/** Switches a draft campaign's provider to SendChamp. Run: node scripts/switch-draft-sendchamp.mjs <campaignId> */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'node:fs'

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) {
        let v = m[2].trim()
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        process.env[m[1]] = v
      }
    }
  } catch {}
}
loadEnv(new URL('../.env.local', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
loadEnv(new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))

const id = process.argv[2] || 'cmqvivb970000apbzjsai6bmi'
const prisma = new PrismaClient()

async function main() {
  const before = await prisma.emailCampaign.findUnique({ where: { id } })
  if (!before) { console.error(`❌ Campaign ${id} not found`); process.exit(1) }
  if (before.status !== 'DRAFT') { console.error(`❌ Campaign is ${before.status}, not DRAFT — aborting`); process.exit(1) }
  if (!before.textBody?.trim()) { console.error('❌ No textBody — SendChamp needs plain text. Aborting'); process.exit(1) }

  const c = await prisma.emailCampaign.update({
    where: { id },
    data: { provider: 'sendchamp', dailyLimit: 5000 },
  })
  console.log(`✅ Switched to SendChamp.`)
  console.log(`   id:        ${c.id}`)
  console.log(`   provider:  ${c.provider}`)
  console.log(`   recipients:${c.totalCount}`)
  console.log(`   textBody:  ${c.textBody.length} chars present`)
  console.log(`\nReview & send at Admin → Email (DRAFT). Do a Test Send first.\n`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
