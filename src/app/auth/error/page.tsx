'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The sign-in link is no longer valid. It may have been used already or it may have expired.',
  OAuthSignin: 'Could not start the sign-in process. Please try again.',
  OAuthCallback: 'Could not complete sign-in. Please try again.',
  OAuthCreateAccount: 'Could not create an account. Please try again.',
  EmailCreateAccount: 'Could not create an account. Please try again.',
  Callback: 'Could not complete sign-in. Please try again.',
  Default: 'An unexpected error occurred. Please try signing in again.',
}

function ErrorContent() {
  const params = useSearchParams()
  const error = params.get('error') ?? 'Default'
  const message = errorMessages[error] ?? errorMessages.Default

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Sign-in Error</h1>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/signin"
            className="w-full bg-ink-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-ink-800 transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ErrorContent />
    </Suspense>
  )
}
