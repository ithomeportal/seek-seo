import type { FAQ } from '@/types'

export interface FAQCategory {
  category: string
  slug: string
  faqs: FAQ[]
}

export const faqCategories: FAQCategory[] = [
  {
    category: 'Rental Process',
    slug: 'rental-process',
    faqs: [
      {
        question: 'How do I rent a trailer from SEEK Equipment?',
        answer:
          'Renting a trailer is simple. Call us at 1-210-802-0000 or email sales@seekequipment.com with your trailer type, desired rental period, and delivery location. Our team will provide a quote and availability within one business day. Once approved, we handle delivery to your site or you can pick up from our yard in Von Ormy, TX.',
      },
      {
        question: 'What documents do I need to rent a trailer?',
        answer:
          'You will need a valid business license or DOT authority, proof of insurance meeting our minimum coverage requirements, and a signed rental agreement. For hazmat trailers such as tankers, additional documentation including hazmat endorsements may be required.',
      },
      {
        question: 'How quickly can I get a trailer delivered?',
        answer:
          'Equipment availability depends on current fleet utilization as well as receiving complete and accurate customer information so that credit can be processed without delays. In many cases, we can arrange same-day or next-day availability for in-stock units once all documentation is in order. Contact us for current availability on specific equipment types.',
      },
      {
        question: 'Do you offer pickup from your yard?',
        answer:
          'Yes, customers are welcome to pick up trailers directly from our yard located at 12330 Interstate 35 Access Rd, Von Ormy, TX 78073. This can reduce costs by eliminating delivery fees. Our yard is easily accessible from I-35 South.',
      },
      {
        question: 'Can I extend my rental period?',
        answer:
          'Yes, rental extensions are easy to arrange. Contact us before your rental period ends and we will update your agreement. If you find yourself needing the trailer longer than expected, we can often convert short-term rentals to longer-term leases at better rates.',
      },
    ],
  },
  {
    category: 'Pricing',
    slug: 'pricing',
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept ACH transfers and wire transfers. We do not accept credit cards or company checks. Payment terms are established as part of the lease agreement based on credit evaluation.',
      },
      {
        question: 'How much does it cost to rent a trailer?',
        answer:
          'Trailer rental rates vary by type, duration, and market conditions. Generally, longer lease terms offer lower per-day rates. Contact SEEK Equipment at 1-210-802-0000 or email sales@seekequipment.com for a personalized quote based on your specific needs.',
      },
      {
        question: 'Do you offer discounts for long-term leases?',
        answer:
          'Yes, we offer significant discounts for 6-month and 12-month lease commitments. Long-term customers also benefit from priority availability, dedicated account management, and flexible end-of-lease options. Contact us to discuss volume and term-based pricing.',
      },
      {
        question: 'Is there a deposit required?',
        answer:
          'A security deposit is required for most rentals. The deposit amount depends on the trailer type and rental term. Deposits are fully refundable upon return of the trailer in the same condition it was delivered, minus normal wear and tear.',
      },
      {
        question: 'Are delivery fees included in the rental price?',
        answer:
          'Delivery and pickup fees are quoted separately. We offer delivery and pickup services via power only units across all states in the continental United States. Delivery and pickup costs are at the expense of the client and will be quoted as part of your lease agreement.',
      },
      {
        question: 'Are there any additional fees I should be aware of?',
        answer:
          'Potential additional charges may include delivery and pickup fees, cleaning fees for equipment returned in unsatisfactory condition, charges for damage beyond normal wear and tear, and toll charges which are directly billed to the customer. All potential fees are outlined in the lease agreement.',
      },
    ],
  },
  {
    category: 'Trailer Types',
    slug: 'trailer-types',
    faqs: [
      {
        question: 'What types of trailers does SEEK Equipment offer?',
        answer:
          'Our fleet includes six trailer types: DryVan trailers for general freight and storage, Tanker trailers for liquid and chemical transport, Flatbed trailers for oversized loads and construction materials, Sand Chassis for oilfield frac sand operations, Sand Hoppers for dry bulk material transport and discharge, and Belly Dump trailers for aggregate and construction material hauling. Each equipment type is maintained to industry standards and inspected before every rental.',
      },
      {
        question: 'How do I choose the right trailer type for my needs?',
        answer:
          'The right trailer depends on what you are hauling. Dry vans work best for enclosed general freight and storage. Flatbeds handle oversized or heavy equipment. Tankers are for liquid transport. Sand chassis are purpose-built for oilfield sand containers. Belly dumps excel at spreading aggregate and construction materials. Our team at SEEK Equipment can help you select the right trailer for your application.',
      },
      {
        question: 'Do you have specialized trailers for oilfield operations?',
        answer:
          'Yes, we specialize in oilfield equipment including sand chassis trailers for hauling frac sand containers and sand hopper trailers for dry bulk material transport. Our equipment is built for the demanding conditions of well sites and lease roads throughout the Permian Basin, Eagle Ford Shale, Bakken Formation, Anadarko Basin, DJ Basin, Powder River Basin, Marcellus Shale, and other major operating regions.',
      },
      {
        question: 'Can I rent multiple trailer types at once?',
        answer:
          'Absolutely. Many of our customers operate mixed fleets and rent multiple trailer types simultaneously. We offer fleet pricing for customers renting three or more units. Contact our sales team to discuss a customized fleet package.',
      },
    ],
  },
  {
    category: 'Maintenance & Condition',
    slug: 'maintenance',
    faqs: [
      {
        question: 'What condition are the rental trailers in?',
        answer:
          'All SEEK Equipment trailers are thoroughly inspected before each rental period. We perform safety checks including brakes, tires, lights, structural integrity, and DOT compliance items. Our fleet includes both newer and well-kept units, and we stand behind the road-readiness of every trailer we deliver.',
      },
      {
        question: 'Who is responsible for maintenance during the rental period?',
        answer:
          'The renter is responsible for routine care including daily pre-trip inspections, tire pressure checks, and reporting any issues promptly. Maintenance responsibilities and terms are outlined in your rental or lease agreement. Contact us at 1-210-802-0000 for questions about your specific agreement terms.',
      },
      {
        question: 'What happens if a trailer breaks down during my rental?',
        answer:
          'Contact us immediately at 1-210-802-0000. For mechanical failures not caused by misuse, we will arrange roadside service or provide a replacement trailer as quickly as possible. We have partnerships with service providers across Texas to minimize your downtime.',
      },
      {
        question: 'Am I responsible for damage to the trailer?',
        answer:
          'Renters are responsible for damage beyond normal wear and tear during the rental period. This includes damage from overloading, accidents, misuse, or negligence. We conduct a joint inspection at delivery and return to document the trailer condition. Adequate insurance coverage is required for all rentals.',
      },
    ],
  },
  {
    category: 'Compliance & Insurance',
    slug: 'compliance',
    faqs: [
      {
        question: 'Are your trailers DOT compliant?',
        answer:
          'Yes, every trailer in our fleet meets current DOT and FMCSA safety standards. We maintain inspection records and ensure all required safety equipment including lights, reflectors, brakes, and tires meet or exceed regulatory requirements. Our tanker trailers carry specific DOT certifications for hazmat transport.',
      },
      {
        question: 'What insurance do I need to rent a trailer?',
        answer:
          'Renters must carry commercial auto liability insurance and physical damage coverage on the rented trailer. Minimum coverage requirements are specified in our rental agreement. We recommend consulting with your insurance provider to ensure your policy covers rented or leased trailers.',
      },
      {
        question:
          'Do you provide annual inspection certificates with the trailers?',
        answer:
          'Yes, all trailers leave our yard with current annual inspection certificates as required by FMCSA regulations. For long-term leases, we coordinate annual inspections to ensure your trailer stays compliant throughout the lease term.',
      },
      {
        question: 'What are the weight limits for your trailers?',
        answer:
          'Maximum payload capacity varies by trailer type. Dry vans carry up to 45,000 lbs, flatbeds up to 48,000 lbs, tankers up to 50,000 lbs, sand chassis up to 52,000 lbs gross, and belly dumps up to 50,000 lbs. Actual legal weight limits depend on your route, axle configuration, and state regulations. Our team can help you understand weight limits for your specific operation.',
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
