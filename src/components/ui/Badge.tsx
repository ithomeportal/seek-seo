import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'orange' | 'gray'
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  blue: 'bg-brand-blue/10 text-brand-blue',
  orange: 'bg-brand-orange/10 text-brand-orange',
  gray: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, variant = 'blue' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block px-3 py-1 text-sm font-medium rounded-full',
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  )
}
