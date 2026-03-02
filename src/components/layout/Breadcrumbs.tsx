import Link from 'next/link'
import { COMPANY } from '@/lib/constants'
import { JsonLd } from '@/components/seo/JsonLd'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${COMPANY.url}${item.href}` } : {}),
    })),
  }

  return (
    <>
      <JsonLd data={jsonLdData} />
      <nav aria-label="Breadcrumb" className="py-3 text-sm text-gray-500">
        <ol className="flex items-center flex-wrap gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={item.label} className="flex items-center gap-1">
                {index > 0 && (
                  <span className="mx-1 text-gray-400" aria-hidden="true">
                    &gt;
                  </span>
                )}
                {isLast || !item.href ? (
                  <span className="text-gray-700 font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-[#35668d] transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
