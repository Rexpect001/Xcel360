export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Calendar, Tag, Download, FileText, ArrowRight, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Free Resources — Templates, Guides & SOP Samples',
  description:
    'Download free scholarship application templates, statement of purpose samples, CV guides, and interview preparation resources for students applying abroad.',
  keywords: [
    'scholarship application template',
    'statement of purpose sample',
    'SOP template',
    'scholarship CV template',
    'study abroad guide',
    'free student resources',
  ],
  alternates: { canonical: '/resources' },
  openGraph: {
    title: 'Free Resources — Xcel360',
    description: 'Download free templates, SOP samples, and guides to strengthen your scholarship applications.',
    url: '/resources',
  },
}



async function getPosts() {
  try {
    return await prisma.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } })
  } catch {
    return []
  }
}

async function getResources() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (prisma as any).resource.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  } catch {
    return []
  }
}

const defaultPosts = [
  {
    id: '1',
    title: '10 Fully Funded Scholarships Closing This Year',
    slug: '10-fully-funded-scholarships-2025',
    excerpt: 'Discover the top fully funded scholarships with upcoming deadlines you cannot afford to miss.',
    author: 'Xcel360 Team',
    tags: ['scholarships', 'fully funded'],
    createdAt: new Date(),
    updatedAt: new Date(),
    content: '',
    published: true,
    coverImage: null,
  },
  {
    id: '2',
    title: 'How to Write a Winning Statement of Purpose',
    slug: 'how-to-write-winning-sop',
    excerpt: 'Step-by-step guide to writing an SOP that gets you into your dream program.',
    author: 'Dr. Sarah Johnson',
    tags: ['SOP', 'writing'],
    createdAt: new Date(),
    updatedAt: new Date(),
    content: '',
    published: true,
    coverImage: null,
  },
  {
    id: '3',
    title: 'STEM vs Non-STEM Scholarships: What You Need to Know',
    slug: 'stem-vs-non-stem-scholarships',
    excerpt: 'A comprehensive comparison of scholarship opportunities for STEM and non-STEM students.',
    author: 'Xcel360 Team',
    tags: ['STEM', 'non-STEM'],
    createdAt: new Date(),
    updatedAt: new Date(),
    content: '',
    published: true,
    coverImage: null,
  },
  {
    id: '4',
    title: 'The King Fahd University Scholarship Guide',
    slug: 'king-fahd-scholarship-guide',
    excerpt: 'Everything you need to know about applying to King Fahd University of Petroleum & Minerals scholarships.',
    author: 'Xcel360 Team',
    tags: ['King Fahd', 'Saudi Arabia', 'STEM'],
    createdAt: new Date(),
    updatedAt: new Date(),
    content: '',
    published: true,
    coverImage: null,
  },
]

const downloadTemplates = [
  {
    id: 'cv-general',
    title: 'Sample CV — General',
    description: 'A clean, professional CV template for non-STEM applications. Covers education, experience, publications, and awards.',
    category: 'CV Template',
    categoryColor: 'bg-blue-50 text-blue-700',
    file: '/downloads/sample-cv-general.txt',
    filename: 'Xcel360-Sample-CV-General.txt',
  },
  {
    id: 'cv-stem',
    title: 'Sample CV — STEM',
    description: 'A research-focused CV template tailored for STEM applicants. Includes sections for publications, technical skills, and research experience.',
    category: 'CV Template',
    categoryColor: 'bg-blue-50 text-blue-700',
    file: '/downloads/sample-cv-stem.txt',
    filename: 'Xcel360-Sample-CV-STEM.txt',
  },
  {
    id: 'sop-general',
    title: 'Sample SOP — General',
    description: 'A structured Statement of Purpose template for humanities, social sciences, and non-STEM programs. With paragraph-by-paragraph guidance.',
    category: 'SOP Template',
    categoryColor: 'bg-purple-50 text-purple-700',
    file: '/downloads/sample-sop-general.txt',
    filename: 'Xcel360-Sample-SOP-General.txt',
  },
  {
    id: 'sop-stem',
    title: 'Sample SOP — STEM',
    description: 'A research-driven SOP template for STEM graduate programs. Focused on technical credibility, research problems, and faculty alignment.',
    category: 'SOP Template',
    categoryColor: 'bg-purple-50 text-purple-700',
    file: '/downloads/sample-sop-stem.txt',
    filename: 'Xcel360-Sample-SOP-STEM.txt',
  },
]

export default async function ResourcesPage() {
  const [dbPosts, dbResources] = await Promise.all([getPosts(), getResources()])
  const posts = dbPosts.length > 0 ? dbPosts : defaultPosts
  const resources = dbResources.length > 0 ? dbResources : downloadTemplates

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Resources & Templates</h1>
          <p className="text-blue-200 text-lg">
            Guides, templates, and tools to help you craft a winning application.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── Downloads section ── */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
              <Download className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Free Templates</h2>
          </div>
          <p className="text-gray-500 mb-6 ml-11">
            Download and customise these templates for your scholarship applications.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resources.map((tpl: any) => (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                <div className="p-5 flex flex-col flex-1">
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium mb-3 w-fit bg-blue-50 text-blue-700">
                    <FileText className="h-3 w-3" />
                    {tpl.category}
                  </span>
                  <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug">{tpl.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{tpl.description}</p>
                  <a
                    href={tpl.fileUrl ?? tpl.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-brand-700 text-white rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Blog / Guides ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Guides & Articles</h2>
              <p className="text-gray-500 mt-1">Tips and insights from our team and community.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/resources/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                <div className="p-6">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
