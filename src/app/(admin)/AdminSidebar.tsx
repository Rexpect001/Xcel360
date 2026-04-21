'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap, ArrowLeft, ShieldCheck, Menu, X,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

type Props = {
  nav: NavItem[]
  email: string
  roleLabel: string
}

export default function AdminSidebar({ nav, email, roleLabel }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const aside = document.getElementById('admin-sidebar')
      if (aside && !aside.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0 bg-gradient-to-br from-blue-400 to-blue-700">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white tracking-tight">Xcel360</div>
          <div className="text-xs font-medium text-blue-400">Admin Panel</div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role badge */}
      <div className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl flex items-center gap-2.5 bg-white/[0.05] border border-white/[0.08]">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-indigo-500/20">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 truncate">{email}</p>
          <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded-md mt-0.5 bg-indigo-500/25 text-indigo-200">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-white/[0.12] text-white'
                  : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'
                }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 flex items-center gap-3 px-4 py-3 bg-[#0f172a] border-b border-white/[0.07]">
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-700">
            <GraduationCap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Xcel360 Admin</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar — desktop: fixed; mobile: slide-in drawer */}
      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 flex flex-col z-40 w-64 bg-[#0f172a] transition-transform duration-300
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
