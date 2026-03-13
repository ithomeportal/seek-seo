import type { Service } from '@/types'

export const services: Service[] = [
  {
    slug: 'dryvan',
    title: 'DryVan Trailer Rental & Leasing',
    shortTitle: 'DryVan Trailers',
    description:
      'SEEK Equipment offers 53-foot dry van trailers for rent and lease across Texas. Our dry vans are ideal for general freight, retail goods, consumer products, and warehousing overflow. Available for short-term rental or long-term leasing with flexible terms.',
    heroDescription:
      'Reliable 53-foot dry van trailers for general freight, retail distribution, and storage. Rent or lease with flexible terms from our 250+ trailer fleet in San Antonio, TX.',
    features: [
      'Standard 53-foot length with 3,000+ cubic feet of cargo space',
      'Swing doors and optional roll-up rear doors available',
      'Hardwood or aluminum flooring options for varied cargo needs',
      'Logistic post and E-track interior systems for secure load management',
      'LED interior lighting and reflective DOT tape for safety compliance',
      'Available for temporary storage and warehousing overflow',
      'GPS tracking available on select units',
    ],
    specs: {
      Length: "53'",
      Width: '102"',
      'Interior Height': '110"',
      'Door Width': '101.5"',
      'Door Height': '108"',
      'Max Payload': '45,000 lbs',
      'Floor Type': 'Hardwood or aluminum',
      'Cubic Capacity': '3,489 cu ft',
      'Rear Door': 'Swing or roll-up',
      Suspension: 'Air ride',
    },
    faqs: [
      {
        question: 'What size dry van trailers does SEEK Equipment offer?',
        answer:
          'We offer standard 53-foot dry van trailers with 102-inch width and 110-inch interior height. These are the industry-standard size used by most freight carriers and provide approximately 3,489 cubic feet of cargo space.',
      },
      {
        question: 'Can I use a dry van trailer for temporary storage?',
        answer:
          'Yes, many of our customers rent dry van trailers for temporary storage during peak seasons, facility renovations, or inventory overflow. Our trailers are weatherproof and secure, making them an excellent portable storage solution.',
      },
      {
        question: 'What are the rental terms for dry van trailers?',
        answer:
          'We offer flexible rental terms including daily, weekly, monthly, 6-month, and 12-month leases. Long-term leases come with discounted rates. Contact us at 1-210-802-0000 for a custom quote.',
      },
      {
        question: 'Do you deliver dry van trailers to my location?',
        answer:
          'Yes, SEEK Equipment provides delivery and pickup services throughout Texas and surrounding states. Delivery fees vary by distance from our yard in Von Ormy, TX. We also offer drop-and-hook service for fleet customers.',
      },
      {
        question: 'What condition are the dry van trailers in?',
        answer:
          'All SEEK Equipment trailers undergo thorough DOT inspection before each rental. Our fleet includes both newer and well-kept older units. We ensure every trailer meets safety standards and is road-ready upon delivery.',
      },
      {
        question: 'Do dry van trailers come with load securement equipment?',
        answer:
          'Our dry van trailers are equipped with logistic posts, E-track rails, and load bars depending on the unit. If you need specific securement configurations, let us know at the time of booking and we will match you with the right trailer.',
      },
    ],
    metaTitle:
      'DryVan Trailer Rental & Leasing | 53ft Trailers | SEEK Equipment',
    metaDescription:
      'Rent or lease 53-foot dry van trailers from SEEK Equipment in San Antonio, TX. Flexible terms, DOT-compliant fleet, delivery available. Call 1-210-802-0000.',
  },
  {
    slug: 'tanker',
    title: 'Tanker Trailer Rental & Leasing',
    shortTitle: 'Tanker Trailers',
    description:
      'SEEK Equipment provides tanker trailers for transporting liquids, chemicals, and petroleum products across Texas and beyond. Our tanker fleet meets DOT and FMCSA regulations for safe transport of hazardous and non-hazardous liquids.',
    heroDescription:
      'DOT-compliant tanker trailers for liquid transport including petroleum, chemicals, and water. Aluminum and stainless steel options with flexible rental and leasing terms.',
    features: [
      'Aluminum and stainless steel tank construction options',
      'Single and multi-compartment configurations available',
      'DOT 407 and DOT 412 certified units for hazmat transport',
      'Bottom loading and top loading capability',
      'Vapor recovery systems on select units',
      'Internal baffles for surge protection during transport',
      'Emergency shut-off valves and spill containment features',
      'FMCSA-compliant with current inspection certificates',
    ],
    specs: {
      Capacity: '6,500 - 9,500 gallons',
      Material: 'Aluminum or stainless steel',
      Compartments: '1 to 5 compartments',
      'DOT Rating': 'DOT 407 / DOT 412',
      'Max Payload': '50,000 lbs',
      Valves: '3" or 4" API valves',
      'Vapor Recovery': 'Available on select units',
      Insulation: 'Optional insulated models',
      Axles: 'Tandem or tridem axle configurations',
      Suspension: 'Air ride',
    },
    faqs: [
      {
        question: 'What types of liquids can your tanker trailers transport?',
        answer:
          'Our tanker trailers can transport a wide range of liquids including petroleum products, crude oil, water, chemicals, food-grade liquids, and other hazardous and non-hazardous materials. We have DOT 407 and DOT 412 certified units to meet various transport requirements.',
      },
      {
        question:
          'Are your tanker trailers DOT compliant for hazmat transport?',
        answer:
          'Yes, our tanker trailers meet all DOT and FMCSA regulations for hazardous materials transport. Each unit carries current inspection certificates, and we maintain full compliance documentation. Our fleet includes both DOT 407 (general chemical) and DOT 412 (corrosive material) rated tankers.',
      },
      {
        question: 'Do you offer multi-compartment tanker trailers?',
        answer:
          'Yes, we have tanker trailers with 1 to 5 compartments, allowing you to haul multiple products in a single trip. Multi-compartment tankers are popular for fuel distribution and chemical transport operations.',
      },
      {
        question: 'What capacity tanker trailers are available?',
        answer:
          'Our tanker trailers range from 6,500 to 9,500 gallons capacity. The exact capacity depends on the product being hauled, the number of compartments, and the weight regulations for your route.',
      },
      {
        question: 'Do tanker trailers require special permits to operate?',
        answer:
          'Operating tanker trailers may require hazmat endorsements on CDL licenses and specific permits depending on the cargo. SEEK Equipment provides all necessary trailer documentation, but the driver and carrier are responsible for their own licensing and permits.',
      },
    ],
    metaTitle:
      'Tanker Trailer Rental & Leasing | DOT Compliant | SEEK Equipment',
    metaDescription:
      'Rent or lease DOT-compliant tanker trailers for liquid transport. Aluminum and stainless steel tanks, 6,500-9,500 gallon capacity. Call SEEK Equipment at 1-210-802-0000.',
  },
  {
    slug: 'flatbed',
    title: 'Flatbed Trailer Rental & Leasing',
    shortTitle: 'Flatbed Trailers',
    description:
      'SEEK Equipment rents and leases flatbed trailers for hauling oversized loads, construction materials, machinery, and equipment across Texas. Our flatbed fleet includes standard, step deck, and combo configurations.',
    heroDescription:
      'Heavy-duty flatbed trailers for construction materials, equipment, and oversized loads. Standard and step deck options with flexible rental and leasing from San Antonio, TX.',
    features: [
      'Standard flatbed and step deck configurations available',
      'High-tensile steel deck construction for durability',
      'Multiple tie-down points with winches and rub rails',
      'Removable headboard rack for versatile loading',
      'Coil package and pipe stake options available',
      'Wide load compatible with proper permitting',
      'Aluminum and steel combo trailers for reduced tare weight',
      'Sliding tandems for flexible weight distribution',
    ],
    specs: {
      Length: "48' or 53'",
      Width: '102"',
      'Deck Height': '60" (standard) / 42" (step deck)',
      'Max Payload': '48,000 lbs',
      'Tie-Downs': '16+ winches with rub rails',
      'Deck Material': 'Steel or aluminum',
      Axles: 'Tandem axle spread',
      Suspension: 'Air ride',
      Headboard: 'Removable steel headboard',
      'King Pin': '2" SAE king pin',
    },
    faqs: [
      {
        question: 'What types of flatbed trailers does SEEK Equipment offer?',
        answer:
          'We offer standard flatbed trailers, step deck (drop deck) trailers, and combo flatbeds. Standard flatbeds are available in 48-foot and 53-foot lengths. Step decks provide a lower deck height for taller cargo that needs to stay under height limits.',
      },
      {
        question: 'What is the weight capacity of your flatbed trailers?',
        answer:
          'Our flatbed trailers have a maximum payload capacity of up to 48,000 lbs, depending on the configuration and axle setup. For oversized or overweight loads, we can help you find the right trailer and discuss permit requirements.',
      },
      {
        question:
          'Do flatbed trailers come with tie-down and securement equipment?',
        answer:
          'Yes, our flatbed trailers are equipped with winches, rub rails, and chain tie-down points along the deck. Most units have 16 or more tie-down points. We recommend carriers also bring their own straps, chains, and binders appropriate for their specific cargo.',
      },
      {
        question: 'Can I use a flatbed trailer for construction materials?',
        answer:
          'Absolutely. Flatbed trailers are the go-to choice for hauling lumber, steel beams, concrete products, roofing materials, and heavy construction equipment. The open deck design allows easy loading and unloading with forklifts or cranes from any side.',
      },
      {
        question:
          'What is the difference between a standard flatbed and a step deck?',
        answer:
          'A standard flatbed has a uniform deck height of about 60 inches, suitable for most general freight. A step deck (drop deck) has a lower rear section at about 42 inches, which allows you to haul taller loads while staying under the standard 13\'6" height limit for most roads.',
      },
    ],
    metaTitle:
      'Flatbed Trailer Rental & Leasing | 48ft & 53ft | SEEK Equipment',
    metaDescription:
      'Rent or lease flatbed trailers for heavy hauling and construction. Standard and step deck options, up to 48,000 lb capacity. Call SEEK Equipment at 1-210-802-0000.',
  },
  {
    slug: 'sand-chassis',
    title: 'Sand Chassis Trailer Rental & Leasing',
    shortTitle: 'Sand Chassis',
    description:
      'SEEK Equipment provides sand chassis trailers purpose-built for the oilfield industry. Our sand chassis are designed for hauling frac sand containers and sand boxes to and from well sites across the Permian Basin, Eagle Ford Shale, and beyond.',
    heroDescription:
      'Purpose-built sand chassis trailers for oilfield frac sand hauling. Designed for container and sand box transport with heavy-duty construction for Texas oil patch operations.',
    features: [
      'Purpose-built for frac sand container and sand box transport',
      'Heavy-duty steel frame construction for oilfield conditions',
      'Compatible with standard 20-foot sand containers and DNS boxes',
      'Quick-connect twist lock systems for rapid container loading',
      'Reinforced chassis rated for 52,000+ lbs gross capacity',
      'Designed for unpaved lease road and well site conditions',
      'Multiple box configurations including belly and top-fill options',
      'Low-maintenance design built for high-cycle oilfield use',
    ],
    specs: {
      'Box Configuration': 'Single or dual container',
      'Container Size': "20' ISO standard",
      'Gross Capacity': '52,000 lbs',
      'Sand Capacity': '22-25 tons per load',
      'Twist Locks': '4-point ISO twist lock system',
      'Frame Material': 'High-strength steel',
      Axles: 'Tandem or tridem axle',
      Suspension: 'Air ride or spring',
      Tires: '11R22.5 or 11R24.5',
      'King Pin': '2" SAE king pin',
    },
    faqs: [
      {
        question: 'What is a sand chassis trailer used for?',
        answer:
          'Sand chassis trailers are specialized trailers designed for transporting frac sand containers (also called sand boxes or DNS boxes) used in hydraulic fracturing operations. They use a twist-lock system to secure standard 20-foot containers and are built to handle the heavy loads and rough conditions of oilfield sites.',
      },
      {
        question: 'How much frac sand can a sand chassis haul per load?',
        answer:
          'A typical sand chassis load carries 22 to 25 tons of frac sand per container, depending on the container size and road weight limits. Our chassis are rated for over 52,000 lbs gross capacity to handle full sand loads.',
      },
      {
        question:
          'Are your sand chassis suitable for Permian Basin and Eagle Ford operations?',
        answer:
          'Yes, SEEK Equipment provides sand chassis trailers throughout Texas oilfield regions including the Permian Basin, Eagle Ford Shale, and Haynesville Shale. Our Von Ormy, TX location provides convenient access to Eagle Ford operations, and we arrange delivery to the Permian Basin and other regions.',
      },
      {
        question:
          'Do you offer short-term sand chassis rentals for specific frac jobs?',
        answer:
          'Yes, we offer flexible rental terms for sand chassis including daily, weekly, and monthly rentals that align with frac job schedules. Many customers rent chassis for the duration of a specific completion operation and return them when the job is finished.',
      },
      {
        question: 'What type of containers work with your sand chassis?',
        answer:
          'Our sand chassis are compatible with standard 20-foot ISO containers, DNS sand boxes, and most major frac sand container brands. The 4-point twist lock system accommodates standard ISO corner castings found on all industry-standard sand containers.',
      },
    ],
    metaTitle:
      'Sand Chassis Trailer Rental & Leasing | Oilfield Frac Sand | SEEK Equipment',
    metaDescription:
      'Rent or lease sand chassis trailers for oilfield frac sand hauling. Heavy-duty construction, 22-25 ton capacity, Texas oil patch ready. Call SEEK Equipment at 1-210-802-0000.',
  },
  {
    slug: 'belly-dump',
    title: 'Belly Dump Trailer Rental & Leasing',
    shortTitle: 'Belly Dump Trailers',
    description:
      'SEEK Equipment offers belly dump trailers for construction, mining, and aggregate hauling across Texas. Our belly dumps enable fast, controlled material placement for road construction, site prep, and large earthwork projects.',
    heroDescription:
      'High-capacity belly dump trailers for aggregate, sand, gravel, and construction material hauling. Controlled bottom discharge for efficient material placement on job sites.',
    features: [
      'Bottom discharge gates for controlled material placement',
      'High-volume tub design for maximum cubic yard capacity',
      'Hardox or AR steel tub construction for abrasion resistance',
      'Air-operated clamshell gate system for precise material flow',
      'Tapered tub design prevents material bridging and hang-ups',
      'Half-round or bathtub cross-section options available',
      'Ideal for windrow placement on road construction projects',
      'Easy clean-out design minimizes material carryback',
    ],
    specs: {
      Capacity: '24-40 cubic yards',
      'Tub Length': "38' to 42'",
      'Tub Material': 'Hardox 450 or AR400 steel',
      'Gate Type': 'Air-operated clamshell',
      'Max Payload': '50,000 lbs',
      Axles: 'Tandem or tridem axle',
      Suspension: 'Air ride or walking beam',
      Tires: '11R22.5',
      'Discharge Width': '24" to 36" adjustable',
      'Tub Cross-Section': 'Half-round or bathtub',
    },
    faqs: [
      {
        question: 'What materials can a belly dump trailer haul?',
        answer:
          'Belly dump trailers are designed for hauling loose bulk materials including sand, gravel, crushed stone, aggregate, dirt, asphalt millings, and other construction materials. They are commonly used in road construction, site development, and mining operations.',
      },
      {
        question: 'What is the capacity of your belly dump trailers?',
        answer:
          'Our belly dump trailers range from 24 to 40 cubic yards of capacity depending on the model. Payload capacity is up to 50,000 lbs. The exact capacity depends on the material density and applicable road weight limits.',
      },
      {
        question:
          'How does a belly dump trailer unload compared to an end dump?',
        answer:
          'A belly dump discharges material through bottom-opening clamshell gates while the trailer is in motion, creating a windrow or controlled spread of material. This is different from an end dump which tilts to dump from the rear. Belly dumps are preferred for road base, sub-base, and aggregate spreading because they provide more even material placement.',
      },
      {
        question: 'Are belly dump trailers suitable for road construction?',
        answer:
          'Yes, belly dump trailers are the preferred choice for road construction and highway projects. They can lay down consistent windrows of aggregate, base material, and fill dirt while moving, which speeds up material placement and reduces the need for secondary spreading equipment.',
      },
      {
        question:
          'What axle configurations are available on your belly dump trailers?',
        answer:
          'We offer belly dump trailers in tandem axle and tridem (triple) axle configurations. Tridem axle belly dumps carry more weight per load and distribute weight more evenly, which is beneficial for meeting bridge formula requirements on highways.',
      },
    ],
    metaTitle:
      'Belly Dump Trailer Rental & Leasing | Construction & Aggregate | SEEK Equipment',
    metaDescription:
      'Rent or lease belly dump trailers for aggregate and construction hauling. 24-40 cubic yard capacity, controlled bottom discharge. Call SEEK Equipment at 1-210-802-0000.',
  },
]

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}

export function getAllServiceSlugs(): string[] {
  return services.map((s) => s.slug)
}
