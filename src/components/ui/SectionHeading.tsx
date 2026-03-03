import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  centered?: boolean
  as?: 'h1' | 'h2' | 'h3'
  light?: boolean
}

export function SectionHeading({
  title,
  subtitle,
  centered = false,
  as: Tag = 'h2',
  light = false,
}: SectionHeadingProps) {
  return (
    <div className={cn(centered && 'text-center')}>
      <Tag
        className={cn(
          'text-3xl md:text-4xl font-extrabold tracking-tight leading-tight',
          light ? 'text-white' : 'text-gray-900'
        )}
      >
        {title}
      </Tag>
      <div
        className={cn(
          'mt-4 flex items-center gap-1',
          centered && 'justify-center'
        )}
      >
        <div className="w-10 h-1 bg-brand-orange rounded-full" />
        <div className="w-3 h-1 bg-brand-orange/40 rounded-full" />
      </div>
      {subtitle && (
        <p
          className={cn(
            'text-lg mt-4 leading-relaxed',
            light ? 'text-white/70' : 'text-gray-500',
            centered && 'mx-auto max-w-2xl'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
