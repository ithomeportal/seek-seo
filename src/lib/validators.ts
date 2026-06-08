import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().max(0).optional(),
  captchaToken: z.string().min(1, 'Please complete the verification').optional(),
  captchaAnswer: z.union([z.number(), z.string()]).optional(),
})

export const quoteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  company: z.string().min(1, 'Company name is required'),
  trailerType: z.enum([
    'sand-chassis',
    'belly-dumps',
    'sand-hoppers',
    'dry-vans',
    'flatbeds',
    'tanks',
    'multiple',
    'not-sure',
    'other',
  ]),
  quantity: z.number().min(1).max(100),
  duration: z.enum([
    'daily',
    'weekly',
    'monthly',
    '6-month',
    '12-month',
    'custom',
  ]),
  startDate: z.string().optional(),
  details: z.string().optional(),
  honeypot: z.string().max(0).optional(),
  captchaToken: z.string().min(1, 'Please complete the verification').optional(),
  captchaAnswer: z.union([z.number(), z.string()]).optional(),
})

export const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

const optionalString = z.string().trim().optional().or(z.literal(''))

const tradeReferenceSchema = z.object({
  name: optionalString,
  phone: optionalString,
  address: optionalString,
})

export const creditApplicationSchema = z.object({
  // Customer
  customerName: z.string().trim().min(2, 'Customer name is required'),
  customerStreet: optionalString,
  customerCity: optionalString,
  customerState: optionalString,
  customerZip: optionalString,
  customerPhone: z.string().trim().min(10, 'Phone must have at least 10 digits'),
  // Business
  entityType: z.enum(['corporation', 'llc', 'partnership', 'proprietorship']),
  previousBusinessName: optionalString,
  stateEntityFormed: optionalString,
  businessPhone: optionalString,
  bankruptcyFiled: z.boolean().default(false),
  bankruptcyYear: optionalString,
  federalTaxId: optionalString,
  dnbNumber: optionalString,
  driverLicense: optionalString,
  partnersMembers: optionalString,
  // Signatory
  signatoryName: z.string().trim().min(2, 'Signatory name is required'),
  signatoryTitle: optionalString,
  signatoryAddress: optionalString,
  signatoryPhone: optionalString,
  signatoryEmail: z.string().trim().email('Please enter a valid email address'),
  // Banking
  bankName: optionalString,
  bankContactName: optionalString,
  bankAddress: optionalString,
  bankAccountNumber: optionalString,
  bankTransit: optionalString,
  // Accounting
  jobNumbersRequired: z.boolean().default(false),
  taxExempt: z.boolean().default(false),
  insuranceCompany: optionalString,
  insuranceContactPerson: optionalString,
  insurancePhone: optionalString,
  certificateForwarded: z.boolean().default(false),
  apContact: optionalString,
  apEmail: z.union([z.literal(''), z.string().trim().email('Valid A/P email required')]).optional(),
  apPhone: optionalString,
  // Trade References
  tradeReferences: z.array(tradeReferenceSchema).max(3).default([]),
  // Signature Confirmation
  signatureConfirmed: z.literal(true, {
    message: 'You must confirm the signature to submit',
  }),
  signatureName: z.string().trim().min(2, 'Please type your full name'),
  signatureDate: z.string().trim().min(1, 'Date is required'),
  honeypot: z.string().max(0).optional(),
})

/* ------------------------------------------------------------------ */
/*  Onboarding — ACH Debits Authorization                             */
/* ------------------------------------------------------------------ */

export const achAuthorizationSchema = z.object({
  accountType: z.enum(['checking', 'savings'], {
    message: 'Select checking or savings',
  }),
  bankName: z.string().trim().min(2, 'Depository (bank) name is required'),
  branch: optionalString,
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  zip: z.string().trim().min(3, 'ZIP is required'),
  routingNumber: z
    .string()
    .trim()
    .regex(/^\d{9}$/, 'Routing number must be 9 digits'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{4,17}$/, 'Enter a valid account number'),
  accountName: z.string().trim().min(2, 'Name(s) on the account are required'),
  idNumber: optionalString,
  signatureConfirmed: z.literal(true, {
    message: 'You must authorize the ACH debit to submit',
  }),
  signatureName: z.string().trim().min(2, 'Please type your full name'),
  signatureDate: z.string().trim().min(1, 'Date is required'),
  honeypot: z.string().max(0).optional(),
})

/* ------------------------------------------------------------------ */
/*  Onboarding — Lease Agreement & Guaranty to Pay                    */
/* ------------------------------------------------------------------ */

export const leaseAgreementSchema = z.object({
  // Lessee signature block
  signatureName: z.string().trim().min(2, 'Lessee signature (full name) is required'),
  title: z.string().trim().min(1, 'Title is required'),
  signatureDate: z.string().trim().min(1, 'Date is required'),
  signatureConfirmed: z.literal(true, {
    message: 'You must accept the lease agreement to submit',
  }),
  // Personal Guaranty
  guarantorFullName: z.string().trim().min(2, 'Guarantor full legal name is required'),
  homeAddress: z.string().trim().min(2, 'Home address is required'),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  zip: z.string().trim().min(3, 'ZIP is required'),
  dob: z.string().trim().min(1, 'Date of birth is required'),
  dlNumber: z.string().trim().min(2, "Driver's license number is required"),
  dlState: z.string().trim().min(2, "Driver's license state is required"),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().min(10, 'Phone must have at least 10 digits'),
  // Principal (renting company)
  principalLegalName: z.string().trim().min(2, 'Company legal name is required'),
  dba: optionalString,
  companyAddress: z.string().trim().min(2, 'Company address is required'),
  companyState: z.string().trim().min(2, 'Company state is required'),
  companyZip: z.string().trim().min(3, 'Company ZIP is required'),
  entityType: z.string().trim().min(2, 'Entity type is required'),
  fmcsaMcDot: optionalString,
  guarantyConfirmed: z.literal(true, {
    message: 'You must accept the personal guaranty to submit',
  }),
  guarantySignatureName: z.string().trim().min(2, 'Guarantor signature (full name) is required'),
  guarantyDate: z.string().trim().min(1, 'Date is required'),
  honeypot: z.string().max(0).optional(),
})

export const fmcsaSearchSchema = z.object({
  state: z.string().length(2).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  radiusMiles: z.number().int().min(1).max(500).optional(),
  minPowerUnits: z.number().int().min(0).max(100000).optional(),
  maxPowerUnits: z.number().int().min(0).max(100000).optional(),
  cargo: z.array(z.string().max(60)).max(40).optional(),
  nameTokens: z.array(z.string().max(80)).max(20).optional(),
  onlyActive: z.boolean().optional(),
  hmOnly: z.boolean().optional(),
  hasContactOnly: z.boolean().optional(),
  recentMcs150Only: z.boolean().optional(),
  page: z.number().int().min(1).max(100000).optional(),
  pageSize: z.number().int().min(1).max(500).optional(),
  sortBy: z.enum(['powerUnits', 'legalName', 'phyState', 'phyCity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export type ContactFormData = z.infer<typeof contactSchema>
export type QuoteFormData = z.infer<typeof quoteSchema>
export type CreditApplicationFormData = z.infer<typeof creditApplicationSchema>
export type TradeReference = z.infer<typeof tradeReferenceSchema>
export type AchAuthorizationFormData = z.infer<typeof achAuthorizationSchema>
export type LeaseAgreementFormData = z.infer<typeof leaseAgreementSchema>
export type NewsletterFormData = z.infer<typeof newsletterSchema>
export type FmcsaSearchFilters = z.infer<typeof fmcsaSearchSchema>
