export const COMPANY = {
  name: 'SEEK Equipment',
  phone: '1-210-802-0000',
  phoneHref: 'tel:+12108020000',
  email: 'sales@seekequipment.com',
  address: {
    street: '12330 Interstate 35 Access Rd',
    city: 'Von Ormy',
    state: 'TX',
    zip: '78073',
    country: 'US',
    full: '12330 Interstate 35 Access Rd, Von Ormy, TX 78073',
  },
  hqAddress: {
    street: '16414 San Pedro Ave, Ste 335',
    city: 'San Antonio',
    state: 'TX',
    zip: '78232',
    country: 'US',
    full: '16414 San Pedro Ave, Ste 335, San Antonio, TX 78232',
  },
  url: 'https://seekequipment.com',
  description:
    'Trailer rental and leasing company with 250+ trailers including DryVan, Tanker, Flatbed, Sand Chassis, Sand Hopper, and Belly Dump trailers in Texas.',
  fleetSize: 250,
} as const

export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Equipment', href: '/equipment' },
  { label: 'For Sale', href: '/for-sale' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
] as const

export const PORTAL_LINKS = [
  { label: 'Client Portal', href: '/client-portal', icon: 'User' },
  { label: 'Management', href: '/admin', icon: 'Settings' },
] as const

export const BRAND = {
  blue: '#35668d',
  orange: '#ee5519',
  blueDark: '#2a5170',
  orangeDark: '#d44a14',
  blueLight: '#4a7fa8',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const
