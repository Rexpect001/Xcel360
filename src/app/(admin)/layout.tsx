import { getAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap, LayoutDashboard, BookOpen, Calendar,
  BarChart3, ArrowLeft, FileText, Users, UserCheck, Award, FolderOpen, Briefcase
} from 'lucide-react'

const adminNav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/opportunities', label: 'Scholarships', icon: BookOpen },
  { href: '/admin/jobs', label: 'Jobs & Internships', icon: Briefcase },
  { href: '/admin/programs', label: 'Programs', icon: Award },
  { href: '/admin/resources', label: 'Resources', icon: FolderOpen },
  { href: '/admin/blog', label: 'Blog & Guides', icon: FileText },
  { href: '/admin/mentorship', label: 'Mentorship', icon: UserCheck },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuth()
  if (!session || session.user.role !== 'ADMIN') redirect('/')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-60 bg-white border-r border-gray-100 fixed inset-y-0 flex flex-col z-10 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-800 rounded-lg flex items-center justify-center shadow-sm">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Xcel360</div>
            <div className="text-xs text-brand-600 font-semibold">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {adminNav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors group"
              >
                <Icon className="h-4 w-4 flex-shrink-0 group-hover:text-brand-600 transition-colors" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-brand-700 rounded-xl hover:bg-brand-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8 min-h-screen">{children}</main>
    </div>
  )
}
