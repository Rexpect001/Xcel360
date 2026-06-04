// Exports all Neon data to .tmp/neon-backup/ as JSON files
import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const OUT = join(process.cwd(), '.tmp', 'neon-backup')
mkdirSync(OUT, { recursive: true })

function save(name, data) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(data, null, 2))
  console.log(`✓ ${name}: ${data.length} records`)
}

async function main() {
  console.log('\nExporting Neon database...\n')

  save('users',               await prisma.user.findMany())
  save('accounts',            await prisma.account.findMany())
  save('sessions',            await prisma.session.findMany())
  save('verificationTokens',  await prisma.verificationToken.findMany())
  save('profiles',            await prisma.profile.findMany())
  save('opportunities',       await prisma.opportunity.findMany())
  save('savedOpportunities',  await prisma.savedOpportunity.findMany())
  save('applications',        await prisma.application.findMany())
  save('checklistItems',      await prisma.checklistItem.findMany())
  save('notifications',       await prisma.notification.findMany())
  save('events',              await prisma.event.findMany())
  save('eventRegistrations',  await (prisma).eventRegistration.findMany())
  save('eventQuestions',      await (prisma).eventQuestion.findMany())
  save('eventAnswers',        await (prisma).eventAnswer.findMany())
  save('mentorshipOfferings', await prisma.mentorshipOffering.findMany())
  save('blogPosts',           await prisma.blogPost.findMany())
  save('successStories',      await prisma.successStory.findMany())
  save('emailSubscribers',    await prisma.emailSubscriber.findMany())
  save('resources',           await prisma.resource.findMany())
  save('programs',            await prisma.program.findMany())
  save('beneficiaries',       await prisma.beneficiary.findMany())

  console.log(`\nBackup saved to .tmp/neon-backup/\n`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
