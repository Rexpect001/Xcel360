'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  User, Globe, BookOpen, Bell, Save, Check, Phone, GraduationCap, Building2, CalendarRange, Award,
  PenLine, X, Mail, Sparkles, ArrowRight,
} from 'lucide-react'
import { profileCompleteness } from '@/lib/matching'

const PROGRAM_LEVELS = ['Undergrad', 'Masters', 'PhD', 'Postdoc']

const DEGREES = [
  'B.Sc', 'B.A', 'B.Eng', 'B.Tech', 'B.Ed', 'LL.B', 'MBBS',
  'HND', 'OND', 'M.Sc', 'M.A', 'M.Eng', 'MBA', 'M.Ed', 'PhD', 'Other',
]

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR + 8 - i)

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
  courseOfStudy: string | null
  degree: string | null
  graduationYear: number | null
  bio: string | null
  whatsappNumber: string | null
  school: string | null
  department: string | null
  notifyEmail: boolean
  notifyInApp: boolean
}

const EMPTY: ProfileData = {
  level: null,
  targetCountries: [],
  targetFields: [],
  courseOfStudy: null,
  degree: null,
  graduationYear: null,
  bio: null,
  whatsappNumber: null,
  school: null,
  department: null,
  notifyEmail: true,
  notifyInApp: true,
}

const inputCls =
  'w-full text-sm text-ink-900 border border-surface-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white placeholder:text-ink-400'

function chipCls(active: boolean) {
  return `inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium transition-all ${
    active
      ? 'bg-brand-600 text-white border-brand-600'
      : 'bg-white text-ink-700 border-surface-200 hover:border-brand-400 hover:text-brand-700'
  }`
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
      <p className="block text-sm font-medium text-ink-800 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const active = selected.includes(item)
          return (
            <button key={item} type="button" onClick={() => toggle(item)} aria-pressed={active} className={chipCls(active)}>
              {active && <Check className="h-3 w-3" />}
              {item}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && <p className="text-xs text-brand-700 mt-1.5 font-semibold">{selected.length} selected</p>}
    </div>
  )
}

function Card({ icon: Icon, title, hint, children, wide }: {
  icon: typeof User
  title: string
  hint?: string
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <section className={`dash-panel p-5 sm:p-6 ${wide ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand-700" />
        </span>
        <div>
          <h3 className="font-semibold text-ink-900">{title}</h3>
          {hint && <p className="text-xs text-ink-600">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Optional() {
  return <span className="text-ink-500 font-normal">(optional)</span>
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState<ProfileData>(EMPTY)
  const [form, setForm] = useState<ProfileData>(EMPTY)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          const loaded: ProfileData = {
            level: data.level ?? null,
            targetCountries: data.targetCountries ?? [],
            targetFields: data.targetFields ?? [],
            courseOfStudy: data.courseOfStudy ?? null,
            degree: data.degree ?? null,
            graduationYear: data.graduationYear ?? null,
            bio: data.bio ?? null,
            whatsappNumber: data.whatsappNumber ?? null,
            school: data.school ?? null,
            department: data.department ?? null,
            notifyEmail: data.notifyEmail ?? true,
            notifyInApp: data.notifyInApp ?? true,
          }
          setForm(loaded)
          setSaved(loaded)
          // A brand-new profile goes straight to the form
          if (profileCompleteness(loaded) === 0 && !loaded.school && !loaded.bio) setEditing(true)
        } else {
          setEditing(true)
        }
      })
      .catch(() => setEditing(true))
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
      toast.success('Profile saved. Your matches are updated.')
      setSaved(form)
      setEditing(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast.error('Failed to save profile. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const completion = profileCompleteness(saved)
  const name = session?.user?.name ?? 'Your profile'
  const initials = name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U'
  const set = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="max-w-6xl">
      {/* Header: who you are and how complete the profile is */}
      <section className="dash-panel p-5 sm:p-6 mb-6 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <span className="h-16 w-16 shrink-0 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-display text-2xl">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl text-ink-900 truncate">{name}</h1>
            {session?.user?.email && (
              <p className="text-sm text-ink-700 truncate flex items-center gap-1.5 mt-0.5">
                <Mail className="h-4 w-4 text-ink-500 shrink-0" /> {session.user.email}
              </p>
            )}
          </div>
        </div>
        <div className="md:w-64">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-900">Profile strength</span>
            <span className="font-semibold text-brand-700 tabular-nums">{completion}%</span>
          </div>
          <div
            className="mt-2 h-2 rounded-full bg-ink-100 overflow-hidden"
            role="meter"
            aria-label="Profile strength"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completion}
          >
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${completion}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-700">
            {completion < 100 ? 'Complete it for sharper scholarship matches.' : 'Complete. Your matches use all of it.'}
          </p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="btn-primary shrink-0">
            <PenLine className="h-4 w-4" /> Edit profile
          </button>
        )}
      </section>

      {!editing ? (
        <ProfileView data={saved} onEdit={() => setEditing(true)} />
      ) : (
        <>
          <div className="mb-5">
            <h2 className="font-display text-2xl text-ink-900">Edit your profile</h2>
            <p className="text-ink-700 mt-1 text-sm">Your level, fields and countries decide which scholarships we match to you.</p>
          </div>

          <form onSubmit={handleSave} className="grid lg:grid-cols-2 gap-5 items-start">
            <Card icon={BookOpen} title="Study level" hint="The level you want to study at next">
              <div className="flex flex-wrap gap-2">
                {PROGRAM_LEVELS.map((lvl) => {
                  const active = form.level === lvl
                  return (
                    <button key={lvl} type="button" aria-pressed={active} onClick={() => set('level', active ? null : lvl)} className={chipCls(active)}>
                      {active && <Check className="h-3.5 w-3.5" />}
                      {lvl}
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card icon={User} title="Short bio" hint="Optional. Helps mentors and advisors know your goals">
              <textarea
                rows={3}
                placeholder="A brief description of your background and goals..."
                value={form.bio ?? ''}
                onChange={(e) => set('bio', e.target.value || null)}
                className="w-full text-sm text-ink-900 border border-surface-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none placeholder:text-ink-400"
              />
            </Card>

            <Card icon={Sparkles} title="Fields of interest">
              <MultiSelect
                label="What subjects are you interested in?"
                options={FIELD_TAGS}
                selected={form.targetFields}
                onChange={(val) => set('targetFields', val)}
              />
            </Card>

            <Card icon={Globe} title="Target countries">
              <MultiSelect
                label="Where would you like to study?"
                options={COUNTRIES}
                selected={form.targetCountries}
                onChange={(val) => set('targetCountries', val)}
              />
            </Card>

            <Card icon={Award} title="Education background" hint="Helps us match scholarships to your exact qualification">
              <div className="space-y-4">
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-ink-800 mb-1.5">Course of study <Optional /></label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                    <input id="course" type="text" placeholder="e.g., Mechanical Engineering" value={form.courseOfStudy ?? ''} onChange={(e) => set('courseOfStudy', e.target.value || null)} className={inputCls} />
                  </div>
                  <p className="text-xs text-ink-600 mt-1">The exact course you studied or are studying. This powers your match score.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="degree" className="block text-sm font-medium text-ink-800 mb-1.5">Degree <Optional /></label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500 pointer-events-none" />
                      <select id="degree" value={form.degree ?? ''} onChange={(e) => set('degree', e.target.value || null)} className={`${inputCls} appearance-none`}>
                        <option value="">Select degree...</option>
                        {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gradyear" className="block text-sm font-medium text-ink-800 mb-1.5">Graduation year <Optional /></label>
                    <div className="relative">
                      <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500 pointer-events-none" />
                      <select
                        id="gradyear"
                        value={form.graduationYear ?? ''}
                        onChange={(e) => set('graduationYear', e.target.value ? parseInt(e.target.value, 10) : null)}
                        className={`${inputCls} appearance-none`}
                      >
                        <option value="">Select year...</option>
                        {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <p className="text-xs text-ink-600 mt-1">Actual or expected</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card icon={Building2} title="School and contact">
              <div className="space-y-4">
                <div>
                  <label htmlFor="school" className="block text-sm font-medium text-ink-800 mb-1.5">School / university <Optional /></label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                    <input id="school" type="text" placeholder="e.g., University of Lagos" value={form.school ?? ''} onChange={(e) => set('school', e.target.value || null)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-ink-800 mb-1.5">Department <Optional /></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                    <input id="department" type="text" placeholder="e.g., Computer Science" value={form.department ?? ''} onChange={(e) => set('department', e.target.value || null)} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-ink-800 mb-1.5">WhatsApp number <Optional /></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500" />
                    <input id="whatsapp" type="tel" placeholder="+234 812 345 6789" value={form.whatsappNumber ?? ''} onChange={(e) => set('whatsappNumber', e.target.value || null)} className={inputCls} />
                  </div>
                  <p className="text-xs text-ink-600 mt-1">To connect with mentors and opportunities</p>
                </div>
              </div>
            </Card>

            <Card icon={Bell} title="Notification preferences" wide>
              <div className="grid sm:grid-cols-2 gap-3">
                {([
                  { key: 'notifyEmail', label: 'Email notifications', description: 'Deadline reminders and new scholarship alerts by email' },
                  { key: 'notifyInApp', label: 'In-app notifications', description: 'Updates and reminders inside your dashboard' },
                ] as const).map(({ key, label, description }) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group rounded-xl border border-surface-200 p-3 hover:border-brand-300">
                    <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="sr-only peer" />
                    <span
                      aria-hidden
                      className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 ${
                        form[key] ? 'bg-brand-600 border-brand-600' : 'border-surface-300 group-hover:border-brand-400'
                      }`}
                    >
                      {form[key] && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink-900">{label}</span>
                      <span className="block text-xs text-ink-600">{description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            {/* Save bar stays in reach on long forms */}
            <div className="lg:col-span-2 sticky bottom-3 z-10 flex flex-wrap gap-3 rounded-2xl border border-surface-200 bg-white/95 p-3 shadow-soft backdrop-blur">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save profile'}
              </button>
              {completion > 0 && (
                <button
                  type="button"
                  onClick={() => { setForm(saved); setEditing(false) }}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold text-ink-700 hover:bg-surface-100 transition-colors"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}

/** Read-only profile summary, shown before the user chooses to edit. */
function ProfileView({ data, onEdit }: { data: ProfileData; onEdit: () => void }) {
  const missing = <span className="text-ink-500 italic">Not added</span>
  const chips = (items: string[]) =>
    items.length ? (
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800 ring-1 ring-brand-100">{i}</span>
        ))}
      </div>
    ) : missing

  const cards = [
    {
      title: 'What you are looking for', icon: Sparkles,
      rows: [
        { label: 'Study level', value: data.level ?? missing },
        { label: 'Fields of interest', value: chips(data.targetFields) },
        { label: 'Target countries', value: chips(data.targetCountries) },
      ],
    },
    {
      title: 'Education', icon: Award,
      rows: [
        { label: 'Course of study', value: data.courseOfStudy ?? missing },
        { label: 'Degree', value: data.degree ?? missing },
        { label: 'Graduation year', value: data.graduationYear ?? missing },
        { label: 'School / university', value: data.school ?? missing },
        { label: 'Department', value: data.department ?? missing },
      ],
    },
    {
      title: 'Contact', icon: Phone,
      rows: [{ label: 'WhatsApp', value: data.whatsappNumber ?? missing }],
    },
    {
      title: 'Notifications', icon: Bell,
      rows: [
        { label: 'Email alerts', value: data.notifyEmail ? 'On' : 'Off' },
        { label: 'In-app alerts', value: data.notifyInApp ? 'On' : 'Off' },
      ],
    },
  ]

  return (
    <div className="grid lg:grid-cols-2 gap-5 items-start">
      {cards.map(({ title, icon: Icon, rows }) => (
        <section key={title} className="dash-panel p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900">
              <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center"><Icon className="h-4 w-4 text-brand-700" /></span>
              {title}
            </h2>
            <button type="button" onClick={onEdit} className="text-sm font-semibold text-brand-700 hover:underline">Edit</button>
          </div>
          <dl className="divide-y divide-surface-100">
            {rows.map((r) => (
              <div key={r.label} className="grid sm:grid-cols-[150px_1fr] gap-1 sm:gap-4 py-2.5">
                <dt className="text-sm font-medium text-ink-600">{r.label}</dt>
                <dd className="text-sm text-ink-900">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <section className="dash-panel p-5 sm:p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <span className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center"><User className="h-4 w-4 text-brand-700" /></span>
            About you
          </h2>
          <button type="button" onClick={onEdit} className="text-sm font-semibold text-brand-700 hover:underline">Edit</button>
        </div>
        <p className="text-sm leading-relaxed text-ink-800 whitespace-pre-line">
          {data.bio || <span className="text-ink-500 italic">Add a short bio so mentors and advisors know your goals.</span>}
        </p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          See your matched scholarships <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
