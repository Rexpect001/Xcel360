import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Poster',
  description: 'Post scholarships, jobs and internships to Xcel360.',
  robots: { index: false, follow: false },
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-50 text-ink-900">{children}</div>
}
