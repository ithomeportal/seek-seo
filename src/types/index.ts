export interface Service {
  slug: string
  title: string
  shortTitle: string
  description: string
  heroDescription: string
  features: string[]
  specs: Record<string, string>
  faqs: { question: string; answer: string }[]
  metaTitle: string
  metaDescription: string
}

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  category: string
  image?: string
  tags: string[]
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

export interface FAQ {
  question: string
  answer: string
}
