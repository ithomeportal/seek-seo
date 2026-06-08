import { createPdfDoc, PDF_COLORS } from './pdf-doc'
import { ACH_BLOCKS, ACH_TITLE, COMPANY_LEGAL_NAME } from './legal-documents'
import type { AchAuthorizationFormData } from './validators'

export interface AchPdfInput extends AchAuthorizationFormData {
  reference: string
  companyName: string | null
  applicantEmail: string
  submittedAt: Date
  submitterIp?: string | null
}

/**
 * Single-page ACH Debits Authorization. This is the signed record emailed to
 * SEEK + the customer, so it carries the FULL routing/account numbers (the DB
 * keeps last-4 only).
 */
export async function buildAchAuthorizationPdf(data: AchPdfInput): Promise<Uint8Array> {
  const doc = await createPdfDoc({
    title: `ACH Debits Authorization — ${data.companyName ?? data.applicantEmail}`,
    submittedAt: data.submittedAt,
  })

  doc.draw(`Reference: ${data.reference}`, doc.margin + doc.contentWidth - 160, doc.y, {
    size: 8.5,
    color: PDF_COLORS.gray,
  })
  doc.space(16)
  doc.title(ACH_TITLE, 13)
  doc.space(6)

  doc.field('Company Name:', COMPANY_LEGAL_NAME, { col: 'left' })
  doc.field('Company ID Number:', '', { col: 'right' })
  doc.space(4)

  for (const block of ACH_BLOCKS) {
    if (block.kind === 'note') {
      doc.paragraph(block.text, { size: 8, font: doc.bold, color: PDF_COLORS.gray })
    } else if (block.kind === 'paragraph') {
      doc.paragraph(block.text, { size: 9 })
    }
  }

  doc.sectionHeader('ACCOUNT AUTHORIZATION')
  doc.checkbox(data.accountType === 'checking', 'Checking Account', doc.margin)
  doc.checkbox(data.accountType === 'savings', 'Savings Account', doc.margin + doc.contentWidth / 2)
  doc.space(22)

  doc.field('Depository (Bank) Name:', data.bankName, { col: 'left' })
  doc.field('Branch:', data.branch ?? '', { col: 'right' })
  doc.field('City:', data.city, { col: 'left' })
  doc.field('State:', data.state, { col: 'right' })
  doc.field('Zip:', data.zip, { col: 'left' })
  doc.field('Routing Number:', data.routingNumber, { col: 'right' })
  doc.field('Account Number:', data.accountNumber, { col: 'full' })
  doc.field('Name(s) on Account:', data.accountName, { col: 'left' })
  doc.field('ID Number:', data.idNumber ?? '', { col: 'right' })

  doc.sectionHeader('AUTHORIZATION & SIGNATURE')
  doc.checkbox(
    Boolean(data.signatureConfirmed),
    'I authorize the ACH debits described above (electronic signature).',
    doc.margin
  )
  doc.space(24)
  doc.signatureLine('Signature (typed name)', data.signatureName, { col: 'left' })
  doc.signatureLine('Date', data.signatureDate, { col: 'right' })

  doc.space(6)
  doc.draw(
    `Submitted: ${data.submittedAt.toISOString()} - Reference: ${data.reference}${data.submitterIp ? ` - IP: ${data.submitterIp}` : ''}`,
    doc.margin,
    doc.y,
    { size: 7.5, color: PDF_COLORS.gray }
  )

  return doc.save()
}
