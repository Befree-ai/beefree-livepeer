import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          // Base
          'inline-flex items-center justify-center font-body font-medium',
          'transition-all duration-150 ease-out',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',

          // Sizes
          size === 'sm' && 'text-sm px-3 py-1.5 rounded-md gap-1.5',
          size === 'md' && 'text-sm px-4 py-2.5 rounded-lg gap-2',
          size === 'lg' && 'text-base px-6 py-3 rounded-lg gap-2',

          // Variants
          variant === 'primary' && [
            'bg-accent text-black',
            'hover:bg-accent/90 active:scale-[0.98]',
          ],
          variant === 'secondary' && [
            'bg-bg-elevated text-text-primary border border-border',
            'hover:border-border-hover hover:bg-bg-elevated/80 active:scale-[0.98]',
          ],
          variant === 'ghost' && [
            'bg-transparent text-text-secondary',
            'hover:text-text-primary hover:bg-bg-elevated active:scale-[0.98]',
          ],
          variant === 'danger' && [
            'bg-red-500/10 text-red-400 border border-red-500/20',
            'hover:bg-red-500/20 active:scale-[0.98]',
          ],

          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{children}</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button