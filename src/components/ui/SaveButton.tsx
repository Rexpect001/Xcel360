'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function SaveButton({ opportunityId }: { opportunityId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!session) {
      router.push('/signin')
      return
    }

    setLoading(true)
    try {
      if (saved) {
        const res = await fetch('/api/saved', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunityId }),
        })
        if (!res.ok) throw new Error('Could not remove saved opportunity')
        setSaved(false)
        toast.success('Removed from saved')
      } else {
        const res = await fetch('/api/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opportunityId }),
        })
        if (res.status === 409) {
          setSaved(true)
          toast('Already in your saved list')
        } else if (res.ok) {
          setSaved(true)
          toast.success('Saved! View in your dashboard.')
        } else {
          throw new Error('Could not save opportunity')
        }
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 border-2 px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60 ${
        saved
          ? 'border-brand-600 bg-brand-600 text-white hover:bg-brand-700'
          : 'border-brand-600 text-brand-700 hover:bg-brand-50'
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
