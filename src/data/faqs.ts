import type { FAQ } from '@/types'

export interface FAQCategory {
  category: string
  slug: string
  faqs: FAQ[]
}

export const faqCategories: FAQCategory[] = [
  {
    category: 'Rental Terms & Agreements',
    slug: 'rental-terms',
    faqs: [
      {
        question: 'What are your rental term options?',
        answer:
          'We offer flexible lease agreements tailored to your specific project requirements. Our team will work with you to structure terms that align with your operational timeline and business needs.',
      },
      {
        question: 'What is required to rent equipment from SEEK?',
        answer:
          'To initiate a rental agreement, we require a completed credit application, valid business documentation, proof of insurance, and a signed rental contract. Our team will guide you through the process to ensure a smooth onboarding experience.',
      },
      {
        question: 'Do you require a deposit?',
        answer:
          'Deposit requirements vary based on the type of equipment, rental duration, and credit evaluation. Our team will discuss specific deposit terms during the quoting process.',
      },
      {
        question: 'What insurance requirements do you have?',
        answer:
          'All renters are required to maintain comprehensive liability and physical damage insurance covering the rented equipment for the full duration of the rental period. We can provide specific coverage requirements upon request.',
      },
    ],
  },
  {
    category: 'Equipment & Maintenance',
    slug: 'equipment-maintenance',
    faqs: [
      {
        question: 'What types of trailers do you offer?',
        answer:
          'Our fleet includes Sand Chassis, Belly Dumps, Sand Hoppers, Dry Vans, Flat Beds, and Tanks. Each equipment type is maintained to industry standards and inspected before every rental.',
      },
      {
        question: 'How do you maintain your equipment?',
        answer:
          'All equipment undergoes regular preventive maintenance and thorough pre-rental inspections. Our maintenance program includes scheduled service intervals, DOT compliance checks, and comprehensive safety inspections to ensure reliable performance.',
      },
      {
        question: 'What happens if equipment breaks down during my rental?',
        answer:
          'Contact our operations team immediately to report any equipment issues. We will work with you to coordinate a resolution and minimize downtime on your project.',
      },
      {
        question: 'Can I request specific equipment specifications?',
        answer:
          'Yes, we work with clients to match equipment specifications to their operational requirements. Contact our team to discuss your specific needs and we will identify the best units from our fleet.',
      },
    ],
  },
  {
    category: 'Delivery & Logistics',
    slug: 'delivery-logistics',
    faqs: [
      {
        question: 'Do you offer delivery services?',
        answer:
          'Yes, we offer delivery and pickup services via power only units across all states in the continental United States. Delivery and pickup costs are at the expense of the client and will be quoted as part of your lease agreement.',
      },
      {
        question: 'What is your service area?',
        answer:
          'SEEK Equipment Rentals serves the continental United States, with a strong presence in the Permian Basin, Eagle Ford Shale, Bakken Formation, Anadarko Basin, DJ Basin, Powder River Basin, Marcellus Shale, and the San Antonio metropolitan area. We deliver via power only units to any location across the lower 48 states.',
      },
      {
        question: 'How quickly can equipment be available?',
        answer:
          'Equipment availability depends on current fleet utilization as well as receiving complete and accurate customer information so that credit can be processed without delays. In many cases, we can arrange same-day or next-day availability for in-stock units once all documentation is in order. Contact us for current availability on specific equipment types.',
      },
    ],
  },
  {
    category: 'Billing & Payments',
    slug: 'billing-payments',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept ACH transfers and wire transfers. We do not accept credit cards or company checks. Payment terms are established as part of the lease agreement based on credit evaluation.',
      },
      {
        question: 'How does billing work for long-term rentals?',
        answer:
          'Long-term rentals are typically billed on a monthly cycle. Invoices are issued at the beginning of each billing period with net payment terms as specified in your rental agreement.',
      },
      {
        question: 'Are there any additional fees I should be aware of?',
        answer:
          'Potential additional charges may include delivery and pickup fees, cleaning fees for equipment returned in unsatisfactory condition, charges for damage beyond normal wear and tear, and toll charges which are directly billed to the customer. All potential fees are outlined in the lease agreement.',
      },
    ],
  },
]

export function getAllFaqs(): FAQ[] {
  return faqCategories.flatMap((category) => category.faqs)
}

export function getFaqsByCategory(slug: string): FAQ[] {
  const category = faqCategories.find((c) => c.slug === slug)
  return category ? category.faqs : []
}
