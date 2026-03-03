import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'orange' | 'gray' | 'white'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  blue: 'bg-brand-blue/10 text-brand-blue',
  orange: 'bg-brand-orange/10 text-brand-orange font-semibold',
  gray: 'bg-gray-100 text-gray-600',
  white: 'bg-white/15 text-white backdrop-blur-sm',
}

export function Badge({ children, variant = 'blue' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full',
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  )
}
