import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  centered?: boolean
  as?: 'h1' | 'h2' | 'h3'
}

export function SectionHeading({
  title,
  subtitle,
  centered = false,
  as: Tag = 'h2',
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && 'text-center')}>
      <Tag className="text-3xl md:text-4xl font-bold text-gray-900">
        {title}
      </Tag>
      <div
        className={cn(
          'w-16 h-1 bg-brand-orange rounded mt-4',
          centered && 'mx-auto'
        )}
      />
      {subtitle && (
        <p
          className={cn(
            'text-lg text-gray-600 mt-4',
            centered && 'mx-auto max-w-3xl'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
