'use client'
import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Chrome, AlertCircle, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failCount, setFailCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setLoading(false)

    if (res?.ok) {
      toast.success('Welcome back!')
      router.push(callbackUrl)
    } else {
      const newCount = failCount + 1
      setFailCount(newCount)

      // Try to get a specific error message from NextAuth
      const msg = res?.error ?? ''
      if (msg.toLowerCase().includes('suspended')) {
        setErrorMsg('Your account has been suspended. Please contact support.')
      } else if (msg.toLowerCase().includes('disabled')) {
        setErrorMsg('Your account has been disabled. Please contact support.')
      } else if (msg.toLowerCase().includes('locked')) {
        setErrorMsg('Too many attempts. Please wait 15 minutes before trying again.')
      } else {
        setErrorMsg('Incorrect email or password.')
      }
    }
  }

  const showForgotPrompt = failCount >= 2

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to your Xcel360 account</p>
      </div>

      {/* Google sign in */}
      <button
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm hover:border-brand-300 hover:bg-brand-50 transition-all mb-6"
      >
        <Chrome className="h-4 w-4" />
        Continue with Google
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-xs text-gray-400">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setFailCount(0); setErrorMsg('') }}
              placeholder="you@example.com"
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                errorMsg ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrorMsg('') }}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors ${
                errorMsg ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{errorMsg}</p>
          </div>
        )}

        {/* Forgot password — shown after 2 failed attempts */}
        {showForgotPrompt ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-800 font-medium mb-1">
              Having trouble signing in?
            </p>
            <p className="text-xs text-amber-600 mb-2">
              You&apos;ve made {failCount} unsuccessful attempt{failCount !== 1 ? 's' : ''}. You can reset your password using the link below.
            </p>
            <Link
              href={`/forgot-password${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset my password
            </Link>
          </div>
        ) : (
          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-800 transition-colors disabled:opacity-60"
        >
          {loading ? 'Signing in...' : failCount > 0 ? 'Try again' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-brand-700 font-semibold hover:text-brand-800">
          Create free account
        </Link>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-2xl p-8 h-96 animate-pulse" />}>
      <SignInContent />
    </Suspense>
  )
}
