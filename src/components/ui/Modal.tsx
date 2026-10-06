'use client'
import { useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  /** One or two lines under the title explaining what happens next. */
  description?: React.ReactNode
  children?: React.ReactNode
  /** Action row pinned to the bottom of the dialog (Cancel / Confirm). */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          'relative bg-white rounded-3xl shadow-2xl ring-1 ring-ink-900/5 w-full max-h-[90vh] overflow-y-auto animate-pop-in',
          size === 'sm' && 'max-w-md',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-2xl',
          size === 'xl' && 'max-w-4xl',
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-bold text-ink-900">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink-500 leading-relaxed">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-full bg-surface-50 ring-1 ring-surface-200 text-ink-500 hover:bg-surface-100 hover:text-ink-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children ? <div className="p-6">{children}</div> : <div className="h-6" />}
        {footer && <div className={cn('px-6 pb-6 flex flex-wrap items-center justify-end gap-2', children ? '-mt-2' : '')}>{footer}</div>}
      </div>
    </div>
  )
}

/** Grey inset panel of label/value rows, used inside confirmation pop-ups. */
export function ModalSummary({ rows, header }: { rows: { label: string; value: React.ReactNode }[]; header?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-50 ring-1 ring-surface-200 p-1.5">
      {header && <div className="rounded-xl bg-white ring-1 ring-surface-200 px-4 py-3 mb-1">{header}</div>}
      <dl className="divide-y divide-surface-200">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[110px_1fr] gap-3 px-4 py-2.5 text-sm">
            <dt className="text-ink-500">{r.label}</dt>
            <dd className="font-medium text-ink-900 min-w-0">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
