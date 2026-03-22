'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [step, setStep] = useState<'email' | 'newpassword' | 'done'>('email')
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleEmailStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // Just move to the password step — no server call needed
    setStep('newpassword')
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/simple-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong')
        return
      }
      setStep('done')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated!</h1>
        <p className="text-gray-500 text-sm mb-6">You can now sign in with your new password.</p>
        <button
          onClick={() => router.push('/signin')}
          className="w-full bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors"
        >
          Sign In Now
        </button>
      </div>
    )
  }

  if (step === 'newpassword') {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-500 text-sm mt-1">
            Resetting password for <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
            className="w-full bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
          <button
            type="button"
            onClick={() => setStep('email')}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different email
          </button>
        </form>
      </div>
    )
  }

  // Step 1: Enter email
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
        <p className="text-gray-500 text-sm mt-1">Enter the email you used to sign up</p>
      </div>

      <form onSubmit={handleEmailStep} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!email}
          className="w-full bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      <div className="text-center mt-6">
        <Link href="/signin" className="text-sm text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 h-64 animate-pulse" />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
