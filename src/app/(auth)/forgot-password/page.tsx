'use client'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'react-hot-toast'

function ForgotPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get('token')

  // If a token is in the URL, jump straight to the new-password step
  const [step, setStep] = useState<'email' | 'sent' | 'newpassword' | 'done'>(
    tokenFromUrl ? 'newpassword' : 'email'
  )
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [token, setToken] = useState(tokenFromUrl ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl)
      setStep('newpassword')
    }
  }, [tokenFromUrl])

  // Step 1: Send reset email
  const handleEmailStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always move to "sent" regardless  -  no email enumeration
      setStep('sent')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Submit new password with token from email link
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.')
      setStep('email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong')
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          setStep('email')
        }
        return
      }
      setStep('done')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Done
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
          className="w-full bg-ink-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-ink-800 transition-colors"
        >
          Sign In Now
        </button>
      </div>
    )
  }

  // Email sent  -  waiting for user to click link
  if (step === 'sent') {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
        <p className="text-gray-500 text-sm mb-1">
          If <span className="font-medium text-gray-700">{email}</span> is registered, we've sent a reset link.
        </p>
        <p className="text-gray-400 text-xs mb-6">The link expires in 1 hour. Check your spam folder if you don't see it.</p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 text-left mb-6 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>For your security, passwords can only be changed through the link sent to your email.</span>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => setStep('email')}
            className="text-sm text-brand-600 hover:text-brand-700 block w-full"
          >
            Use a different email
          </button>
          <p className="text-xs text-gray-400">
            Can&apos;t access your email?{' '}
            <a
              href="mailto:support@xcel360.com?subject=Account%20Recovery%20Request&body=Hi%20Xcel360%20team%2C%0A%0AI%20cannot%20access%20the%20email%20linked%20to%20my%20account%20and%20need%20help%20recovering%20it.%0A%0AName%3A%20%0AEmail%20on%20account%20(if%20known)%3A%20%0AAny%20other%20details%3A%20"
              className="text-brand-500 hover:text-brand-700 underline"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    )
  }

  // New password form (reached via email link with token)
  if (step === 'newpassword') {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-brand-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Set new password</h1>
            <p className="text-gray-500 text-xs mt-0.5">Identity verified via email link</p>
          </div>
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
                placeholder="Min. 8 characters"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            className="w-full bg-ink-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-ink-800 transition-colors disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
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
        <p className="text-gray-500 text-sm mt-1">Enter your email and we will send a secure reset link.</p>
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
          disabled={loading || !email}
          className="w-full bg-ink-900 text-white py-3 rounded-xl font-semibold text-sm hover:bg-ink-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? 'Sending...' : <><span>Send Reset Link</span> <ArrowRight className="h-4 w-4" /></>}
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
