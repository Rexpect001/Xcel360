import prisma from '@/lib/prisma'
import { Quote } from 'lucide-react'

export const metadata = { title: 'Success Stories — Xcel360' }

async function getStories() {
  try {
    return await prisma.successStory.findMany({ where: { published: true } })
  } catch {
    return []
  }
}

const defaultStories = [
  {
    id: '1',
    name: 'Amara Osei',
    scholarship: 'Fulbright Scholarship',
    university: 'Columbia University, USA',
    quote: 'Xcel360 helped me find and track the Fulbright scholarship step by step. The deadline tracker kept me on schedule and I got in!',
    image: null,
    year: 2024,
    published: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Fatima Al-Rashid',
    scholarship: 'Gates Cambridge',
    university: 'University of Cambridge, UK',
    quote: "I found Gates Cambridge on Xcel360 and used the document checklist. Now I'm at Cambridge!",
    image: null,
    year: 2024,
    published: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'Chen Wei',
    scholarship: 'DAAD Scholarship',
    university: 'TU Munich, Germany',
    quote: 'The mentorship feature connected me with a DAAD alum. That guidance was invaluable.',
    image: null,
    year: 2023,
    published: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'Aisha Bello',
    scholarship: 'Commonwealth Scholarship',
    university: 'University of Edinburgh, UK',
    quote: 'I applied to 5 scholarships using Xcel360. Commonwealth was my first acceptance and it changed my life.',
    image: null,
    year: 2024,
    published: true,
    createdAt: new Date(),
  },
]

export default async function SuccessStoriesPage() {
  const dbStories = await getStories()
  const stories = dbStories.length > 0 ? dbStories : defaultStories

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Success Stories</h1>
          <p className="text-blue-200 text-lg">Real students, real scholarships, real impact.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {stories.map((story) => (
            <div key={story.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 hover:shadow-md transition-shadow">
              <Quote className="h-8 w-8 text-brand-200 mb-4" />
              <p className="text-gray-700 leading-relaxed mb-6 italic text-lg">&ldquo;{story.quote}&rdquo;</p>
              <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center text-white font-bold">
                  {story.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{story.name}</div>
                  <div className="text-sm text-brand-600 font-medium">{story.scholarship}</div>
                  <div className="text-sm text-gray-500">{story.university}</div>
                </div>
                {story.year && <span className="ml-auto text-sm text-gray-400">{story.year}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
