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
    'dryvan',
    'tanker',
    'flatbed',
    'sand-chassis',
    'sand-hopper',
    'belly-dump',
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

export const creditApplicationSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  company: z.string().min(1, 'Company name is required'),
  message: z.string().optional(),
  honeypot: z.string().max(0).optional(),
})

export type ContactFormData = z.infer<typeof contactSchema>
export type QuoteFormData = z.infer<typeof quoteSchema>
export type CreditApplicationFormData = z.infer<typeof creditApplicationSchema>
export type NewsletterFormData = z.infer<typeof newsletterSchema>
