import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'live' | 'free' | 'premium' | 'verified' | 'default'
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
      'font-body tracking-wide uppercase',

      variant === 'live' && 'bg-red-500/10 text-red-400 border border-red-500/20',
      variant === 'free' && 'bg-green-500/10 text-green-400 border border-green-500/20',
      variant === 'premium' && 'bg-accent/10 text-accent border border-accent/20',
      variant === 'verified' && 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      variant === 'default' && 'bg-bg-elevated text-text-secondary border border-border',

      className
    )}>
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
      )}
      {children}
    </span>
  )
}