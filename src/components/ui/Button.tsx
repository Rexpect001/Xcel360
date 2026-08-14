'use client'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  href?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  href,
  disabled,
  loading,
  className,
  type = 'button',
  fullWidth,
}: ButtonProps) {
  const base = cn(
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    {
      'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm hover:shadow-md': variant === 'primary',
      'border-2 border-brand-700 text-brand-700 hover:bg-brand-50': variant === 'secondary',
      'text-gray-600 hover:bg-surface-100': variant === 'ghost',
      'bg-danger-600 text-white hover:bg-danger-700': variant === 'danger',
      'px-3 py-1.5 text-xs': size === 'sm',
      'px-5 py-2.5 text-sm': size === 'md',
      'px-8 py-4 text-base': size === 'lg',
      'w-full': fullWidth,
    },
    className
  )

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={base}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
