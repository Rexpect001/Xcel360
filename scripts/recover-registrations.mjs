/**
 * Recovers event registrations, questions, and answers from the old Neon DB
 * and imports them into the current Supabase DB.
 *
 * Usage:
 *   NEON_URL="postgresql://..." node scripts/recover-registrations.mjs
 */
import { PrismaClient } from '@prisma/client'

const NEON_URL = process.env.NEON_URL
if (!NEON_URL) {
  console.error('\n❌  Set NEON_URL environment variable first:\n')
  console.error('   NEON_URL="postgresql://..." node scripts/recover-registrations.mjs\n')
  process.exit(1)
}

const neon = new PrismaClient({ datasources: { db: { url: NEON_URL } } })
const supa = new PrismaClient() // uses DATABASE_URL from .env.local

async function main() {
  console.log('\nConnecting to Neon...')
  const ndb = neon

  const [questions, registrations, answers] = await Promise.all([
    ndb.eventQuestion.findMany(),
    ndb.eventRegistration.findMany(),
    ndb.eventAnswer.findMany(),
  ])

  console.log(`Found: ${questions.length} questions, ${registrations.length} registrations, ${answers.length} answers`)

  if (!registrations.length) {
    console.log('\nNo registrations found in Neon. Nothing to recover.')
    return
  }

  console.log('\nImporting into Supabase...')
  const db = supa

  if (questions.length) {
    await db.eventQuestion.createMany({ data: questions, skipDuplicates: true })
    console.log(`✓ eventQuestions: ${questions.length}`)
  }

  if (registrations.length) {
    await db.eventRegistration.createMany({ data: registrations, skipDuplicates: true })
    console.log(`✓ eventRegistrations: ${registrations.length}`)
  }

  if (answers.length) {
    await db.eventAnswer.createMany({ data: answers, skipDuplicates: true })
    console.log(`✓ eventAnswers: ${answers.length}`)
  }

  console.log('\n✅  Recovery complete!\n')
}

main()
  .catch(e => { console.error('\n❌ Error:', e.message); process.exit(1) })
  .finally(async () => { await neon.$disconnect(); await supa.$disconnect() })
