import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().max(0).optional(),
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

export type ContactFormData = z.infer<typeof contactSchema>
export type QuoteFormData = z.infer<typeof quoteSchema>
export type CreditApplicationFormData = z.infer<typeof creditApplicationSchema>
export type TradeReference = z.infer<typeof tradeReferenceSchema>
export type NewsletterFormData = z.infer<typeof newsletterSchema>
