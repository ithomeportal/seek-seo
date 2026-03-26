import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageHero } from '@/components/layout/PageHero'
import { BlogCard } from '@/components/blog/BlogCard'
import { JsonLd } from '@/components/seo/JsonLd'
import { COMPANY } from '@/lib/constants'
import { blogPosts, getBlogPost, getAllBlogSlugs } from '@/data/blog-posts'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    return { title: 'Post Not Found | SEEK Equipment' }
  }

  return {
    title: `${post.title} | SEEK Equipment Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${COMPANY.url}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function renderContent(content: string) {
  const blocks = content.split('\n\n')
  return blocks.map((block, index) => {
    const trimmed = block.trim()
    if (trimmed.startsWith('## ')) {
      return (
        <h2
          key={index}
          className="text-2xl font-bold text-gray-900 mt-10 mb-4"
        >
          {trimmed.replace('## ', '')}
        </h2>
      )
    }
    return (
      <p key={index} className="text-gray-700 leading-relaxed mb-4">
        {trimmed}
      </p>
    )
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: COMPANY.name,
      url: COMPANY.url,
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${COMPANY.url}/blog/${post.slug}`,
    },
  }

  return (
    <>
      <JsonLd data={articleSchema} />

      <PageHero
        title={post.title}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title },
        ]}
      >
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Badge variant="orange">{post.category}</Badge>
          <span className="text-orange-100">{post.author}</span>
          <time dateTime={post.date} className="text-orange-200">
            {formatDate(post.date)}
          </time>
        </div>
      </PageHero>

      {/* Article Content */}
      <section className="py-16 md:py-20">
        <Container>
          <article className="max-w-3xl mx-auto">
            <div className="prose-lg">{renderContent(post.content)}</div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="gray">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </article>
        </Container>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-gray-50">
          <Container>
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-20 text-white bg-brand-orange">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Need a Trailer Rental?
            </h2>
            <p className="mt-4 text-xl text-orange-100">
              SEEK Equipment offers flexible rental and leasing options for
              DryVan, Flatbed, Tanker, Sand Chassis, and Belly Dump trailers.
              Get a free quote today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/quote">
                <Button variant="primary" size="lg">
                  Get a Free Quote
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-brand-blue"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
