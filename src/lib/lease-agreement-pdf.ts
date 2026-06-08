import { createPdfDoc, PDF_COLORS } from './pdf-doc'
import {
  GUARANTY_ACKNOWLEDGMENT_INTRO,
  GUARANTY_ACKNOWLEDGMENT_ITEMS,
  GUARANTY_ACKNOWLEDGMENT_TITLE,
  GUARANTY_BLOCKS,
  GUARANTY_SUBTITLE,
  GUARANTY_TITLE,
  LEASE_BLOCKS,
  LEASE_INTRO,
  LEASE_TITLE,
  type DocBlock,
} from './legal-documents'
import type { LeaseAgreementFormData } from './validators'

export interface LeasePdfInput extends LeaseAgreementFormData {
  reference: string
  companyName: string | null
  applicantEmail: string
  submittedAt: Date
  submitterIp?: string | null
}

function renderBlocks(
  doc: Awaited<ReturnType<typeof createPdfDoc>>,
  blocks: DocBlock[]
): void {
  for (const block of blocks) {
    switch (block.kind) {
      case 'clause':
        doc.clause(block.num, block.text)
        break
      case 'item':
        doc.item(block.text)
        break
      case 'note':
        doc.paragraph(block.text, { size: 8, font: doc.bold, color: PDF_COLORS.gray })
        break
      default:
        doc.paragraph(block.text)
    }
  }
}

/**
 * Multi-page Equipment Rental Agreement + Personal Guaranty. The full clause
 * text comes from legal-documents.ts so the PDF matches the on-screen copy.
 * This is the signed record emailed to SEEK + the customer.
 */
export async function buildLeaseAgreementPdf(data: LeasePdfInput): Promise<Uint8Array> {
  const doc = await createPdfDoc({
    title: `Equipment Rental Agreement & Guaranty — ${data.companyName ?? data.applicantEmail}`,
    submittedAt: data.submittedAt,
  })

  doc.draw(`Reference: ${data.reference}`, doc.margin + doc.contentWidth - 160, doc.y, {
    size: 8.5,
    color: PDF_COLORS.gray,
  })
  doc.space(16)

  // ===== Lease =====
  doc.title(LEASE_TITLE, 14)
  doc.space(6)
  renderBlocks(doc, LEASE_INTRO)
  renderBlocks(doc, LEASE_BLOCKS)

  // Lessee signature block
  doc.sectionHeader('LESSEE ACCEPTANCE & SIGNATURE')
  doc.field('Lessee (Company):', data.companyName ?? '', { col: 'full' })
  doc.checkbox(
    Boolean(data.signatureConfirmed),
    'Lessee accepts the Equipment Rental Agreement (electronic signature).',
    doc.margin
  )
  doc.space(24)
  doc.signatureLine('Lessee Signature (typed name)', data.signatureName, { col: 'left' })
  doc.signatureLine('Title', data.title, { col: 'right' })
  doc.signatureLine('Date', data.signatureDate, { col: 'left' })
  doc.signatureLine('Lessor', 'Seek Equipment Rental, LLC', { col: 'right' })

  // ===== Personal Guaranty =====
  doc.space(6)
  doc.title(GUARANTY_TITLE, 12)
  doc.subtitle(GUARANTY_SUBTITLE, 8.5)
  doc.space(4)

  doc.sectionHeader('GUARANTOR')
  doc.field('Full Legal Name:', data.guarantorFullName, { col: 'full' })
  doc.field('Home Address:', data.homeAddress, { col: 'full' })
  doc.field('City:', data.city, { col: 'left' })
  doc.field('State:', data.state, { col: 'right' })
  doc.field('Zip:', data.zip, { col: 'left' })
  doc.field('Date of Birth:', data.dob, { col: 'right' })
  doc.field("Driver's License #:", data.dlNumber, { col: 'left' })
  doc.field('DL State:', data.dlState, { col: 'right' })
  doc.field('Email:', data.email, { col: 'left' })
  doc.field('Phone:', data.phone, { col: 'right' })

  doc.sectionHeader('PRINCIPAL (Renting Company)')
  doc.field('Company Legal Name:', data.principalLegalName, { col: 'left' })
  doc.field('DBA (if any):', data.dba ?? '', { col: 'right' })
  doc.field('Company Address:', data.companyAddress, { col: 'full' })
  doc.field('State:', data.companyState, { col: 'left' })
  doc.field('Zip:', data.companyZip, { col: 'right' })
  doc.field('Entity Type (LLC/Corp/Sole Prop):', data.entityType, { col: 'left' })
  doc.field('FMCSA MC/DOT #:', data.fmcsaMcDot ?? '', { col: 'right' })

  doc.space(4)
  renderBlocks(doc, GUARANTY_BLOCKS)

  // Acknowledgment
  doc.sectionHeader(GUARANTY_ACKNOWLEDGMENT_TITLE)
  doc.paragraph(GUARANTY_ACKNOWLEDGMENT_INTRO, { size: 9, font: doc.bold })
  for (const item of GUARANTY_ACKNOWLEDGMENT_ITEMS) {
    doc.item(item)
  }

  // Guarantor signature block
  doc.sectionHeader('GUARANTOR SIGNATURE')
  doc.checkbox(
    Boolean(data.guarantyConfirmed),
    'Guarantor accepts the Personal Guarantee (electronic signature).',
    doc.margin
  )
  doc.space(24)
  doc.signatureLine('Guarantor Signature (typed name)', data.guarantySignatureName, { col: 'left' })
  doc.signatureLine('Date', data.guarantyDate, { col: 'right' })
  doc.signatureLine('Printed Full Legal Name', data.guarantorFullName, { col: 'left' })
  doc.signatureLine('Phone', data.phone, { col: 'right' })

  doc.space(4)
  doc.draw(
    `Submitted: ${data.submittedAt.toISOString()} - Reference: ${data.reference}${data.submitterIp ? ` - IP: ${data.submitterIp}` : ''}`,
    doc.margin,
    doc.y,
    { size: 7.5, color: PDF_COLORS.gray }
  )

  return doc.save()
}
