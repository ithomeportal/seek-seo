// Demo data for SEEK Equipment admin dashboard and client portal

export interface FleetUnit {
  id: number
  unitNumber: string
  trailerType: 'sand_chassis' | 'belly_dump' | 'sand_hopper' | 'dry_van' | 'flatbed' | 'tank'
  year: number | null
  make: string | null
  model: string | null
  vin: string | null
  purchasingCost: string | null
  tireType: string | null
  status: 'available' | 'rented' | 'damaged' | 'for_sale' | 'maintenance'
  rentedTo: string | null
  rentedToContact: string | null
  rentalRate: string | null
  skybitzDeviceId: string | null
  lastLatitude: string | null
  lastLongitude: string | null
  notes: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentForSale {
  id: number
  title: string
  trailerType: string
  year: number | null
  make: string | null
  model: string | null
  price: string | null
  description: string | null
  condition: 'new' | 'used' | 'refurbished' | null
  imageUrl: string | null
  isSold: number
  createdAt: string
}

export interface ContactSubmission {
  id: number
  name: string
  email: string
  phone: string | null
  company: string | null
  message: string
  type: 'contact' | 'quote' | 'credit_app'
  status: 'new' | 'reviewed' | 'responded'
  createdAt: string
}

export interface Client {
  id: number
  companyName: string
  contactName: string
  email: string
  verificationCode: string
  phone: string
}

export interface RentalContract {
  id: number
  clientId: number
  unitId: number
  unit: { unitNumber: string; make: string; model: string; year: number }
  status: 'active' | 'expired'
  contractStartDate: string
  contractEndDate: string
  monthlyRate: number
  securityDeposit: number
  leaseAgreementUrl: string | null
}

export interface Invoice {
  id: number
  clientId: number
  contractId: number
  invoiceNumber: string
  amount: number
  status: 'open' | 'paid'
  dueDate: string
  paidDate: string | null
  description: string | null
}

export interface SecurityDeposit {
  id: number
  clientId: number
  contractId: number
  amount: number
  status: 'held' | 'refunded'
  depositDate: string
}

export const TRAILER_TYPE_LABELS: Record<string, string> = {
  sand_chassis: 'Sand Chassis',
  belly_dump: 'Belly Dumps',
  sand_hopper: 'Sand Hoppers',
  dry_van: 'Dry Vans',
  flatbed: 'Flat Beds',
  tank: 'Tanks',
}

export const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  rented: 'Rented',
  damaged: 'Damaged',
  for_sale: 'For Sale',
  maintenance: 'Maintenance',
}

// ---------------------------------------------------------------------------
// Fleet Units
// ---------------------------------------------------------------------------

const fleetUnits: FleetUnit[] = [
  {
    id: 1,
    unitNumber: 'SC-101',
    trailerType: 'sand_chassis',
    year: 2022,
    make: 'Fontaine',
    model: 'Revolution',
    vin: '1HSHBABN3CN123456',
    purchasingCost: '42000',
    tireType: '11R22.5',
    status: 'rented',
    rentedTo: 'Permian Energy Services',
    rentedToContact: 'John Mitchell',
    rentalRate: '1800',
    skybitzDeviceId: 'SKY-90210',
    lastLatitude: '31.9973',
    lastLongitude: '-102.0779',
    notes: 'Annual inspection due June 2026',
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2023-06-15T10:00:00Z',
    updatedAt: '2026-03-01T14:30:00Z',
  },
  {
    id: 2,
    unitNumber: 'SC-102',
    trailerType: 'sand_chassis',
    year: 2023,
    make: 'Fontaine',
    model: 'Revolution',
    vin: '1HSHBABN5DN234567',
    purchasingCost: '44500',
    tireType: '11R22.5',
    status: 'rented',
    rentedTo: 'Permian Energy Services',
    rentedToContact: 'John Mitchell',
    rentalRate: '1900',
    skybitzDeviceId: 'SKY-90211',
    lastLatitude: '32.0147',
    lastLongitude: '-102.1098',
    notes: null,
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2023-09-20T08:00:00Z',
    updatedAt: '2026-03-10T09:15:00Z',
  },
  {
    id: 3,
    unitNumber: 'SC-103',
    trailerType: 'sand_chassis',
    year: 2021,
    make: 'Wabash',
    model: 'DuraPlate',
    vin: '1JJV532D3KL345678',
    purchasingCost: '38000',
    tireType: '11R22.5',
    status: 'available',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: 'SKY-90212',
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: 'Fresh paint, ready for lease',
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2022-01-10T12:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
  },
  {
    id: 4,
    unitNumber: 'BD-201',
    trailerType: 'belly_dump',
    year: 2020,
    make: 'MAC',
    model: 'Dump King',
    vin: '5PVNJ8JN2L4456789',
    purchasingCost: '52000',
    tireType: '11R24.5',
    status: 'rented',
    rentedTo: 'Eagle Ford Transport',
    rentedToContact: 'Maria Garcia',
    rentalRate: '2200',
    skybitzDeviceId: 'SKY-90213',
    lastLatitude: '28.7041',
    lastLongitude: '-99.7441',
    notes: null,
    imageUrl: '/images/trailers/belly-dump.jpg',
    createdAt: '2021-04-05T09:00:00Z',
    updatedAt: '2026-02-28T16:45:00Z',
  },
  {
    id: 5,
    unitNumber: 'BD-202',
    trailerType: 'belly_dump',
    year: 2022,
    make: 'MAC',
    model: 'Dump King HD',
    vin: '5PVNJ8JN4N5567890',
    purchasingCost: '56000',
    tireType: '11R24.5',
    status: 'rented',
    rentedTo: 'Basin Logistics',
    rentedToContact: 'Robert Chen',
    rentalRate: '2400',
    skybitzDeviceId: 'SKY-90214',
    lastLatitude: '31.8457',
    lastLongitude: '-102.3478',
    notes: 'Premium unit — long-term contract',
    imageUrl: '/images/trailers/belly-dump.jpg',
    createdAt: '2022-11-18T10:30:00Z',
    updatedAt: '2026-03-05T08:20:00Z',
  },
  {
    id: 6,
    unitNumber: 'BD-203',
    trailerType: 'belly_dump',
    year: 2019,
    make: 'MAC',
    model: 'Dump King',
    vin: '5PVNJ8JN6K6678901',
    purchasingCost: '48000',
    tireType: '11R24.5',
    status: 'damaged',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: 'SKY-90215',
    lastLatitude: '29.3838',
    lastLongitude: '-98.4616',
    notes: 'Hydraulic cylinder repair needed — parts on order',
    imageUrl: '/images/trailers/belly-dump.jpg',
    createdAt: '2020-02-14T11:00:00Z',
    updatedAt: '2026-03-14T13:00:00Z',
  },
  {
    id: 7,
    unitNumber: 'SH-301',
    trailerType: 'sand_hopper',
    year: 2023,
    make: 'Vanguard',
    model: 'Dry Bulk',
    vin: '2G9BS3517P7789012',
    purchasingCost: '47000',
    tireType: '11R22.5',
    status: 'rented',
    rentedTo: 'Texas Sand Co',
    rentedToContact: 'David Williams',
    rentalRate: '2100',
    skybitzDeviceId: 'SKY-90216',
    lastLatitude: '32.4487',
    lastLongitude: '-100.4506',
    notes: null,
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2023-07-22T14:00:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
  },
  {
    id: 8,
    unitNumber: 'SH-302',
    trailerType: 'sand_hopper',
    year: 2024,
    make: 'Vanguard',
    model: 'Dry Bulk XL',
    vin: '2G9BS3519R8890123',
    purchasingCost: '51000',
    tireType: '11R22.5',
    status: 'available',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: 'SKY-90217',
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: 'Brand new — just arrived',
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: '2026-03-15T09:30:00Z',
  },
  {
    id: 9,
    unitNumber: 'DV-401',
    trailerType: 'dry_van',
    year: 2021,
    make: 'Great Dane',
    model: 'Champion CL',
    vin: '1GRAA0622MB901234',
    purchasingCost: '35000',
    tireType: '295/75R22.5',
    status: 'rented',
    rentedTo: 'Permian Energy Services',
    rentedToContact: 'John Mitchell',
    rentalRate: '1200',
    skybitzDeviceId: 'SKY-90218',
    lastLatitude: '31.7619',
    lastLongitude: '-106.4850',
    notes: null,
    imageUrl: '/images/trailers/dry-van.jpg',
    createdAt: '2022-03-10T09:00:00Z',
    updatedAt: '2026-03-02T12:00:00Z',
  },
  {
    id: 10,
    unitNumber: 'DV-402',
    trailerType: 'dry_van',
    year: 2022,
    make: 'Wabash',
    model: 'DuraPlate HD',
    vin: '1JJV532D5NL012345',
    purchasingCost: '37000',
    tireType: '295/75R22.5',
    status: 'available',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: null,
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: null,
    imageUrl: '/images/trailers/dry-van.jpg',
    createdAt: '2023-01-05T10:00:00Z',
    updatedAt: '2026-03-11T15:00:00Z',
  },
  {
    id: 11,
    unitNumber: 'FB-501',
    trailerType: 'flatbed',
    year: 2020,
    make: 'Fontaine',
    model: 'Infinity',
    vin: '1HSHCABN2LN123456',
    purchasingCost: '32000',
    tireType: '11R22.5',
    status: 'rented',
    rentedTo: 'Eagle Ford Transport',
    rentedToContact: 'Maria Garcia',
    rentalRate: '1400',
    skybitzDeviceId: 'SKY-90220',
    lastLatitude: '28.3949',
    lastLongitude: '-99.1750',
    notes: null,
    imageUrl: '/images/trailers/flatbed.jpg',
    createdAt: '2021-06-20T08:30:00Z',
    updatedAt: '2026-03-09T11:00:00Z',
  },
  {
    id: 12,
    unitNumber: 'FB-502',
    trailerType: 'flatbed',
    year: 2023,
    make: 'Fontaine',
    model: 'Revolution',
    vin: '1HSHCABN4PN234567',
    purchasingCost: '36000',
    tireType: '11R22.5',
    status: 'maintenance',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: 'SKY-90221',
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: 'Deck resurfacing — expected completion March 25',
    imageUrl: '/images/trailers/flatbed.jpg',
    createdAt: '2023-10-15T13:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
  },
  {
    id: 13,
    unitNumber: 'TK-601',
    trailerType: 'tank',
    year: 2021,
    make: 'Heil',
    model: '9500 Gallon',
    vin: '1H9ST4836ML345678',
    purchasingCost: '62000',
    tireType: '11R24.5',
    status: 'rented',
    rentedTo: 'Basin Logistics',
    rentedToContact: 'Robert Chen',
    rentalRate: '2500',
    skybitzDeviceId: 'SKY-90222',
    lastLatitude: '31.5493',
    lastLongitude: '-102.1543',
    notes: null,
    imageUrl: '/images/trailers/tanker.jpg',
    createdAt: '2022-05-12T09:00:00Z',
    updatedAt: '2026-03-07T14:30:00Z',
  },
  {
    id: 14,
    unitNumber: 'TK-602',
    trailerType: 'tank',
    year: 2023,
    make: 'Tremcar',
    model: 'DOT 407',
    vin: '2T9TC4838PN456789',
    purchasingCost: '68000',
    tireType: '11R24.5',
    status: 'available',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: 'SKY-90223',
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: 'DOT certified — ready for hazmat',
    imageUrl: '/images/trailers/tanker.jpg',
    createdAt: '2024-01-20T11:00:00Z',
    updatedAt: '2026-03-13T08:00:00Z',
  },
  {
    id: 15,
    unitNumber: 'SC-104',
    trailerType: 'sand_chassis',
    year: 2024,
    make: 'Fontaine',
    model: 'Revolution LX',
    vin: '1HSHBABN7RN567890',
    purchasingCost: '46000',
    tireType: '11R22.5',
    status: 'for_sale',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: null,
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: 'Surplus unit — low miles',
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2026-03-17T09:00:00Z',
  },
  {
    id: 16,
    unitNumber: 'BD-204',
    trailerType: 'belly_dump',
    year: 2018,
    make: 'MAC',
    model: 'Dump King',
    vin: '5PVNJ8JN8J7789012',
    purchasingCost: '40000',
    tireType: '11R24.5',
    status: 'for_sale',
    rentedTo: null,
    rentedToContact: null,
    rentalRate: null,
    skybitzDeviceId: null,
    lastLatitude: '29.4241',
    lastLongitude: '-98.4936',
    notes: 'High mileage — priced to sell',
    imageUrl: '/images/trailers/belly-dump.jpg',
    createdAt: '2019-08-10T12:00:00Z',
    updatedAt: '2026-03-16T14:00:00Z',
  },
  {
    id: 17,
    unitNumber: 'SH-303',
    trailerType: 'sand_hopper',
    year: 2022,
    make: 'Vanguard',
    model: 'Dry Bulk',
    vin: '2G9BS3518N8890123',
    purchasingCost: '46000',
    tireType: '11R22.5',
    status: 'rented',
    rentedTo: 'Texas Sand Co',
    rentedToContact: 'David Williams',
    rentalRate: '2000',
    skybitzDeviceId: 'SKY-90224',
    lastLatitude: '32.7555',
    lastLongitude: '-97.3308',
    notes: null,
    imageUrl: '/images/trailers/sand-chassis.jpg',
    createdAt: '2023-03-08T10:00:00Z',
    updatedAt: '2026-03-04T16:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Equipment For Sale
// ---------------------------------------------------------------------------

const equipmentForSale: EquipmentForSale[] = [
  {
    id: 1,
    title: '2024 Fontaine Sand Chassis — Low Miles',
    trailerType: 'sand_chassis',
    year: 2024,
    make: 'Fontaine',
    model: 'Revolution LX',
    price: '38500',
    description:
      'Surplus unit with under 10,000 miles. Air ride suspension, aluminum wheels, LED lights. DOT inspected and road-ready.',
    condition: 'used',
    imageUrl: '/images/trailers/sand-chassis.jpg',
    isSold: 0,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 2,
    title: '2018 MAC Belly Dump — Priced to Sell',
    trailerType: 'belly_dump',
    year: 2018,
    make: 'MAC',
    model: 'Dump King',
    price: '22000',
    description:
      'Higher mileage but mechanically sound. New tires, recently serviced hydraulics. Great value for aggregate hauling.',
    condition: 'used',
    imageUrl: '/images/trailers/belly-dump.jpg',
    isSold: 0,
    createdAt: '2026-02-20T09:00:00Z',
  },
  {
    id: 3,
    title: '2020 Wabash Dry Van — Refurbished',
    trailerType: 'dry_van',
    year: 2020,
    make: 'Wabash',
    model: 'DuraPlate',
    price: '18500',
    description:
      'Fully refurbished interior, new roll-up door, fresh exterior paint. Ideal for regional freight.',
    condition: 'refurbished',
    imageUrl: '/images/trailers/dry-van.jpg',
    isSold: 1,
    createdAt: '2026-01-15T08:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Contact Submissions
// ---------------------------------------------------------------------------

const contactSubmissions: ContactSubmission[] = [
  {
    id: 1,
    name: 'Carlos Rivera',
    email: 'carlos@rivieratransport.com',
    phone: '432-555-0147',
    company: 'Riviera Transport LLC',
    message: 'Need 3 sand chassis for a 6-month frac job in the Permian Basin starting April 1.',
    type: 'quote',
    status: 'new',
    createdAt: '2026-03-17T09:30:00Z',
  },
  {
    id: 2,
    name: 'Amy Tran',
    email: 'amy.tran@longhornlogistics.com',
    phone: '210-555-0239',
    company: 'Longhorn Logistics',
    message: 'Interested in long-term lease rates on belly dumps. We haul aggregate out of the San Antonio quarries.',
    type: 'quote',
    status: 'reviewed',
    createdAt: '2026-03-16T14:15:00Z',
  },
  {
    id: 3,
    name: 'Mike Dawson',
    email: 'mdawson@gmail.com',
    phone: '830-555-0312',
    company: null,
    message: 'Is the 2018 MAC belly dump still available? Willing to pick up this weekend.',
    type: 'contact',
    status: 'responded',
    createdAt: '2026-03-15T11:00:00Z',
  },
  {
    id: 4,
    name: 'Sarah Nguyen',
    email: 'sarah@pipelineservicestx.com',
    phone: '361-555-0488',
    company: 'Pipeline Services TX',
    message: 'We need 2 tankers for produced-water hauling near Karnes City. Can you send your credit application?',
    type: 'credit_app',
    status: 'new',
    createdAt: '2026-03-14T16:45:00Z',
  },
  {
    id: 5,
    name: 'James Whitfield',
    email: 'jwhitfield@basinlogistics.com',
    phone: '432-555-0561',
    company: 'Basin Logistics',
    message: 'Looking to add a flatbed to our existing rental agreement. Who do I talk to about expanding our contract?',
    type: 'contact',
    status: 'new',
    createdAt: '2026-03-13T08:20:00Z',
  },
  {
    id: 6,
    name: 'Linda Harmon',
    email: 'linda.h@txsandco.com',
    phone: '325-555-0673',
    company: 'Texas Sand Co',
    message: 'One of our hoppers has a slow air leak on the left side. Can we arrange maintenance this week?',
    type: 'contact',
    status: 'reviewed',
    createdAt: '2026-03-12T10:10:00Z',
  },
  {
    id: 7,
    name: 'Derek Powell',
    email: 'derek@eaglefordtransport.com',
    phone: null,
    company: 'Eagle Ford Transport',
    message: 'Requesting a formal quote for 5 sand chassis, 12-month lease, starting May 2026.',
    type: 'quote',
    status: 'new',
    createdAt: '2026-03-11T13:30:00Z',
  },
]

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const clients: Client[] = [
  {
    id: 1,
    companyName: 'Permian Energy Services',
    contactName: 'John Mitchell',
    email: 'john@permianenergy.com',
    verificationCode: 'DEMO123',
    phone: '432-555-0100',
  },
]

// ---------------------------------------------------------------------------
// Rental Contracts
// ---------------------------------------------------------------------------

const rentalContracts: RentalContract[] = [
  {
    id: 1,
    clientId: 1,
    unitId: 1,
    unit: { unitNumber: 'SC-101', make: 'Fontaine', model: 'Revolution', year: 2022 },
    status: 'active',
    contractStartDate: '2025-07-01',
    contractEndDate: '2026-06-30',
    monthlyRate: 1800,
    securityDeposit: 3600,
    leaseAgreementUrl: null,
  },
  {
    id: 2,
    clientId: 1,
    unitId: 2,
    unit: { unitNumber: 'SC-102', make: 'Fontaine', model: 'Revolution', year: 2023 },
    status: 'active',
    contractStartDate: '2025-10-01',
    contractEndDate: '2026-09-30',
    monthlyRate: 1900,
    securityDeposit: 3800,
    leaseAgreementUrl: null,
  },
  {
    id: 3,
    clientId: 1,
    unitId: 9,
    unit: { unitNumber: 'DV-401', make: 'Great Dane', model: 'Champion CL', year: 2021 },
    status: 'active',
    contractStartDate: '2025-04-01',
    contractEndDate: '2026-03-31',
    monthlyRate: 1200,
    securityDeposit: 2400,
    leaseAgreementUrl: null,
  },
]

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

const invoices: Invoice[] = [
  {
    id: 1,
    clientId: 1,
    contractId: 1,
    invoiceNumber: 'INV-2026-0045',
    amount: 1800,
    status: 'paid',
    dueDate: '2026-02-01',
    paidDate: '2026-01-29',
    description: 'SC-101 monthly rental — February 2026',
  },
  {
    id: 2,
    clientId: 1,
    contractId: 2,
    invoiceNumber: 'INV-2026-0046',
    amount: 1900,
    status: 'paid',
    dueDate: '2026-02-01',
    paidDate: '2026-01-30',
    description: 'SC-102 monthly rental — February 2026',
  },
  {
    id: 3,
    clientId: 1,
    contractId: 1,
    invoiceNumber: 'INV-2026-0062',
    amount: 1800,
    status: 'open',
    dueDate: '2026-03-01',
    paidDate: null,
    description: 'SC-101 monthly rental — March 2026',
  },
  {
    id: 4,
    clientId: 1,
    contractId: 3,
    invoiceNumber: 'INV-2026-0063',
    amount: 1200,
    status: 'open',
    dueDate: '2026-03-01',
    paidDate: null,
    description: 'DV-401 monthly rental — March 2026',
  },
]

// ---------------------------------------------------------------------------
// Security Deposits
// ---------------------------------------------------------------------------

const securityDeposits: SecurityDeposit[] = [
  {
    id: 1,
    clientId: 1,
    contractId: 1,
    amount: 3600,
    status: 'held',
    depositDate: '2025-06-28',
  },
  {
    id: 2,
    clientId: 1,
    contractId: 2,
    amount: 3800,
    status: 'held',
    depositDate: '2025-09-28',
  },
]

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

export function getFleetUnits(): FleetUnit[] {
  return fleetUnits
}

export function getFleetUnitById(id: number): FleetUnit | undefined {
  return fleetUnits.find((u) => u.id === id)
}

export function getFleetStats() {
  const total = fleetUnits.length
  const byStatus: Record<string, number> = {}
  const byType: Record<string, number> = {}

  for (const unit of fleetUnits) {
    byStatus[unit.status] = (byStatus[unit.status] || 0) + 1
    byType[unit.trailerType] = (byType[unit.trailerType] || 0) + 1
  }

  const rentedUnits = fleetUnits.filter((u) => u.status === 'rented')
  const totalMonthlyRevenue = rentedUnits.reduce(
    (sum, u) => sum + (u.rentalRate ? parseFloat(u.rentalRate) : 0),
    0
  )
  const utilizationRate = total > 0 ? Math.round((rentedUnits.length / total) * 100) : 0

  return {
    total,
    byStatus,
    byType,
    totalMonthlyRevenue,
    utilizationRate,
    availableCount: byStatus['available'] || 0,
    rentedCount: byStatus['rented'] || 0,
    damagedCount: byStatus['damaged'] || 0,
    forSaleCount: byStatus['for_sale'] || 0,
    maintenanceCount: byStatus['maintenance'] || 0,
  }
}

export function getCustomerConcentration() {
  const rentedUnits = fleetUnits.filter((u) => u.status === 'rented' && u.rentedTo)
  const customerMap: Record<string, { count: number; totalRent: number }> = {}

  for (const unit of rentedUnits) {
    const name = unit.rentedTo!
    if (!customerMap[name]) {
      customerMap[name] = { count: 0, totalRent: 0 }
    }
    customerMap[name] = {
      count: customerMap[name].count + 1,
      totalRent: customerMap[name].totalRent + (unit.rentalRate ? parseFloat(unit.rentalRate) : 0),
    }
  }

  return Object.entries(customerMap)
    .map(([customer, data]) => ({
      customer,
      unitCount: data.count,
      monthlyRevenue: data.totalRent,
      percentOfFleet: Math.round((data.count / fleetUnits.length) * 100),
    }))
    .sort((a, b) => b.unitCount - a.unitCount)
}

export function getEquipmentForSale(): EquipmentForSale[] {
  return equipmentForSale
}

export function getContactSubmissions(): ContactSubmission[] {
  return contactSubmissions
}

export function verifyAdminCode(code: string): boolean {
  const adminCode = process.env.ADMIN_ACCESS_CODE || 'seek2024!'
  return code === adminCode
}

export function verifyClientLogin(
  email: string,
  code: string
): { success: boolean; clientId?: number } {
  const client = clients.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.verificationCode === code
  )
  if (client) {
    return { success: true, clientId: client.id }
  }
  return { success: false }
}

export function getClientByEmail(email: string): Client | undefined {
  return clients.find((c) => c.email.toLowerCase() === email.toLowerCase())
}

export function getClientContracts(clientId: number): RentalContract[] {
  return rentalContracts.filter((c) => c.clientId === clientId)
}

export function getClientInvoices(clientId: number): Invoice[] {
  return invoices.filter((i) => i.clientId === clientId)
}

export function getClientDeposits(clientId: number): SecurityDeposit[] {
  return securityDeposits.filter((d) => d.clientId === clientId)
}

export function getClientDashboardStats(clientId: number) {
  const contracts = getClientContracts(clientId)
  const clientInvoices = getClientInvoices(clientId)
  const deposits = getClientDeposits(clientId)

  const activeContracts = contracts.filter((c) => c.status === 'active')
  const openInvoices = clientInvoices.filter((i) => i.status === 'open')
  const totalOutstanding = openInvoices.reduce((sum, i) => sum + i.amount, 0)
  const totalDepositsHeld = deposits
    .filter((d) => d.status === 'held')
    .reduce((sum, d) => sum + d.amount, 0)

  return {
    activeContractCount: activeContracts.length,
    totalMonthlyRent: activeContracts.reduce((sum, c) => sum + c.monthlyRate, 0),
    openInvoiceCount: openInvoices.length,
    totalOutstanding,
    totalDepositsHeld,
  }
}
