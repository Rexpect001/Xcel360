'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function GuestPrompt({ kind = 'opportunity' }: { kind?: 'opportunity' | 'job' | 'internship' }) {
  const { status } = useSession()
  if (status !== 'unauthenticated') return null

  if (kind !== 'opportunity') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Track this {kind}</h3>
        <p className="text-sm text-gray-500 mb-4">Save it to your dashboard and get deadline reminders.</p>
        <Link href="/signup" className="block w-full text-center bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors">
          Create Free Account
        </Link>
      </div>
    )
  }

  return (
    <p className="text-xs text-ink-500 mt-3 leading-relaxed">
      <Link href="/signup" className="text-brand-700 font-semibold hover:underline">Create a free account</Link>{' '}
      to save this and get deadline reminders.
    </p>
  )
}
