'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BuyCreditsButton({ packId, label, featured }: { packId: string; label: string; featured?: boolean }) {
  const [busy, setBusy] = useState(false)

  const buy = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Could not start the payment.')
      window.location.href = data.url // Paystack checkout
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start the payment.')
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={buy} disabled={busy} className={cn('w-full', featured ? 'btn-primary' : 'btn-light')}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />} {label}
    </button>
  )
}
