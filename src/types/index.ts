export interface Service {
  slug: string
  title: string
  shortTitle: string
  description: string
  heroDescription: string
  features: string[]
  applications: string[]
  overview: string
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
