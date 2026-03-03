import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden group',
        hover &&
          'hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 ease-out',
        className
      )}
    >
      {children}
    </div>
  )
}
