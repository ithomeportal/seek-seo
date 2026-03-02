import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asChild?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-orange text-white hover:bg-brand-orange-dark',
  secondary: 'bg-brand-blue text-white hover:bg-brand-blue-dark',
  outline:
    'border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white',
  ghost: 'text-brand-blue hover:bg-gray-100',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3',
  lg: 'px-8 py-4 text-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', asChild = false, className, children, ...props },
  ref
) {
  const classes = cn(
    'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
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
