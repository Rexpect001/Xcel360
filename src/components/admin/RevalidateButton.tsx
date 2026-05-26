'use client'
import { useState } from 'react'
import { RefreshCw, CheckCircle } from 'lucide-react'

export default function RevalidateButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')

  const handleClick = async () => {
    setState('loading')
    try {
      await fetch('/api/admin/revalidate', { method: 'POST', body: JSON.stringify({}) })
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
        disabled:opacity-60
        bg-brand-700 text-white hover:bg-brand-800"
    >
      {state === 'done' ? (
        <><CheckCircle className="h-4 w-4" /> Cache Flushed</>
      ) : (
        <><RefreshCw className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} /> Flush Cache Now</>
      )}
    </button>
  )
}
