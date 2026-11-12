'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, Trash2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'

export default function DeleteDraftButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/pro/drafts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Draft deleted')
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Could not delete the draft')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="p-2 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${title}`}>
        <Trash2 className="h-4 w-4" />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete this draft?"
        description={`"${title}" will be removed for good. Download it first if you still need it.`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="btn-light">Cancel</button>
            <button type="button" onClick={remove} disabled={busy} className="btn-primary !bg-red-600 hover:!bg-red-700">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </>
        }
      />
    </>
  )
}
