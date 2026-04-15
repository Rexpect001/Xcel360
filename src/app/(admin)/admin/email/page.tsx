'use client'
import { useState, useEffect } from 'react'
import { Send, Users, Mail, Clock, CheckCircle, XCircle, Loader2, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

type Campaign = {
  id: string
  subject: string
  audience: string
  status: string
  totalCount: number
  sentCount: number
  dailyLimit: number
  createdAt: string
}

const AUDIENCE_OPTIONS = [
  { value: 'users', label: 'Registered users', desc: 'All accounts in the platform' },
  { value: 'subscribers', label: 'Newsletter subscribers', desc: 'Homepage email signups' },
  { value: 'both', label: 'Everyone', desc: 'Users + subscribers (deduplicated)' },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    DRAFT:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600',   icon: <Clock className="h-3 w-3" /> },
    SENDING:   { label: 'Sending…',  color: 'bg-blue-100 text-blue-700',   icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    FAILED:    { label: 'Failed',    color: 'bg-red-100 text-red-700',     icon: <XCircle className="h-3 w-3" /> },
  }
  const s = map[status] ?? map.DRAFT
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
      {s.icon}{s.label}
    </span>
  )
}

export default function AdminEmailPage() {
  const [tab, setTab] = useState<'compose' | 'campaigns'>('compose')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(false)

  // Compose form
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [audience, setAudience] = useState('subscribers')
  const [dailyLimit, setDailyLimit] = useState(100)
  const [sendAll, setSendAll] = useState(false)
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  const loadCampaigns = async () => {
    setLoadingCampaigns(true)
    try {
      const res = await fetch('/api/admin/email')
      if (res.ok) setCampaigns(await res.json())
    } finally {
      setLoadingCampaigns(false)
    }
  }

  useEffect(() => { loadCampaigns() }, [])

  const handleSend = async () => {
    if (!subject.trim()) { toast.error('Subject is required'); return }
    if (!htmlBody.trim()) { toast.error('Email body is required'); return }
    if (!confirm(`Send to all ${AUDIENCE_OPTIONS.find(a => a.value === audience)?.label}? This cannot be undone.`)) return

    setSending(true)
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, htmlBody, audience, dailyLimit, sendAll }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Send failed'); return }

      if (data.status === 'COMPLETED') {
        toast.success(`Sent to all ${data.sent} recipients!`)
      } else {
        toast.success(`Sent first ${data.sent} of ${data.total}. ${data.remaining} will send tomorrow at 7am.`)
      }

      setSubject('')
      setHtmlBody('')
      setTab('campaigns')
      loadCampaigns()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'SENDING')
  const completedCampaigns = campaigns.filter(c => c.status !== 'SENDING')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email</h1>
          <p className="text-gray-500 mt-1">Send campaigns to users and subscribers via Resend</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setTab('compose')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'compose' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Compose
          </button>
          <button
            onClick={() => { setTab('campaigns'); loadCampaigns() }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'campaigns' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Campaigns
            {activeCampaigns.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{activeCampaigns.length}</span>
            )}
          </button>
        </div>
      </div>

      {tab === 'compose' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Subject */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subject line *</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. New scholarships just posted — don't miss out!"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Body */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Email body *</label>
                <button
                  onClick={() => setPreview(!preview)}
                  className="text-xs text-brand-700 font-medium hover:text-brand-800"
                >
                  {preview ? 'Edit' : 'Preview HTML'}
                </button>
              </div>
              {preview ? (
                <div
                  className="min-h-[320px] border border-gray-200 rounded-xl p-4 overflow-auto text-sm"
                  dangerouslySetInnerHTML={{ __html: htmlBody }}
                />
              ) : (
                <textarea
                  value={htmlBody}
                  onChange={e => setHtmlBody(e.target.value)}
                  rows={14}
                  placeholder={`Write plain text or paste HTML.\n\nExample:\n<p>Hi there,</p>\n<p>We just posted 5 new scholarships matching your profile...</p>\n<a href="https://thexcel360.com/opportunities">Browse now →</a>`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
                />
              )}
              <p className="text-xs text-gray-400 mt-2">Accepts plain text or HTML. Use {'<p>'}, {'<a>'}, {'<strong>'} tags freely.</p>
            </div>
          </div>

          {/* Settings panel */}
          <div className="space-y-5">
            {/* Audience */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Audience</label>
              <div className="space-y-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${audience === opt.value ? 'border-brand-500 bg-brand-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <input
                      type="radio"
                      name="audience"
                      value={opt.value}
                      checked={audience === opt.value}
                      onChange={() => setAudience(opt.value)}
                      className="mt-0.5 text-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Send settings */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Send settings</label>

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendAll}
                  onChange={e => setSendAll(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600"
                />
                <span className="text-sm text-gray-700">Send all at once</span>
              </label>

              {!sendAll && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Daily limit <span className="text-gray-400">(max 100 on free plan)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Math.min(100, Math.max(1, Number(e.target.value))))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Remaining emails will send automatically at 7am each day.</p>
                </div>
              )}

              {sendAll && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                  Sending all at once may hit your Resend daily limit. Upgrade Resend for higher limits.
                </p>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !htmlBody.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-700 text-white rounded-xl font-semibold hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending…' : 'Send Campaign'}
            </button>
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="space-y-6">
          {/* Active campaigns */}
          {activeCampaigns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Active</h2>
                <button onClick={loadCampaigns} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>
              <div className="space-y-3">
                {activeCampaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            </div>
          )}

          {/* All campaigns */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {activeCampaigns.length > 0 ? 'History' : 'All Campaigns'}
            </h2>
            {loadingCampaigns ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
            ) : completedCampaigns.length === 0 && activeCampaigns.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Mail className="h-10 w-10 mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No campaigns yet</p>
                <p className="text-sm text-gray-400 mt-1">Compose your first email to get started.</p>
                <button onClick={() => setTab('compose')} className="mt-4 text-brand-700 text-sm font-medium">
                  Compose now →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {completedCampaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const pct = c.totalCount > 0 ? Math.round((c.sentCount / c.totalCount) * 100) : 0
  const audienceLabel = { users: 'Registered users', subscribers: 'Subscribers', both: 'Everyone' }[c.audience] ?? c.audience

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{c.subject}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{audienceLabel}</span>
            <span>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{c.sentCount.toLocaleString()} / {c.totalCount.toLocaleString()} sent</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${c.status === 'COMPLETED' ? 'bg-green-500' : c.status === 'FAILED' ? 'bg-red-400' : 'bg-brand-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {c.status === 'SENDING' && (
          <p className="text-xs text-gray-400 mt-1.5">
            {(c.totalCount - c.sentCount).toLocaleString()} remaining · {c.dailyLimit}/day · next batch tomorrow at 7am
          </p>
        )}
      </div>
    </div>
  )
}
