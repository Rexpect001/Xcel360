'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SquareKanban, PenLine, CalendarClock, ArrowRight } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const STORAGE_KEY = 'xcel-dashboard-welcome-v1'

const STEPS = [
  { Icon: SquareKanban, tone: 'bg-brand-50 text-brand-600', title: 'Track every application', text: 'Save scholarships, then move them from Saved to Result in your pipeline.' },
  { Icon: PenLine, tone: 'bg-violet-50 text-violet-600', title: 'Write with AI', text: 'Build your CV, SOP, cover letters and cold emails in minutes.' },
  { Icon: CalendarClock, tone: 'bg-amber-50 text-amber-600', title: 'Never miss a deadline', text: 'Deadlines you save show up here with reminders before they close.' },
]

/** Shown once per browser the first time someone opens their dashboard. */
export default function DashboardWelcome({ firstName }: { firstName: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
    } catch {
      // Storage blocked (private mode): skip the tour rather than show it on every visit.
    }
  }, [])

  function close() {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title={`Welcome to Xcel360, ${firstName}`}
      description="Your dashboard keeps your whole scholarship journey in one place."
      footer={
        <>
          <Link href="/dashboard/saved" onClick={close} className="rounded-full px-5 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-surface-200 hover:bg-surface-50">
            Open my pipeline
          </Link>
          <button type="button" onClick={close} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            See my matches <ArrowRight className="h-4 w-4" />
          </button>
        </>
      }
    >
      <ul className="rounded-2xl bg-surface-50 ring-1 ring-surface-200 p-1.5 space-y-1">
        {STEPS.map(({ Icon, tone, title, text }) => (
          <li key={title} className="flex items-start gap-3 rounded-xl bg-white ring-1 ring-surface-200 px-4 py-3">
            <span className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${tone}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink-900">{title}</span>
              <span className="block text-sm text-ink-500">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
