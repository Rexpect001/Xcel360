'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { BadgeCheck, Loader2, Mail, Search, Download, ExternalLink, Printer, ShieldCheck } from 'lucide-react'

interface Cert {
  certificateId: string
  eventName: string
  eventDate: string | null
  certificateType: string
  issuedAt: string
  pdfUrl: string | null
  verifyUrl: string
}

type Step = 'email' | 'list'

export default function CertificatePage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [certs, setCerts] = useState<Cert[]>([])
  const [holder, setHolder] = useState<string | null>(null)

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/certificate/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      setCerts(d.certificates || [])
      setHolder(d.fullName || null)
      setStep('list')
      if ((d.certificates || []).length === 0) toast('No certificates found for this email.')
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <BadgeCheck className="h-7 w-7 text-brand-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Your Certificates</h1>
          <p className="text-gray-500 mt-2">
            Enter the email you registered with to view and download your certificates.
          </p>
        </div>

        {/* Step: email */}
        {step === 'email' && (
          <form onSubmit={lookup} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-gray-200 rounded-xl pl-11 pr-3 py-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <button type="submit" disabled={loading}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-brand-700 text-white py-3 rounded-xl font-semibold hover:bg-brand-800 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Find My Certificates
            </button>
          </form>
        )}

        {/* Step: list */}
        {step === 'list' && (
          <div>
            {holder && <p className="text-center text-gray-600 mb-5">Certificates for <strong>{holder}</strong></p>}
            {certs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
                No certificates found for this email yet.
              </div>
            ) : (
              <div className="space-y-4">
                {certs.map((c) => (
                  <div key={c.certificateId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="inline-block text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full mb-2">
                          {c.certificateType}
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg leading-snug">{c.eventName}</h3>
                        <p className="text-sm text-gray-500 mt-1">Issued {fmt(c.issuedAt)}</p>
                      </div>
                      <span className="text-xs text-gray-400 font-mono shrink-0">{c.certificateId}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.pdfUrl && (
                        <>
                          <a href={c.pdfUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-800 transition-colors">
                            <ExternalLink className="h-4 w-4" /> View
                          </a>
                          <a href={c.pdfUrl} download
                            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                            <Download className="h-4 w-4" /> Download PDF
                          </a>
                          <a href={c.pdfUrl} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                            <Printer className="h-4 w-4" /> Print
                          </a>
                        </>
                      )}
                      <a href={c.verifyUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                        <ShieldCheck className="h-4 w-4" /> Verify
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setStep('email'); setCerts([]) }}
              className="mt-6 mx-auto block text-sm text-gray-500 hover:text-gray-700">
              Look up a different email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
