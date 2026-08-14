import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'gray' | 'red' | 'purple' | 'yellow'
  className?: string
}

const variantClasses = {
  blue: 'bg-brand-100 text-brand-700',
  green: 'bg-success-100 text-success-700',
  orange: 'bg-warning-100 text-warning-700',
  gray: 'bg-surface-100 text-surface-700',
  red: 'bg-danger-100 text-danger-700',
  purple: 'bg-indigo-100 text-indigo-700',
  yellow: 'bg-amber-100 text-amber-700',
}

export default function Badge({ children, variant = 'blue', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
