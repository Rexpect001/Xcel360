'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { X, LogIn, UserPlus, FileText, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface GatedLinkProps {
  href: string
  className?: string
  children: React.ReactNode
  type?: 'download' | 'article'
  isExternal?: boolean
}

export default function GatedLink({ href, className, children, type = 'download', isExternal = false }: GatedLinkProps) {
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (session) return
    e.preventDefault()
    setShowModal(true)
  }

  const message = type === 'download'
    ? 'Sign in to download this free template and access all resources.'
    : 'Sign in to read this guide and access all articles and templates.'

  return (
    <>
      {isExternal ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick}>
          {children}
        </a>
      ) : (
        <Link href={href} className={className} onClick={handleClick}>
          {children}
        </Link>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-brand-700">
                {type === 'download' ? <FileText className="h-7 w-7" /> : <BookOpen className="h-7 w-7" />}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {type === 'download' ? 'Sign in to download' : 'Sign in to read'}
              </h2>
              <p className="text-gray-500 text-sm">{message}</p>
            </div>

            <div className="space-y-3">
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full bg-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-brand-800 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create Free Account
              </Link>
              <Link
                href="/signin"
                className="flex items-center justify-center gap-2 w-full border-2 border-brand-700 text-brand-700 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">Free forever. No credit card required.</p>
          </div>
        </div>
      )}
    </>
  )
}
