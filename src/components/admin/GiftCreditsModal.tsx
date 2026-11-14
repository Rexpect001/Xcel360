'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Coins, Loader2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { ADMIN_GRANT_MAX, CREDITS_PER_USE, usesFor } from '@/lib/billing'

const PRESETS = [20, 50, 100, 200]

/** Admin: gift free credits to one user. The user is notified in-app and by email. */
export default function GiftCreditsModal({ user, onClose }: { user: { id: string; label: string } | null; onClose: () => void }) {
  const [amount, setAmount] = useState('100')
  const [reason, setReason] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  // One key per opened dialog, so a double click cannot grant twice
  const requestId = useMemo(() => (user ? `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : ''), [user])

  useEffect(() => {
    if (!user) return
    setAmount('100')
    setReason('')
    setBalance(null)
    fetch(`/api/admin/users/${user.id}/credits`)
      .then((r) => r.json())
      .then((d) => setBalance(typeof d.balance === 'number' ? d.balance : null))
      .catch(() => {})
  }, [user])

  const n = Number(amount)
  const valid = Number.isInteger(n) && n >= 1 && n <= ADMIN_GRANT_MAX

  const submit = async () => {
    if (!user || !valid) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: n, reason, requestId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not grant credits')
      toast.success(data.duplicate ? 'Already granted.' : `Sent ${n} credits to ${user.label}. New balance: ${data.balance}.`)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not grant credits')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Gift credits"
      description={user ? `Add free credits to ${user.label}. They get an in-app notification and an email.` : undefined}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-light">Cancel</button>
          <button type="button" onClick={submit} disabled={saving || !valid} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />} Send {valid ? n : ''} credits
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-700">
          Current balance: <span className="font-semibold text-ink-900">{balance === null ? '…' : `${balance} credits`}</span>
        </p>
        <div>
          <label htmlFor="gift-amount" className="block text-sm font-medium text-ink-800 mb-1.5">Credits to add</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(p))}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${n === p ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-ink-700 ring-surface-200 hover:ring-brand-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            id="gift-amount"
            type="number"
            min={1}
            max={ADMIN_GRANT_MAX}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field"
          />
          <p className="mt-1 text-xs text-ink-600">
            {valid ? `About ${usesFor(n)} draft${usesFor(n) === 1 ? '' : 's'} at ${CREDITS_PER_USE} credits each.` : `Whole number from 1 to ${ADMIN_GRANT_MAX}.`}
          </p>
        </div>
        <div>
          <label htmlFor="gift-reason" className="block text-sm font-medium text-ink-800 mb-1.5">Reason (shown to the user, optional)</label>
          <input
            id="gift-reason"
            type="text"
            maxLength={160}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. thanks for helping us test the CV Builder"
            className="input-field"
          />
        </div>
      </div>
    </Modal>
  )
}
