export const revalidate = 3600
import type { Metadata } from 'next'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, Calendar, Tag, Download, FileText, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ResourceDownloadButton from '@/components/resources/ResourceDownloadButton'

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
  return await prisma.blogPost.findMany({ where: { published: true }, orderBy: { createdAt: 'desc' } })
}

async function getResources() {
  return await (prisma as any).resource.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })
}

function getFileIcon(fileType?: string) {
  if (!fileType) return { label: 'FILE', color: 'bg-gray-100 text-gray-600' }
  if (fileType.includes('pdf')) return { label: 'PDF', color: 'bg-red-100 text-red-700' }
  if (fileType.includes('word') || fileType.includes('document')) return { label: 'DOC', color: 'bg-blue-100 text-blue-700' }
  if (fileType.includes('sheet') || fileType.includes('excel')) return { label: 'XLS', color: 'bg-green-100 text-green-700' }
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return { label: 'PPT', color: 'bg-orange-100 text-orange-700' }
  return { label: 'FILE', color: 'bg-gray-100 text-gray-600' }
}

function formatFileSize(bytes?: number) {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const defaultPosts = [
  { id: '1', title: '10 Fully Funded Scholarships Closing This Year', slug: '10-fully-funded-scholarships-2025', excerpt: 'Discover the top fully funded scholarships with upcoming deadlines you cannot afford to miss.', author: 'Xcel360 Team', tags: ['scholarships', 'fully funded'], createdAt: new Date(), updatedAt: new Date(), content: '', published: true, coverImage: null },
  { id: '2', title: 'How to Write a Winning Statement of Purpose', slug: 'how-to-write-winning-sop', excerpt: 'Step-by-step guide to writing an SOP that gets you into your dream program.', author: 'Dr. Sarah Johnson', tags: ['SOP', 'writing'], createdAt: new Date(), updatedAt: new Date(), content: '', published: true, coverImage: null },
  { id: '3', title: 'STEM vs Non-STEM Scholarships: What You Need to Know', slug: 'stem-vs-non-stem-scholarships', excerpt: 'A comprehensive comparison of scholarship opportunities for STEM and non-STEM students.', author: 'Xcel360 Team', tags: ['STEM', 'non-STEM'], createdAt: new Date(), updatedAt: new Date(), content: '', published: true, coverImage: null },
]

export default async function ResourcesPage() {
  const [dbPosts, dbResources] = await Promise.all([getPosts(), getResources()])
  const posts = dbPosts.length > 0 ? dbPosts : defaultPosts
  const postsAreReal = dbPosts.length > 0

  // Group resources by category
  const categories = Array.from(new Set(dbResources.map((r: any) => r.category))) as string[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-700 pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Resources & Templates</h1>
          <p className="text-blue-200 text-lg">
            Free guides, templates, and tools to help you craft a winning application.
          </p>
          {dbResources.length > 0 && (
            <div className="flex items-center gap-6 mt-6 text-sm text-blue-200">
              <span className="flex items-center gap-2"><Download className="h-4 w-4" />{dbResources.length} resources available</span>
              <span>{categories.length} categories</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── Downloads section ── */}
        {dbResources.length > 0 ? (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
                <Download className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Free Downloads</h2>
            </div>
            <p className="text-gray-500 mb-8 ml-11">
              Click to download any of these resources directly — no sign-up required.
            </p>

            {categories.length > 0 ? (
              <div className="space-y-10">
                {categories.map((cat) => {
                  const catResources = dbResources.filter((r: any) => r.category === cat)
                  return (
                    <div key={cat}>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" /> {cat}
                      </h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {catResources.map((resource: any) => {
                          const { label, color } = getFileIcon(resource.fileType)
                          const size = formatFileSize(resource.fileSize)
                          return (
                            <div key={resource.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden group">
                              <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                              <div className="p-5 flex flex-col flex-1">
                                {/* File type badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold ${color}`}>
                                    <FileText className="h-3 w-3" /> {label}
                                  </span>
                                  {size && <span className="text-xs text-gray-400">{size}</span>}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug group-hover:text-brand-700 transition-colors">{resource.title}</h3>
                                {resource.description && (
                                  <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4 line-clamp-3">{resource.description}</p>
                                )}
                                {resource.downloads > 0 && (
                                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                                    <Download className="h-3 w-3" /> {resource.downloads.toLocaleString()} downloads
                                  </p>
                                )}
                                <ResourceDownloadButton resource={resource} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {dbResources.map((resource: any) => {
                  const { label, color } = getFileIcon(resource.fileType)
                  const size = formatFileSize(resource.fileSize)
                  return (
                    <div key={resource.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden">
                      <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-bold ${color}`}>
                            <FileText className="h-3 w-3" /> {label}
                          </span>
                          {size && <span className="text-xs text-gray-400">{size}</span>}
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-sm leading-snug">{resource.title}</h3>
                        {resource.description && <p className="text-xs text-gray-500 flex-1 mb-4 line-clamp-3">{resource.description}</p>}
                        <ResourceDownloadButton resource={resource} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-14 text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Download className="h-12 w-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No resources uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Check back soon — templates and guides are coming.</p>
          </div>
        )}

        {/* ── Blog / Guides ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Guides & Articles</h2>
              <p className="text-gray-500 mt-1">Tips and insights from our team and community.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const cardContent = (
                <>
                  <div className="h-1.5 bg-gradient-to-r from-brand-600 to-brand-400" />
                  <div className="p-6">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-gray-500 line-clamp-2 mb-4">{post.excerpt}</p>}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{post.author}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.createdAt)}</span>
                    </div>
                    {!postsAreReal && (
                      <p className="text-xs text-brand-600 font-medium mt-3">Coming soon</p>
                    )}
                  </div>
                </>
              )
              return postsAreReal ? (
                <Link
                  key={post.id}
                  href={`/resources/${post.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={post.id}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-75"
                >
                  {cardContent}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
