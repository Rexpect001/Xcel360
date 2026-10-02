'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { ExternalLink, X, LogIn, UserPlus } from 'lucide-react'
import Link from 'next/link'

function sanitizeUrl(href: string | null): string | null {
  if (!href) return null
  const url = href.trim()
  if (!url) return null
  // Reject dangerous schemes
  if (/^(javascript|data|vbscript):/i.test(url)) return null
  // Ensure https://  -  upgrade http:// to https://
  if (url.startsWith('https://')) return url
  if (url.startsWith('http://')) return url.replace('http://', 'https://')
  return `https://${url}`
}

export default function ApplyButton({ href, title }: { href: string | null; title: string }) {
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)

  const safeHref = sanitizeUrl(href)

  if (!safeHref) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!session) {
      e.preventDefault()
      setShowModal(true)
    }
    // For signed-in users: let the browser open the link normally in a new tab
  }

  return (
    <>
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-ink-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-ink-800 transition-colors"
      >
        Apply Now <ExternalLink className="h-4 w-4" />
      </a>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 z-10">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="h-7 w-7 text-brand-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Sign in to apply
              </h2>
              <p className="text-gray-500 text-sm">
                Create a free account or sign in to access the application link for <span className="font-medium text-gray-700">{title}</span> and track your progress.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href={`/signup?redirect=/opportunities`}
                className="flex items-center justify-center gap-2 w-full bg-ink-900 text-white py-3 rounded-xl font-semibold hover:bg-ink-800 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Create Free Account
              </Link>
              <Link
                href={`/signin?redirect=/opportunities`}
                className="flex items-center justify-center gap-2 w-full border-2 border-ink-900 text-brand-700 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              Free forever. No credit card required.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
