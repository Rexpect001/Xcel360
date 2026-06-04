// Imports all data from .tmp/neon-backup/ into Supabase
// Run AFTER: 1) updating DATABASE_URL in .env.local  2) npx prisma db push
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const DIR = join(process.cwd(), '.tmp', 'neon-backup')

function load(name) {
  return JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8'))
}

async function insert(label, model, data) {
  if (!data.length) { console.log(`  skipped ${label} (empty)`); return }
  await model.createMany({ data, skipDuplicates: true })
  console.log(`✓ ${label}: ${data.length} records`)
}

async function main() {
  console.log('\nImporting into Supabase...\n')

  // Independent tables first
  await insert('users',               prisma.user,                 load('users'))
  await insert('accounts',            prisma.account,              load('accounts'))
  await insert('sessions',            prisma.session,              load('sessions'))
  await insert('verificationTokens',  prisma.verificationToken,    load('verificationTokens'))
  await insert('profiles',            prisma.profile,              load('profiles'))
  await insert('opportunities',       prisma.opportunity,          load('opportunities'))
  await insert('events',              prisma.event,                load('events'))
  await insert('mentorshipOfferings', prisma.mentorshipOffering,   load('mentorshipOfferings'))

  // Event registrations (after events exist)
  const db = prisma
  const tryLoad = (name) => { try { return load(name) } catch { return [] } }
  await insert('eventQuestions',      db.eventQuestion,            tryLoad('eventQuestions'))
  await insert('eventRegistrations',  db.eventRegistration,        tryLoad('eventRegistrations'))
  await insert('eventAnswers',        db.eventAnswer,              tryLoad('eventAnswers'))
  await insert('blogPosts',           prisma.blogPost,             load('blogPosts'))
  await insert('successStories',      prisma.successStory,         load('successStories'))
  await insert('emailSubscribers',    prisma.emailSubscriber,      load('emailSubscribers'))
  await insert('resources',           prisma.resource,             load('resources'))
  await insert('programs',            prisma.program,              load('programs'))

  // Dependent tables second
  await insert('profiles',            prisma.profile,              load('profiles'))
  await insert('savedOpportunities',  prisma.savedOpportunity,     load('savedOpportunities'))
  await insert('applications',        prisma.application,          load('applications'))
  await insert('checklistItems',      prisma.checklistItem,        load('checklistItems'))
  await insert('notifications',       prisma.notification,         load('notifications'))
  await insert('beneficiaries',       prisma.beneficiary,          load('beneficiaries'))

  console.log('\nAll data imported successfully into Supabase!\n')
}

main().catch(e => { console.error('\nImport failed:', e.message); process.exit(1) }).finally(() => prisma.$disconnect())
