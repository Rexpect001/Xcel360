'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, RotateCcw, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'

/**
 * Draft actions. Active drafts: move to Trash (restorable for 30 days).
 * Trashed drafts: restore, or delete for good.
 */
export default function DeleteDraftButton({ id, title, trashed = false }: { id: string; title: string; trashed?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'delete' | 'restore' | null>(null)

  const remove = async () => {
    setBusy('delete')
    try {
      const res = await fetch(`/api/pro/drafts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success(trashed ? 'Draft deleted for good' : 'Moved to Trash. You can restore it for 30 days.')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Could not delete the draft')
    } finally {
      setBusy(null)
    }
  }

  const restore = async () => {
    setBusy('restore')
    try {
      const res = await fetch(`/api/pro/drafts/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Draft restored to My drafts')
      router.refresh()
    } catch {
      toast.error('Could not restore the draft')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      {trashed && (
        <button
          type="button"
          onClick={restore}
          disabled={!!busy}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-60"
        >
          {busy === 'restore' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Restore
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-700"
        aria-label={trashed ? `Delete ${title} for good` : `Move ${title} to Trash`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={trashed ? 'Delete this draft for good?' : 'Move this draft to Trash?'}
        description={
          trashed
            ? `"${title}" will be removed permanently and cannot be recovered.`
            : `"${title}" moves to Trash. You can restore it for 30 days, then it is deleted automatically.`
        }
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn-light">Cancel</button>
            <button type="button" onClick={remove} disabled={!!busy} className="btn-primary !bg-red-600 hover:!bg-red-700">
              {busy === 'delete' && <Loader2 className="h-4 w-4 animate-spin" />} {trashed ? 'Delete for good' : 'Move to Trash'}
            </button>
          </>
        }
      />
    </div>
  )
}
