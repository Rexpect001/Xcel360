'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User, Globe, BookOpen, Bell, Save, ArrowLeft, Check, Phone, GraduationCap, Building2 } from 'lucide-react'
import Link from 'next/link'

const PROGRAM_LEVELS = ['Undergrad', 'Masters', 'PhD', 'Postdoc']

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia',
  'France', 'Netherlands', 'Sweden', 'Norway', 'Japan', 'South Korea',
  'China', 'Singapore', 'New Zealand', 'Switzerland', 'Belgium',
  'Europe (Multiple)', 'Global',
]

const FIELD_TAGS = [
  'Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Medicine', 'Agriculture', 'Environmental Science',
  'Social Sciences', 'Humanities', 'Arts', 'Law', 'Business',
  'Policy', 'International Relations', 'Education', 'Economics',
]

interface ProfileData {
  level: string | null
  targetCountries: string[]
  targetFields: string[]
  bio: string | null
  whatsappNumber: string | null
  school: string | null
  department: string | null
  notifyEmail: boolean
  notifyInApp: boolean
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item])
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = selected.includes(item)
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
                active
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-700'
              }`}
            >
              {active && <Check className="h-3 w-3" />}
              {item}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-brand-600 mt-1.5 font-medium">{selected.length} selected</p>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProfileData>({
    level: null,
    targetCountries: [],
    targetFields: [],
    bio: null,
    whatsappNumber: null,
    school: null,
    department: null,
    notifyEmail: true,
    notifyInApp: true,
  })

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            level: data.level ?? null,
            targetCountries: data.targetCountries ?? [],
            targetFields: data.targetFields ?? [],
            bio: data.bio ?? null,
            whatsappNumber: data.whatsappNumber ?? null,
            school: data.school ?? null,
            department: data.department ?? null,
            notifyEmail: data.notifyEmail ?? true,
            notifyInApp: data.notifyInApp ?? true,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Profile saved!')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save profile. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Update your preferences to get personalised scholarship matches.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Study level */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-brand-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Study Level</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROGRAM_LEVELS.map((lvl) => {
              const active = form.level === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, level: active ? null : lvl }))}
                  className={`inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border font-medium transition-all ${
                    active
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-700'
                  }`}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {lvl}
                </button>
              )
            })}
          </div>
        </div>

        {/* Target countries */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <Globe className="h-4 w-4 text-brand-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Target Countries</h2>
          </div>
          <MultiSelect
            label="Where would you like to study?"
            options={COUNTRIES}
            selected={form.targetCountries}
            onChange={(val) => setForm((f) => ({ ...f, targetCountries: val }))}
          />
        </div>

        {/* Target fields */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-brand-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Fields of Interest</h2>
          </div>
          <MultiSelect
            label="What subjects are you interested in?"
            options={FIELD_TAGS}
            selected={form.targetFields}
            onChange={(val) => setForm((f) => ({ ...f, targetFields: val }))}
          />
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Short Bio <span className="text-gray-400 font-normal">(optional)</span></h2>
          <textarea
            rows={3}
            placeholder="A brief description of your background and goals..."
            value={form.bio ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value || null }))}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-brand-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Personal Information</h2>
          </div>
          <div className="space-y-4">
            {/* WhatsApp Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                WhatsApp Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+234 812 345 6789"
                  value={form.whatsappNumber ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value || null }))}
                  className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Add your WhatsApp number to connect with mentors and opportunities</p>
            </div>

            {/* School/University */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                School/University <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., University of Lagos"
                  value={form.school ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, school: e.target.value || null }))}
                  className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department/Field of Study <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g., Computer Science"
                  value={form.department ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value || null }))}
                  className="w-full text-sm border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <Bell className="h-4 w-4 text-brand-700" />
            </div>
            <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: 'notifyEmail', label: 'Email notifications', description: 'Receive deadline reminders and new scholarship alerts by email' },
              { key: 'notifyInApp', label: 'In-app notifications', description: 'See notifications inside your dashboard' },
            ].map(({ key, label, description }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={form[key as keyof ProfileData] as boolean}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    form[key as keyof ProfileData]
                      ? 'bg-brand-700 border-brand-700'
                      : 'border-gray-300 group-hover:border-brand-400'
                  }`}>
                    {form[key as keyof ProfileData] && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
        </div>

      </form>
    </div>
  )
}
