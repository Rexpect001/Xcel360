export const revalidate = 3600
import type { Metadata } from 'next'
import { Users, ArrowRight, ExternalLink } from 'lucide-react'
// @ts-ignore  -  lucide ships Linkedin icon
import { Linkedin } from 'lucide-react'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import PageHero from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'Find a Mentor  -  Scholarship & Study Abroad Guidance',
  description:
    'Connect with experienced mentors who have won scholarships and studied abroad. Get personalised guidance on applications, essays, and interview preparation.',
  keywords: [
    'scholarship mentorship',
    'study abroad mentor',
    'scholarship application help',
    'SOP writing help',
    'interview preparation',
    'African scholarship mentor',
  ],
  alternates: { canonical: '/mentorship' },
  openGraph: {
    title: 'Find a Mentor  -  Xcel360',
    description: 'Connect with mentors who have won scholarships and studied abroad. Get guidance on your journey.',
    url: '/mentorship',
  },
}


async function getMentors() {
  try {
    return await prisma.mentorshipOffering.findMany({ where: { available: true }, take: 6 })
  } catch {
    return []
  }
}

const defaultMentors = [
  {
    id: '1',
    title: 'PhD Application Strategy',
    mentor: 'Dr. Sarah Johnson',
    expertise: ['PhD', 'STEM', 'US Universities'],
    available: true,
    link: null,
    image: null,
    description: 'Former Fulbright scholar now at Stanford. I help students navigate PhD applications, SOPs, and research proposals for top US universities.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'European Scholarships & Masters',
    mentor: 'Dr. Natasha Volkov',
    expertise: ['Masters', 'Europe', 'DAAD', 'Erasmus'],
    available: true,
    link: null,
    image: null,
    description: 'DAAD and Erasmus Mundus alumna from Russia, now a researcher in Germany. I guide students through European scholarship applications and academic writing.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Scholarship Coaching & Essay Review',
    mentor: 'David Okonkwo',
    expertise: ['Commonwealth', 'Chevening', 'Africa', 'Essays'],
    available: true,
    link: null,
    image: null,
    description: 'Commonwealth Scholar and academic coach. I specialize in helping African students craft compelling applications for Commonwealth, Chevening, and Gates Cambridge scholarships.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]


export default async function MentorshipPage() {
  const dbMentors = await getMentors()
  const mentors = dbMentors.length > 0 ? dbMentors : defaultMentors

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        eyebrow="Community"
        title="Mentorship"
        subtitle="Get personalized guidance from scholars and professionals who have been where you want to go."
      />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {mentor.mentor.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{mentor.mentor}</div>
                  <div className="text-xs text-green-600 font-medium">� - � Available</div>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{mentor.title}</h3>
              {mentor.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">{mentor.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {mentor.expertise.map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {(mentor as any).linkedIn && (
                  <a
                    href={(mentor as any).linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#0077b5] hover:text-[#005885] transition-colors"
                  >
                    <Linkedin className="h-4 w-4" /> Connect
                  </a>
                )}
                {mentor.link ? (
                  <a
                    href={mentor.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                  >
                    Book a session <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : !(mentor as any).linkedIn && (
                  <Link
                    href="/signup"
                    className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                  >
                    Connect <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-brand-50 border border-brand-100 rounded-2xl p-8 text-center">
          <Users className="h-10 w-10 text-brand-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Mentor</h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            Share your scholarship experience and help the next generation of scholars succeed.
          </p>
          <Link
            href="/mentor-apply"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Apply to Mentor
          </Link>
        </div>
      </div>
    </div>
  )
}
