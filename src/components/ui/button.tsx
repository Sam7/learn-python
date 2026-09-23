import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-white shadow-[0_2px_0_rgba(31,42,42,0.12)] hover:bg-ink/90 focus-visible:ring-ink',
  secondary:
    'border border-line bg-white text-ink hover:border-teal hover:bg-mist focus-visible:ring-teal',
  ghost: 'text-ink/70 hover:bg-mist hover:text-ink focus-visible:ring-teal',
  quiet: 'text-ink/60 hover:bg-mist/70 hover:text-ink focus-visible:ring-teal',
  danger:
    'border border-coral/30 bg-coral/5 text-coral hover:border-coral/60 hover:bg-coral/10 focus-visible:ring-coral',
}

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
}

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
