'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Mail } from 'lucide-react'

export default function UnsubscribeContent() {
  const params = useSearchParams()
  const status = params.get('status')

  if (status === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;ve been unsubscribed</h1>
        <p className="text-gray-500 mb-6">
          You won&apos;t receive any more emails from Xcel360. We&apos;re sorry to see you go.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-700 font-medium hover:text-brand-800">
          <Mail className="h-4 w-4" /> Back to Xcel360
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid link</h1>
        <p className="text-gray-500 mb-6">
          This unsubscribe link is invalid or has expired. Please use the link from your email.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-700 font-medium hover:text-brand-800">
          Back to Xcel360
        </Link>
      </div>
    </div>
  )
}
