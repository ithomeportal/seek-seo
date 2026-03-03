import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-orange text-white shadow-lg shadow-brand-orange/25 hover:bg-brand-orange-dark hover:shadow-xl hover:shadow-brand-orange/30 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-brand-blue text-white shadow-lg shadow-brand-blue/25 hover:bg-brand-blue-dark hover:shadow-xl hover:shadow-brand-blue/30 hover:-translate-y-0.5 active:translate-y-0',
  outline:
    'border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white hover:-translate-y-0.5 active:translate-y-0',
  ghost: 'text-brand-blue hover:bg-brand-blue/5',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', asChild = false, className, children, ...props },
  ref
) {
  const classes = cn(
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    variantStyles[variant],
    sizeStyles[size],
    className
  )

  if (asChild) {
    return <span className={classes}>{children}</span>
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})

export { Button }
export type { ButtonProps }
