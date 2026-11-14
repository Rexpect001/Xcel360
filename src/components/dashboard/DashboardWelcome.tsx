'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SquareKanban, PenLine, CalendarClock, ArrowRight, Gift, Sparkles } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const STEPS = [
  { Icon: SquareKanban, tone: 'bg-brand-50 text-brand-700', title: 'Track every application', text: 'Save scholarships, then move them from Saved to Result in your pipeline.' },
  { Icon: PenLine, tone: 'bg-violet-50 text-violet-700', title: 'Write with AI', text: 'Build an academic or job CV, SOPs and cover letters in minutes.' },
  { Icon: CalendarClock, tone: 'bg-amber-50 text-amber-700', title: 'Never miss a deadline', text: 'Deadlines you save show up under Notifications with reminders before they close.' },
]

/** Platform updates. Edit when something ships; returning users see this once a month. */
const WHATS_NEW = [
  { Icon: Sparkles, text: 'CV Builder now has two tracks: Academic CV and Job / Industry CV.' },
  { Icon: Gift, text: 'Invite a friend with your link and you both get 50 free AI credits.' },
  { Icon: PenLine, text: 'AI drafts stay in your workspace for 30 days, then sit in Trash for 30 more so you can restore them.' },
]

/** Shown on a user's first dashboard visit and then at most once every 30 days (decided on the server). */
export default function DashboardWelcome({ firstName, show, returning }: { firstName: string; show: boolean; returning: boolean }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (show) setOpen(true)
  }, [show])

  function close() {
    setOpen(false)
    fetch('/api/me/welcome-seen', { method: 'POST' }).catch(() => {})
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title={returning ? `What's new on Xcel360, ${firstName}` : `Welcome to Xcel360, ${firstName}`}
      description={returning ? 'A quick update on what changed this month.' : 'Your dashboard keeps your whole scholarship journey in one place.'}
      footer={
        <>
          <Link href={returning ? '/dashboard/billing' : '/dashboard/saved'} onClick={close} className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-surface-200 hover:bg-surface-50">
            {returning ? 'See my credits' : 'Open my pipeline'}
          </Link>
          <button type="button" onClick={close} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            See my matches <ArrowRight className="h-4 w-4" />
          </button>
        </>
      }
    >
      {!returning && (
        <ul className="rounded-2xl bg-surface-50 ring-1 ring-surface-200 p-1.5 space-y-1">
          {STEPS.map(({ Icon, tone, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-xl bg-white ring-1 ring-surface-200 px-4 py-3">
              <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${tone}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink-900">{title}</span>
                <span className="block text-sm text-ink-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className={returning ? '' : 'mt-4'}>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-600 mb-2">What&apos;s new</p>
        <ul className="space-y-2">
          {WHATS_NEW.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5 text-sm text-ink-800">
              <Icon className="h-4 w-4 mt-0.5 text-brand-700 shrink-0" /> {text}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
