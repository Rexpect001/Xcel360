import { PrismaClient, OpportunityStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@xcel360.com' },
    update: {},
    create: {
      email: 'admin@xcel360.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })
  console.log('✓ Admin user ready  (admin@xcel360.com / admin123)')

  // ── Opportunities ───────────────────────────────────────────────────────────
  const opportunities = [
    {
      title: 'Fulbright Foreign Student Program',
      programLevel: ['Masters', 'PhD'],
      field: 'Non-STEM',
      fieldTags: ['Social Sciences', 'Arts', 'Humanities'],
      country: 'United States',
      region: 'North America',
      hostOrg: 'U.S. Department of State',
      fundingType: 'Fully funded',
      deadline: new Date('2026-10-01'),
      eligibility: "Open to students from eligible countries. Bachelor's degree required. Strong academic record and English proficiency.",
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References', 'English Proficiency'],
      applicationLink: 'https://foreign.fulbrightonline.org',
      status: 'OPEN' as OpportunityStatus,
      featured: true,
      description: 'The Fulbright Program is the largest U.S. international exchange program, offering opportunities for students and young professionals to undertake graduate study, advanced research, university teaching, and teaching in elementary and secondary schools.',
    },
    {
      title: 'Commonwealth Scholarship',
      programLevel: ['Masters', 'PhD'],
      field: 'STEM',
      fieldTags: ['Engineering', 'Science', 'Technology'],
      country: 'United Kingdom',
      region: 'Europe',
      hostOrg: 'Commonwealth Scholarship Commission',
      fundingType: 'Fully funded',
      deadline: new Date('2026-12-15'),
      eligibility: "Citizens of Commonwealth countries. First-class degree or equivalent. Strong research proposal for PhD applicants.",
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References', 'Research Proposal'],
      applicationLink: 'https://cscuk.fcdo.gov.uk',
      status: 'OPEN' as OpportunityStatus,
      featured: true,
      description: 'Commonwealth Scholarships are offered to citizens of Commonwealth countries for postgraduate study or professional development in the UK.',
    },
    {
      title: 'DAAD Scholarship Germany',
      programLevel: ['Masters', 'PhD', 'Postdoctoral'],
      field: 'STEM',
      fieldTags: ['Engineering', 'Natural Sciences', 'Mathematics'],
      country: 'Germany',
      region: 'Europe',
      hostOrg: 'DAAD - German Academic Exchange Service',
      fundingType: 'Fully funded',
      deadline: new Date('2026-11-30'),
      eligibility: "Bachelor's degree with above-average results. Relevant work experience preferred. German or English proficiency.",
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References', 'Language Certificate'],
      applicationLink: 'https://www.daad.de/en/',
      status: 'OPEN' as OpportunityStatus,
      featured: true,
      description: 'DAAD scholarships support international students and researchers wishing to study or carry out research in Germany.',
    },
    {
      title: 'Chevening Scholarship',
      programLevel: ['Masters'],
      field: 'Non-STEM',
      fieldTags: ['Policy', 'Law', 'International Relations', 'Business'],
      country: 'United Kingdom',
      region: 'Europe',
      hostOrg: 'UK Foreign, Commonwealth & Development Office',
      fundingType: 'Fully funded',
      deadline: new Date('2026-11-05'),
      eligibility: "At least 2 years of work experience. Bachelor's degree. Must return to home country for 2 years after scholarship.",
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References'],
      applicationLink: 'https://www.chevening.org',
      status: 'OPEN' as OpportunityStatus,
      featured: true,
      description: "Chevening is the UK government's international awards programme aimed at developing global leaders.",
    },
    {
      title: 'Gates Cambridge Scholarship',
      programLevel: ['Masters', 'PhD'],
      field: 'STEM',
      fieldTags: ['All Fields'],
      country: 'United Kingdom',
      region: 'Europe',
      hostOrg: 'University of Cambridge',
      fundingType: 'Fully funded',
      deadline: new Date('2027-01-08'),
      eligibility: 'Outstanding academic achievement. Leadership qualities. Commitment to improving the lives of others.',
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References', 'Research Proposal'],
      applicationLink: 'https://www.gatescambridge.org',
      status: 'OPEN' as OpportunityStatus,
      featured: true,
      description: 'Gates Cambridge Scholarships are highly competitive full-cost scholarships for outstanding applicants from outside the UK to pursue postgraduate study at the University of Cambridge.',
    },
    {
      title: 'Erasmus Mundus Joint Master Degree',
      programLevel: ['Masters'],
      field: 'STEM',
      fieldTags: ['Various Fields'],
      country: 'Europe (Multiple)',
      region: 'Europe',
      hostOrg: 'European Commission',
      fundingType: 'Fully funded',
      deadline: new Date('2027-01-15'),
      eligibility: "Bachelor's degree in relevant field. Must study in at least 2 EU countries.",
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References', 'Language Certificate'],
      applicationLink: 'https://www.eacea.ec.europa.eu/erasmus-plus',
      status: 'OPEN' as OpportunityStatus,
      featured: false,
      description: "Erasmus Mundus Joint Master Degrees are integrated study programmes at master's level that are jointly delivered by an international consortium of higher education institutions.",
    },
    {
      title: 'Mastercard Foundation Scholars Program',
      programLevel: ['Undergraduate', 'Masters'],
      field: 'Non-STEM',
      fieldTags: ['Leadership', 'Development', 'Africa'],
      country: 'Global',
      region: 'Africa',
      hostOrg: 'Mastercard Foundation',
      fundingType: 'Fully funded',
      deadline: new Date('2026-09-30'),
      eligibility: 'Young Africans with demonstrated leadership. Academically talented students with financial need.',
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References', 'Financial Statement'],
      applicationLink: 'https://mastercardfdn.org/all/scholars/',
      status: 'OPEN' as OpportunityStatus,
      featured: true,
      description: 'The Mastercard Foundation Scholars Program provides scholarships and support to talented young people from Africa who have the potential to lead positive change on the continent.',
    },
    {
      title: 'AAUW International Fellowship',
      programLevel: ['Masters', 'PhD'],
      field: 'Non-STEM',
      fieldTags: ['Gender Studies', 'Humanities', 'Social Sciences'],
      country: 'United States',
      region: 'North America',
      hostOrg: 'American Association of University Women',
      fundingType: 'Partial',
      deadline: new Date('2026-11-01'),
      eligibility: 'Women who are not US citizens or permanent residents. Must hold a bachelor\'s degree. Planning full-time study in the US.',
      requiredDocs: ['CV', 'SOP', 'Transcripts', 'References'],
      applicationLink: 'https://www.aauw.org/resources/programs/fellowships-grants/current-opportunities/international/',
      status: 'OPEN' as OpportunityStatus,
      featured: false,
      description: 'AAUW International Fellowships are awarded for full-time study or research in the United States to women who are not US citizens or permanent residents.',
    },
  ]

  // Use skipDuplicates so re-running seed is safe
  const created = await prisma.opportunity.createMany({
    data: opportunities,
    skipDuplicates: false,
  })
  console.log(`✓ ${created.count} opportunities seeded`)

  // ── Success stories ─────────────────────────────────────────────────────────
  const stories = [
    {
      name: 'Amara Osei',
      scholarship: 'Fulbright Scholarship',
      university: 'Columbia University, USA',
      quote: 'Xcel360 helped me find and track the Fulbright scholarship step by step. The deadline tracker kept me on schedule and I got in!',
      year: 2024,
      published: true,
    },
    {
      name: 'Fatima Al-Rashid',
      scholarship: 'Gates Cambridge',
      university: 'University of Cambridge, UK',
      quote: "I found Gates Cambridge on Xcel360 and used the document checklist to make sure I had everything. Now I'm at Cambridge!",
      year: 2024,
      published: true,
    },
    {
      name: 'Chen Wei',
      scholarship: 'DAAD Scholarship',
      university: 'Technical University Munich, Germany',
      quote: 'The mentorship feature connected me with someone who had already been through the DAAD process. That guidance was invaluable.',
      year: 2023,
      published: true,
    },
    {
      name: 'Kofi Mensah',
      scholarship: 'Mastercard Foundation Scholars Program',
      university: 'University of Toronto, Canada',
      quote: 'I almost missed the Mastercard Foundation deadline. Xcel360\'s reminders literally changed my life.',
      year: 2024,
      published: true,
    },
  ]

  const storyResult = await prisma.successStory.createMany({
    data: stories,
    skipDuplicates: false,
  })
  console.log(`✓ ${storyResult.count} success stories seeded`)

  // ── Events ──────────────────────────────────────────────────────────────────
  const eventResult = await prisma.event.createMany({
    data: [
      {
        title: 'Fulbright Scholarship Info Session',
        description: 'Join us for a comprehensive overview of the Fulbright application process. Q&A with past recipients.',
        type: 'Zoom',
        date: new Date('2026-09-15T18:00:00Z'),
        link: 'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30',
        host: 'Xcel360 Team',
        published: true,
      },
      {
        title: 'SOP Writing Workshop',
        description: 'Learn how to craft a compelling Statement of Purpose that stands out to admissions committees.',
        type: 'Zoom',
        date: new Date('2026-09-22T17:00:00Z'),
        link: 'https://whatsapp.com/channel/0029Vb6QBzT2v1IyBT8SYn30',
        host: 'Xcel360 Team',
        published: true,
      },
      {
        title: 'Chevening Application Masterclass',
        description: 'Deep dive into the Chevening application requirements and how to make your essays stand out.',
        type: 'YouTube Live',
        date: new Date('2026-10-05T16:00:00Z'),
        link: 'https://www.youtube.com/@Xcel_360',
        host: 'Xcel360 Team',
        published: true,
      },
    ],
    skipDuplicates: false,
  })
  console.log(`✓ ${eventResult.count} events seeded`)

  // ── Blog posts ──────────────────────────────────────────────────────────────
  await prisma.blogPost.upsert({
    where: { slug: '10-fully-funded-scholarships-2026' },
    update: {},
    create: {
      title: '10 Fully Funded Scholarships Open Right Now',
      slug: '10-fully-funded-scholarships-2026',
      content: 'These 10 fully funded scholarships are currently accepting applications. Do not miss these opportunities...',
      excerpt: 'Discover the top fully funded scholarships with upcoming deadlines you cannot afford to miss.',
      published: true,
      author: 'Xcel360 Team',
      tags: ['scholarships', 'fully funded', 'deadlines'],
    },
  })
  await prisma.blogPost.upsert({
    where: { slug: 'how-to-write-winning-sop' },
    update: {},
    create: {
      title: 'How to Write a Winning Statement of Purpose',
      slug: 'how-to-write-winning-sop',
      content: 'A Statement of Purpose (SOP) is one of the most important documents in your scholarship application...',
      excerpt: 'Step-by-step guide to writing an SOP that gets you into your dream program.',
      published: true,
      author: 'Xcel360 Team',
      tags: ['SOP', 'writing', 'tips'],
    },
  })
  await prisma.blogPost.upsert({
    where: { slug: 'stem-vs-non-stem-scholarships' },
    update: {},
    create: {
      title: 'STEM vs Non-STEM Scholarships: What You Need to Know',
      slug: 'stem-vs-non-stem-scholarships',
      content: 'When it comes to scholarship opportunities, both STEM and non-STEM students have excellent options...',
      excerpt: 'A comprehensive comparison of scholarship opportunities for STEM and non-STEM students.',
      published: true,
      author: 'Xcel360 Team',
      tags: ['STEM', 'non-STEM', 'guide'],
    },
  })
  console.log('✓ Blog posts seeded')

  console.log('\n✅ Seed complete! Login: admin@xcel360.com / admin123')
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
