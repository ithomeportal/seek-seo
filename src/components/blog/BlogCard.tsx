import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BlogPost } from '@/types'

interface BlogCardProps {
  post: BlogPost
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card hover className="flex flex-col h-full">
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3">
          <Badge variant="blue">{post.category}</Badge>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-brand-blue transition-colors"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-gray-600 leading-relaxed flex-1">{post.excerpt}</p>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{post.author}</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
    </Card>
  )
}
