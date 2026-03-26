import type { Service } from '@/types'

export const services: Service[] = [
  {
    slug: 'sand-chassis',
    title: 'Sand Chassis',
    shortTitle: 'Sand Chassis',
    description:
      'Purpose-built chassis designed for transporting frac sand containers to and from well sites.',
    heroDescription:
      'Purpose-built chassis designed for transporting frac sand containers to and from well sites.',
    features: [
      'Compatible with standard frac sand containers',
      'Reinforced steel frame construction',
      'Heavy-duty tandem axle suspension',
      'Quick-connect container locking system',
      'DOT compliant lighting and safety equipment',
      'Anti-lock braking system (ABS)',
    ],
    applications: [
      'Hydraulic fracturing operations',
      'Oilfield proppant logistics',
      'Sand mine to well site transport',
      'Container yard operations',
    ],
    overview:
      'Our sand chassis trailers are purpose-built for the demanding requirements of oilfield proppant logistics. Engineered to transport frac sand containers efficiently and safely, these chassis feature reinforced frames, heavy-duty suspension systems, and compatibility with standard sand containers. Ideal for hydraulic fracturing operations, our sand chassis fleet ensures reliable delivery of proppant materials to well sites across any Basin or Shale across the country.',
  },
  {
    slug: 'belly-dumps',
    title: 'Belly Dumps',
    shortTitle: 'Belly Dumps',
    description:
      'High-capacity bottom-discharge trailers for efficient bulk material transport and unloading.',
    heroDescription:
      'High-capacity bottom-discharge trailers for efficient bulk material transport and unloading.',
    features: [
      'High-capacity clamshell bottom gates',
      'Reinforced tub body construction',
      'Air-operated gate controls',
      'Heavy-duty tandem or tridem axle configurations',
      'Sloped interior for complete material discharge',
      'Durable abrasion-resistant steel lining',
    ],
    applications: [
      'Aggregate and gravel hauling',
      'Road construction and paving',
      'Mining operations',
      'Bulk material distribution',
      'Hydraulic fracturing operations',
      'Oilfield proppant logistics',
      'Sand mine to well site transport',
    ],
    overview:
      "SEEK Equipment's belly dump trailers provide efficient, high-volume material transport with rapid bottom-discharge capability. These trailers are engineered for construction, mining, and aggregate operations where quick unloading is essential. The clamshell gate design allows precise material placement while maintaining continuous forward motion, significantly reducing cycle times and increasing operational productivity.",
  },
  {
    slug: 'sand-hoppers',
    title: 'Sand Hoppers',
    shortTitle: 'Sand Hoppers',
    description:
      'Specialized trailers for bulk sand and dry material transport with gravity discharge.',
    heroDescription:
      'Specialized trailers for bulk sand and dry material transport with gravity discharge.',
    features: [
      'High-capacity hopper design',
      'Reinforced vessel construction',
      'Multiple discharge points',
      'Heavy-duty frame and suspension',
    ],
    applications: [
      'Frac sand delivery to well sites',
      'Cement and fly ash transport',
      'Dry bulk material logistics',
      'Industrial material handling',
    ],
    overview:
      'Our sand hopper trailers are specialized vessels designed for the efficient transport and discharge of dry bulk materials including frac sand, cement, and fly ash. These trailers enable rapid unloading at well sites and industrial facilities. Built to withstand the rigors of oilfield service, our sand hoppers maintain consistent performance across demanding terrain and operating conditions.',
  },
  {
    slug: 'dry-vans',
    title: 'Dry Vans',
    shortTitle: 'Dry Vans',
    description:
      'Enclosed trailers providing secure, weather-protected transport for a wide range of cargo.',
    heroDescription:
      'Enclosed trailers providing secure, weather-protected transport for a wide range of cargo.',
    features: [
      'Fully enclosed cargo area',
      'Swing or roll-up rear doors',
      'Reinforced composite wall panels',
      'Hardwood or composite flooring',
      'Interior tie-down points',
      'LED interior lighting',
    ],
    applications: [
      'General freight transport',
      'Manufactured goods delivery',
      'Retail distribution',
      'Industrial supply chain logistics',
    ],
    overview:
      "SEEK Equipment's dry van trailers offer versatile, enclosed transport solutions for a broad range of commercial and industrial applications. These fully enclosed trailers protect cargo from weather, road debris, and theft, making them ideal for general freight, manufactured goods, and sensitive materials. Our dry van fleet features modern construction with reinforced walls, secure locking systems, and efficient loading configurations.",
  },
  {
    slug: 'flatbeds',
    title: 'Flat Beds',
    shortTitle: 'Flat Beds',
    description:
      'Open-deck trailers for oversized, heavy, and irregularly shaped cargo requiring crane or forklift loading.',
    heroDescription:
      'Open-deck trailers for oversized, heavy, and irregularly shaped cargo requiring crane or forklift loading.',
    features: [
      'Open deck design for versatile loading',
      'High-strength steel frame construction',
      'Multiple stake pocket and tie-down points',
      'Aluminum or steel deck options',
      'Tandem or spread axle configurations',
      'Rub rails and corner protectors',
    ],
    applications: [
      'Construction material transport',
      'Heavy machinery hauling',
      'Steel and lumber delivery',
      'Oversized cargo logistics',
    ],
    overview:
      "Our flatbed trailers provide the versatility needed for transporting oversized, heavy, and irregularly shaped cargo. With an open deck design, these trailers accommodate crane loading, forklift access from multiple sides, and secure tie-down of diverse load configurations. SEEK Equipment's flatbed fleet is maintained to the highest standards, ensuring safe and reliable transport of construction materials, machinery, steel, and other industrial cargo.",
  },
  {
    slug: 'tanks',
    title: 'Tanks',
    shortTitle: 'Tanks',
    description:
      'Aluminum DOT 407 tank trailers for fuel, crude oil, and industrial liquid transport with up to 8,000-gallon capacity.',
    heroDescription:
      'Aluminum DOT 407 tank trailers for fuel, crude oil, and industrial liquid transport with up to 8,000-gallon capacity.',
    features: [
      'DOT-specification construction',
      'Single or multi-compartment configurations',
      'Vapor recovery systems',
      'Emergency shut-off valves',
      'Anti-surge baffles',
      'Polished aluminum construction up to 8,000-gallon capacity',
    ],
    applications: [
      'Petroleum product transport',
      'Produced water hauling',
      'Industrial fluid logistics',
      'Chemical transport services',
    ],
    overview:
      "SEEK Equipment's aluminum tank trailers are engineered for the safe and efficient transport of fuel, crude oil, produced water, and industrial fluids. Our DOT 407-compliant fleet features polished aluminum construction with capacities up to 8,000 gallons, offering superior corrosion resistance and optimal payload efficiency. Built with multiple compartment options and comprehensive safety systems, each unit undergoes regular inspection and maintenance to ensure compliance with all applicable regulations and operational safety standards.",
  },
]

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}

export function getAllServiceSlugs(): string[] {
  return services.map((s) => s.slug)
}
