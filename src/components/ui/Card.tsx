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
        'bg-white rounded-xl shadow-md overflow-hidden group',
        hover && 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  )
}
