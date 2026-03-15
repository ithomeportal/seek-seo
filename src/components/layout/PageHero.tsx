import { Container } from '@/components/ui/Container'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageHeroProps {
  title: string
  description?: string
  breadcrumbs: BreadcrumbItem[]
  icon?: React.ReactNode
  children?: React.ReactNode
}

export function PageHero({
  title,
  description,
  breadcrumbs,
  icon,
  children,
}: PageHeroProps) {
  return (
    <section className="bg-gradient-to-br from-brand-blue to-brand-blue/90 text-white py-16">
      <Container>
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-4 max-w-3xl">
          {icon ? (
            <div className="flex items-center gap-3">
              {icon}
              <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
            </div>
          ) : (
            <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
          )}
          {description && (
            <p className="text-xl text-blue-100 mt-4">{description}</p>
          )}
          {children}
        </div>
      </Container>
    </section>
  )
}
