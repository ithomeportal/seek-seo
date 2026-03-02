import type { Metadata } from 'next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { BlogCard } from '@/components/blog/BlogCard'
import { blogPosts } from '@/data/blog-posts'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Blog & Resources | SEEK Equipment',
  description:
    'Industry insights, equipment guides, and compliance tips for trailer rental, leasing, and fleet management from the SEEK Equipment team.',
  openGraph: {
    title: 'Blog & Resources | SEEK Equipment',
    description:
      'Industry insights, equipment guides, and compliance tips for trailer rental, leasing, and fleet management.',
    url: `${COMPANY.url}/blog`,
    type: 'website',
  },
}

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-blue text-white py-16 md:py-24">
        <Container>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Blog' },
            ]}
          />
          <h1 className="text-4xl md:text-5xl font-bold mt-4">
            Blog &amp; Resources
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mt-4 max-w-3xl">
            Industry insights, equipment guides, and compliance tips to help you
            make smarter decisions about trailer rental and fleet management.
          </p>
        </Container>
      </section>

      {/* Blog Grid */}
      <section className="py-16 md:py-20">
        <Container>
          <SectionHeading
            title="Latest Articles"
            subtitle="Stay up to date with the latest news and resources from the trailer rental industry."
            centered
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}
