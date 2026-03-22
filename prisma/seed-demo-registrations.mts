import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FIRST_NAMES = [
  'Adaeze', 'Chidi', 'Fatima', 'Emeka', 'Ngozi', 'Tunde', 'Amara', 'Seun',
  'Ifeoma', 'Kunle', 'Zainab', 'Obinna', 'Chioma', 'Yemi', 'Adaora', 'Kolade',
  'Toyin', 'Nnamdi', 'Halima', 'Bayo', 'Uchenna', 'Rukayat', 'Dele', 'Sola',
  'Oluchi', 'Taiwo', 'Funke', 'Chukwuemeka', 'Aisha', 'Ifunanya',
]

const LAST_NAMES = [
  'Okafor', 'Adeleke', 'Musa', 'Eze', 'Ibrahim', 'Adeyemi', 'Okonkwo', 'Bello',
  'Nwosu', 'Adesanya', 'Usman', 'Obi', 'Abubakar', 'Dike', 'Olatunji',
  'Nwachukwu', 'Aliyu', 'Onwudiwe', 'Abdullahi', 'Salami',
]

const SCHOOLS = [
  'University of Lagos', 'Ahmadu Bello University', 'Obafemi Awolowo University',
  'University of Nigeria Nsukka', 'University of Ibadan', 'Covenant University',
  'Babcock University', 'Federal University of Technology Akure',
  'University of Benin', 'Lagos State University',
]

const DEPARTMENTS = [
  'Computer Science', 'Medicine', 'Law', 'Engineering',
  'Economics', 'Pharmacy', 'Mass Communication', 'Accounting',
  'Political Science', 'Biochemistry', 'Architecture',
]

const YEARS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Postgraduate']

const MESSAGES = [
  'I want to learn more about scholarship opportunities abroad.',
  'I am interested in furthering my education and need guidance.',
  'I hope to network with other scholarship seekers.',
  'I want to understand the application process better.',
  'I am preparing for a master\'s program and need mentorship.',
  'This will help me prepare my SOP and application documents.',
  'I want to connect with mentors who have been through this process.',
  null, null, null, // Some people skip the message
]

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function makeEmail(first: string, last: string, i: number) {
  return `${first.toLowerCase()}.${last.toLowerCase()}${i}@gmail.com`
}

function makePhone() {
  const prefix = ['0803', '0805', '0806', '0812', '0815', '0816', '0903', '0907']
  return `${rand(prefix)}${String(Math.floor(Math.random() * 9000000) + 1000000)}`
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any

  const events = await prisma.event.findMany({ where: { published: true } })

  if (events.length === 0) {
    console.log('No published events found. Publishing all events...')
    await prisma.event.updateMany({ data: { published: true } })
    const allEvents = await prisma.event.findMany()
    events.push(...allEvents)
  }

  console.log(`Seeding 20 demo registrations for ${events.length} event(s)...`)

  for (const event of events) {
    // Check existing registrations
    const existing = await db.eventRegistration.count({ where: { eventId: event.id } })
    if (existing >= 20) {
      console.log(`  ⏭  ${event.title} — already has ${existing} registrations, skipping`)
      continue
    }

    const toCreate = 20 - existing
    console.log(`  ➕ ${event.title} — creating ${toCreate} registrations`)

    // Fetch questions for this event
    const questions = await db.eventQuestion.findMany({ where: { eventId: event.id } })

    for (let i = 0; i < toCreate; i++) {
      const firstName = rand(FIRST_NAMES)
      const lastName = rand(LAST_NAMES)
      const email = makeEmail(firstName, lastName, existing + i)

      const registration = await db.eventRegistration.create({
        data: {
          eventId: event.id,
          fullName: `${firstName} ${lastName}`,
          email,
          phone: Math.random() > 0.3 ? makePhone() : null,
          createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // last 14 days
        },
      })

      // Add answers for custom questions
      for (const q of questions) {
        let answer: string | null = null
        const label = q.label.toLowerCase()

        if (label.includes('school') || label.includes('university')) {
          answer = rand(SCHOOLS)
        } else if (label.includes('department') || label.includes('course') || label.includes('field')) {
          answer = rand(DEPARTMENTS)
        } else if (label.includes('year') || label.includes('level')) {
          if (q.options?.length > 0) answer = rand(q.options)
          else answer = rand(YEARS)
        } else if (q.type === 'select' && q.options?.length > 0) {
          answer = rand(q.options)
        } else if (q.type === 'textarea') {
          answer = rand(MESSAGES.filter(Boolean)) as string
        } else {
          answer = `Sample answer for ${q.label}`
        }

        if (answer && q.required || (answer && Math.random() > 0.2)) {
          await db.eventAnswer.create({
            data: {
              registrationId: registration.id,
              questionId: q.id,
              answer,
            },
          })
        }
      }
    }
  }

  console.log('\n✅ Demo registrations seeded successfully!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
