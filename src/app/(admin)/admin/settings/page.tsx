'use client'

import { useEffect, useState } from 'react'
import {
  Megaphone, ExternalLink, Loader2, CheckCircle2, ToggleLeft, ToggleRight,
  Settings2, Mail, Save, Eye, BadgePercent,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true)

  // Feature toggles
  const [edifierEnabled, setEdifierEnabled] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // Announcement bar
  const [announcementEnabled, setAnnouncementEnabled] = useState(false)
  const [announcementText, setAnnouncementText] = useState('')
  const [announcementLink, setAnnouncementLink] = useState('')
  const [announcementLinkLabel, setAnnouncementLinkLabel] = useState('Learn more')
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Contact
  const [contactEmail, setContactEmail] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  // Homepage advert
  const [adEnabled, setAdEnabled] = useState(false)
  const [adTitle, setAdTitle] = useState('')
  const [adText, setAdText] = useState('')
  const [adLink, setAdLink] = useState('')
  const [adCta, setAdCta] = useState('Learn more')
  const [adImage, setAdImage] = useState('')
  const [savingAd, setSavingAd] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/edifier-ad').then((r) => r.json()).catch(() => ({})),
      fetch('/api/settings/public').then((r) => r.json()).catch(() => ({})),
    ])
      .then(([edifier, pub]) => {
        setEdifierEnabled(!!edifier.enabled)
        const a = pub.announcement
        if (a) {
          setAnnouncementEnabled(!!a.enabled)
          setAnnouncementText(a.text ?? '')
          setAnnouncementLink(a.link ?? '')
          setAnnouncementLinkLabel(a.linkLabel ?? 'Learn more')
        }
        if (pub.contactEmail) setContactEmail(pub.contactEmail)
        const ad = pub.homeAd
        if (ad) {
          setAdEnabled(!!ad.enabled)
          setAdTitle(ad.title ?? '')
          setAdText(ad.text ?? '')
          setAdLink(ad.link ?? '')
          setAdCta(ad.cta ?? 'Learn more')
          setAdImage(ad.image ?? '')
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  async function saveSetting(key: string, value: string): Promise<boolean> {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    return res.ok
  }

  async function toggleEdifier(newValue: boolean) {
    setToggling('edifier')
    try {
      if (!(await saveSetting('edifier_ad_enabled', String(newValue)))) throw new Error()
      setEdifierEnabled(newValue)
      toast.success(newValue ? 'Popup enabled' : 'Popup disabled')
    } catch {
      toast.error('Failed to save setting')
    } finally {
      setToggling(null)
    }
  }

  async function saveAnnouncement() {
    if (announcementEnabled && !announcementText.trim()) {
      toast.error('Add an announcement message or turn the bar off')
      return
    }
    setSavingAnnouncement(true)
    try {
      const results = await Promise.all([
        saveSetting('announcement_enabled', String(announcementEnabled)),
        saveSetting('announcement_text', announcementText.trim()),
        saveSetting('announcement_link', announcementLink.trim()),
        saveSetting('announcement_link_label', announcementLinkLabel.trim() || 'Learn more'),
      ])
      if (results.some((ok) => !ok)) throw new Error()
      toast.success('Announcement bar saved')
    } catch {
      toast.error('Failed to save announcement')
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function saveContact() {
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      toast.error('Enter a valid email address')
      return
    }
    setSavingContact(true)
    try {
      if (!(await saveSetting('contact_email', contactEmail.trim()))) throw new Error()
      toast.success('Contact email saved')
    } catch {
      toast.error('Failed to save contact email')
    } finally {
      setSavingContact(false)
    }
  }

  async function saveAd() {
    if (adEnabled && !adTitle.trim()) {
      toast.error('Add an advert title or turn the advert off')
      return
    }
    setSavingAd(true)
    try {
      const results = await Promise.all([
        saveSetting('ad_home_enabled', String(adEnabled)),
        saveSetting('ad_home_title', adTitle.trim()),
        saveSetting('ad_home_text', adText.trim()),
        saveSetting('ad_home_link', adLink.trim()),
        saveSetting('ad_home_cta', adCta.trim() || 'Learn more'),
        saveSetting('ad_home_image', adImage.trim()),
      ])
      if (results.some((ok) => !ok)) throw new Error()
      toast.success('Advert saved')
    } catch {
      toast.error('Failed to save advert')
    } finally {
      setSavingAd(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 py-24 max-w-2xl">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading settings…</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Configuration</p>
        <h1 className="font-display text-3xl text-ink-900">Site Settings</h1>
        <p className="mt-1 text-slate-500">Control site-wide features without touching code.</p>
      </div>

      <div className="space-y-4">
        {/* ── Announcement Bar ── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${announcementEnabled ? 'bg-blue-50' : 'bg-slate-100'}`}>
                <Megaphone size={18} className={announcementEnabled ? 'text-blue-600' : 'text-slate-400'} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">Announcement Bar</h3>
                  {announcementEnabled ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Off</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A slim banner shown at the very top of every public page. Perfect for new cohorts,
                  deadlines, or event promotions. Visitors can dismiss it; it reappears when you
                  change the message.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAnnouncementEnabled((v) => !v)}
              className="shrink-0 mt-1"
              aria-label={announcementEnabled ? 'Disable announcement' : 'Enable announcement'}
            >
              {announcementEnabled
                ? <ToggleRight size={36} className="text-blue-600" />
                : <ToggleLeft size={36} className="text-slate-300" />}
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Message</label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Applications for Cohort 3 are now open!"
                maxLength={140}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Link URL <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  placeholder="/programs"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Link label</label>
                <input
                  type="text"
                  value={announcementLinkLabel}
                  onChange={(e) => setAnnouncementLinkLabel(e.target.value)}
                  placeholder="Learn more"
                  maxLength={30}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Live preview */}
            {announcementText.trim() && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Eye size={12} /> Preview
                </p>
                <div className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
                  <Megaphone className="h-4 w-4 shrink-0 text-brand-200" />
                  <p className="font-medium truncate">{announcementText}</p>
                  {announcementLink && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold bg-white/15 rounded-full px-3 py-1 shrink-0">
                      {announcementLinkLabel || 'Learn more'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={saveAnnouncement}
              disabled={savingAnnouncement}
              className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink-800 disabled:opacity-60 transition-colors"
            >
              {savingAnnouncement ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingAnnouncement ? 'Saving…' : 'Save Announcement'}
            </button>
          </div>
        </section>

        {/* ── Homepage Advert ── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start justify-between gap-6 mb-4">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${adEnabled ? 'bg-amber-50' : 'bg-slate-100'}`}>
                <BadgePercent size={18} className={adEnabled ? 'text-amber-600' : 'text-slate-400'} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">Homepage Advert</h3>
                  {adEnabled ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Off</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  A slim sponsored banner shown twice on the homepage - between the level cards and
                  the latest listings, and again before success stories. Clearly labelled
                  "Sponsored" and styled to fit the site.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdEnabled((v) => !v)}
              className="shrink-0 mt-1"
              aria-label={adEnabled ? 'Disable advert' : 'Enable advert'}
            >
              {adEnabled
                ? <ToggleRight size={36} className="text-blue-600" />
                : <ToggleLeft size={36} className="text-slate-300" />}
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Title</label>
                <input
                  type="text"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  placeholder="e.g. Ace your GRE with PrepMaster"
                  maxLength={80}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Button label</label>
                <input
                  type="text"
                  value={adCta}
                  onChange={(e) => setAdCta(e.target.value)}
                  placeholder="Learn more"
                  maxLength={24}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Short description <span className="text-slate-400">(optional)</span></label>
              <input
                type="text"
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                placeholder="One line of supporting text"
                maxLength={120}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Link URL <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  value={adLink}
                  onChange={(e) => setAdLink(e.target.value)}
                  placeholder="https://sponsor.com/offer"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Image URL <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  value={adImage}
                  onChange={(e) => setAdImage(e.target.value)}
                  placeholder="https://…/creative.png"
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Live preview */}
            {adTitle.trim() && (
              <div>
                <p className="text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Eye size={12} /> Preview
                </p>
                <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-white to-brand-50 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Megaphone size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/80">Sponsored</p>
                    <p className="font-bold text-slate-900 text-sm truncate">{adTitle}</p>
                    {adText && <p className="text-xs text-slate-500 truncate">{adText}</p>}
                  </div>
                  {adLink && (
                    <span className="shrink-0 bg-ink-900 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                      {adCta || 'Learn more'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={saveAd}
              disabled={savingAd}
              className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink-800 disabled:opacity-60 transition-colors"
            >
              {savingAd ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingAd ? 'Saving…' : 'Save Advert'}
            </button>
          </div>
        </section>

        {/* ── Contact email ── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Public Contact Email</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                The email address shown to visitors on policy pages and public surfaces.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="hello@thexcel360.com"
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            <button
              onClick={saveContact}
              disabled={savingContact}
              className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-ink-800 disabled:opacity-60 transition-colors shrink-0"
            >
              {savingContact ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save
            </button>
          </div>
        </section>

        {/* ── EDIFIER popup toggle (existing) ── */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${edifierEnabled ? 'bg-blue-50' : 'bg-slate-100'}`}>
              <Settings2 size={18} className={edifierEnabled ? 'text-blue-600' : 'text-slate-400'} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900">EDIFIER Popup Ad</h3>
                {edifierEnabled ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={10} /> Active
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Off</span>
                )}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Show the EDIFIER judging event popup once per day to visitors on the public pages.
                Disable this when the event registration closes.
              </p>
              <a
                href="https://edifier.xcel360.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1.5"
              >
                <ExternalLink size={11} /> https://edifier.xcel360.com
              </a>
            </div>
          </div>
          <button
            onClick={() => toggleEdifier(!edifierEnabled)}
            disabled={toggling === 'edifier'}
            className="shrink-0 mt-1 disabled:opacity-50"
            aria-label={edifierEnabled ? 'Disable popup' : 'Enable popup'}
          >
            {toggling === 'edifier' ? (
              <Loader2 size={28} className="animate-spin text-slate-400" />
            ) : edifierEnabled ? (
              <ToggleRight size={36} className="text-blue-600" />
            ) : (
              <ToggleLeft size={36} className="text-slate-300" />
            )}
          </button>
        </section>
      </div>
    </div>
  )
}
