'use client'

import { useEffect, useState } from 'react'
import { Megaphone, ExternalLink, Loader2, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Setting {
  key: string
  label: string
  description: string
  link?: string
  value: boolean
}

const SETTINGS_META: Omit<Setting, 'value'>[] = [
  {
    key: 'edifier_ad_enabled',
    label: 'EDIFIER Popup Ad',
    description: 'Show the EDIFIER judging event popup once per day to visitors on the Xcel360 public pages. Disable this when the event registration closes.',
    link: 'https://edifier.xcel360.com',
  },
]

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings/edifier-ad')
      .then((r) => r.json())
      .then((d) => {
        setSettings(
          SETTINGS_META.map((m) => ({
            ...m,
            value: m.key === 'edifier_ad_enabled' ? d.enabled : false,
          }))
        )
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(key: string, newValue: boolean) {
    setSaving(key)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: String(newValue) }),
      })
      if (!res.ok) throw new Error()
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value: newValue } : s))
      )
      toast.success(newValue ? 'Popup enabled' : 'Popup disabled')
    } catch {
      toast.error('Failed to save setting')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Configuration</p>
        <h1 className="text-3xl font-bold text-slate-900">Site Settings</h1>
        <p className="mt-1 text-slate-500">Control site-wide features without touching code.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-12">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading settings…</span>
        </div>
      ) : (
        <div className="space-y-4">
          {settings.map((s) => (
            <div
              key={s.key}
              className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start justify-between gap-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.value ? 'bg-blue-50' : 'bg-slate-100'}`}>
                  <Megaphone size={18} className={s.value ? 'text-blue-600' : 'text-slate-400'} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{s.label}</h3>
                    {s.value ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Active
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Off
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1.5"
                    >
                      <ExternalLink size={11} /> {s.link}
                    </a>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggle(s.key, !s.value)}
                disabled={saving === s.key}
                className="shrink-0 mt-1 disabled:opacity-50"
                aria-label={s.value ? 'Disable' : 'Enable'}
              >
                {saving === s.key ? (
                  <Loader2 size={28} className="animate-spin text-slate-400" />
                ) : s.value ? (
                  <ToggleRight size={36} className="text-blue-600" />
                ) : (
                  <ToggleLeft size={36} className="text-slate-300" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
