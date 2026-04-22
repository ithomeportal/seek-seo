import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { CreditApplicationFormData } from './validators'

const ORANGE = rgb(0.933, 0.333, 0.098)
const DARK = rgb(0.12, 0.16, 0.22)
const GRAY = rgb(0.45, 0.5, 0.55)
const LINE = rgb(0.8, 0.82, 0.85)

const ENTITY_LABEL: Record<string, string> = {
  corporation: 'Corporation',
  llc: 'LLC',
  partnership: 'Partnership',
  proprietorship: 'Proprietorship',
}

function mask(value: string | undefined | null, visible = 4): string {
  if (!value) return ''
  const clean = value.replace(/\s+/g, '')
  if (clean.length <= visible) return '*'.repeat(clean.length)
  return '*'.repeat(clean.length - visible) + clean.slice(-visible)
}

function safe(value: string | undefined | null): string {
  return (value ?? '').toString().trim()
}

type PdfInput = CreditApplicationFormData & {
  referenceNumber: string
  submittedAt: Date
  submitterIp?: string | null
}

export async function buildCreditApplicationPdf(
  data: PdfInput
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Credit Application — ${data.customerName}`)
  pdf.setAuthor('SEEK Equipment')
  pdf.setProducer('SEEK Equipment Portal')
  pdf.setCreationDate(data.submittedAt)

  const page = pdf.addPage([612, 792]) // US Letter
  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const margin = 42
  const width = page.getWidth() - margin * 2
  let y = page.getHeight() - margin

  const drawText = (
    text: string,
    x: number,
    yy: number,
    opts: { font?: typeof helv; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page.drawText(text, {
      x,
      y: yy,
      size: opts.size ?? 9,
      font: opts.font ?? helv,
      color: opts.color ?? DARK,
    })
  }

  const drawLine = (x1: number, yy: number, x2: number, color = LINE) => {
    page.drawLine({
      start: { x: x1, y: yy },
      end: { x: x2, y: yy },
      thickness: 0.5,
      color,
    })
  }

  const drawSectionHeader = (label: string) => {
    drawLine(margin, y, margin + width, DARK)
    y -= 14
    const textWidth = helvBold.widthOfTextAtSize(label, 10)
    drawText(label, margin + (width - textWidth) / 2, y, {
      font: helvBold,
      size: 10,
    })
    y -= 10
  }

  const drawField = (
    label: string,
    value: string,
    opts: { col?: 'full' | 'left' | 'right'; rowHeight?: number } = {}
  ) => {
    const col = opts.col ?? 'full'
    const rowHeight = opts.rowHeight ?? 18
    const colWidth = col === 'full' ? width : width / 2 - 6
    const x = col === 'right' ? margin + width / 2 + 6 : margin
    const labelWidth = helv.widthOfTextAtSize(label, 8.5)
    drawText(label, x, y, { size: 8.5, color: GRAY })
    const valueStart = x + labelWidth + 4
    drawText(value || '—', valueStart, y, { size: 9.5, font: helvBold })
    drawLine(x, y - 2.5, x + colWidth)
    if (col !== 'left') y -= rowHeight
  }

  const checkbox = (checked: boolean, label: string, x: number, yy: number) => {
    page.drawRectangle({
      x,
      y: yy - 1,
      width: 8,
      height: 8,
      borderColor: DARK,
      borderWidth: 0.8,
      color: checked ? DARK : rgb(1, 1, 1),
    })
    if (checked) {
      drawText('X', x + 1.5, yy + 0.5, {
        size: 7,
        font: helvBold,
        color: rgb(1, 1, 1),
      })
    }
    drawText(label, x + 13, yy, { size: 9 })
  }

  // ===== Header =====
  drawText(`Reference: ${data.referenceNumber}`, margin + width - 160, y, {
    size: 8.5,
    color: GRAY,
  })
  y -= 18
  const title = 'APPLICATION FOR CREDIT & RENTAL AGREEMENT'
  const titleWidth = helvBold.widthOfTextAtSize(title, 14)
  drawText(title, margin + (width - titleWidth) / 2, y, {
    font: helvBold,
    size: 14,
  })
  y -= 14
  const subtitle = 'In order to process your request, this agreement must be signed.'
  const subtitleWidth = helv.widthOfTextAtSize(subtitle, 9)
  drawText(subtitle, margin + (width - subtitleWidth) / 2, y, {
    size: 9,
    color: GRAY,
  })
  y -= 10

  // ===== Customer =====
  drawLine(margin, y, margin + width, DARK)
  y -= 16
  drawField('Customer Name (Individual or Company):', safe(data.customerName))
  drawField('Address (Street):', safe(data.customerStreet))
  drawField('City:', safe(data.customerCity), { col: 'left' })
  drawField('State:', safe(data.customerState), { col: 'right' })
  drawField('Zip:', safe(data.customerZip), { col: 'left' })
  drawField('Phone Number:', safe(data.customerPhone), { col: 'right' })

  // ===== Business =====
  drawSectionHeader('BUSINESS INFORMATION')
  // Entity type checkboxes
  const xStart = margin
  const spacing = width / 4
  checkbox(data.entityType === 'corporation', 'Corporation', xStart, y)
  checkbox(data.entityType === 'llc', 'LLC', xStart + spacing, y)
  checkbox(data.entityType === 'partnership', 'Partnership', xStart + spacing * 2, y)
  checkbox(data.entityType === 'proprietorship', 'Proprietorship', xStart + spacing * 3, y)
  y -= 20
  drawField('Previous Business Name:', safe(data.previousBusinessName))
  drawField('State Entity Formed:', safe(data.stateEntityFormed), { col: 'left' })
  drawField('Phone Number:', safe(data.businessPhone), { col: 'right' })
  drawField(
    'Have you ever filed bankruptcy?',
    data.bankruptcyFiled ? `Yes${data.bankruptcyYear ? ` (${data.bankruptcyYear})` : ''}` : 'No',
    { col: 'left' }
  )
  drawField('Federal Tax ID#:', safe(data.federalTaxId), { col: 'right' })
  drawField('D & B #:', safe(data.dnbNumber), { col: 'left' })
  drawField("Driver's License:", mask(data.driverLicense), { col: 'right' })
  drawField('If Partnership or LLC, list partners/members:', safe(data.partnersMembers))

  // ===== Signatory =====
  drawSectionHeader('SIGNATORY INFORMATION (Authorized Agent)')
  drawField('Name:', safe(data.signatoryName), { col: 'left' })
  drawField('Title/Relationship:', safe(data.signatoryTitle), { col: 'right' })
  drawField('Address:', safe(data.signatoryAddress))
  drawField('Phone Number:', safe(data.signatoryPhone), { col: 'left' })
  drawField('Email Address:', safe(data.signatoryEmail), { col: 'right' })

  // ===== Banking =====
  drawSectionHeader('BANKING INFORMATION')
  drawField('Bank Name:', safe(data.bankName), { col: 'left' })
  drawField('Contact Name:', safe(data.bankContactName), { col: 'right' })
  drawField('Address:', safe(data.bankAddress))
  drawField('Account Number:', mask(data.bankAccountNumber), { col: 'left' })
  drawField('Bank Transit:', safe(data.bankTransit), { col: 'right' })

  // ===== Accounting — on page 2 =====
  const page2 = pdf.addPage([612, 792])
  y = page2.getHeight() - margin
  const pageRef = page
  // Rebind drawing helpers to page2
  const drawText2 = (
    text: string,
    x: number,
    yy: number,
    opts: { font?: typeof helv; size?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    page2.drawText(text, {
      x,
      y: yy,
      size: opts.size ?? 9,
      font: opts.font ?? helv,
      color: opts.color ?? DARK,
    })
  }
  const drawLine2 = (x1: number, yy: number, x2: number, color = LINE) => {
    page2.drawLine({
      start: { x: x1, y: yy },
      end: { x: x2, y: yy },
      thickness: 0.5,
      color,
    })
  }
  const drawSectionHeader2 = (label: string) => {
    drawLine2(margin, y, margin + width, DARK)
    y -= 14
    const tw = helvBold.widthOfTextAtSize(label, 10)
    drawText2(label, margin + (width - tw) / 2, y, { font: helvBold, size: 10 })
    y -= 10
  }
  const drawField2 = (
    label: string,
    value: string,
    opts: { col?: 'full' | 'left' | 'right'; rowHeight?: number } = {}
  ) => {
    const col = opts.col ?? 'full'
    const rowHeight = opts.rowHeight ?? 18
    const colWidth = col === 'full' ? width : width / 2 - 6
    const x = col === 'right' ? margin + width / 2 + 6 : margin
    const labelWidth = helv.widthOfTextAtSize(label, 8.5)
    drawText2(label, x, y, { size: 8.5, color: GRAY })
    drawText2(value || '—', x + labelWidth + 4, y, { size: 9.5, font: helvBold })
    drawLine2(x, y - 2.5, x + colWidth)
    if (col !== 'left') y -= rowHeight
  }
  const checkbox2 = (checked: boolean, label: string, x: number, yy: number) => {
    page2.drawRectangle({
      x,
      y: yy - 1,
      width: 8,
      height: 8,
      borderColor: DARK,
      borderWidth: 0.8,
      color: checked ? DARK : rgb(1, 1, 1),
    })
    if (checked) {
      drawText2('X', x + 1.5, yy + 0.5, {
        size: 7,
        font: helvBold,
        color: rgb(1, 1, 1),
      })
    }
    drawText2(label, x + 13, yy, { size: 9 })
  }

  drawSectionHeader2('ACCOUNTING INFORMATION')
  checkbox2(data.jobNumbersRequired, 'Job #s Required', margin, y)
  checkbox2(data.taxExempt, 'Tax Exempt (attach proper form)', margin + width / 2, y)
  y -= 20
  drawField2('Insurance Company:', safe(data.insuranceCompany))
  drawField2('Insurance Contact Person:', safe(data.insuranceContactPerson), { col: 'left' })
  drawField2('Phone No.:', safe(data.insurancePhone), { col: 'right' })
  checkbox2(data.certificateForwarded, 'Certificate of Insurance being forwarded', margin, y)
  y -= 20
  drawField2('Accounts Payable (A/P) Contact:', safe(data.apContact))
  drawField2('A/P E-mail Address:', safe(data.apEmail), { col: 'left' })
  drawField2('A/P Phone Number:', safe(data.apPhone), { col: 'right' })

  // ===== Trade References =====
  drawSectionHeader2('TRADE REFERENCES')
  const refs = [
    ...(data.tradeReferences ?? []),
    { name: '', phone: '', address: '' },
    { name: '', phone: '', address: '' },
    { name: '', phone: '', address: '' },
  ].slice(0, 3)
  const colX = [margin, margin + 170, margin + 340]
  const colW = [168, 168, width - 338]
  drawText2('NAME', colX[0], y, { size: 8.5, font: helvBold, color: GRAY })
  drawText2('PHONE', colX[1], y, { size: 8.5, font: helvBold, color: GRAY })
  drawText2('ADDRESS', colX[2], y, { size: 8.5, font: helvBold, color: GRAY })
  y -= 4
  drawLine2(margin, y, margin + width, DARK)
  y -= 14
  for (const ref of refs) {
    drawText2(safe(ref.name) || '—', colX[0], y, { size: 9 })
    drawText2(safe(ref.phone) || '—', colX[1], y, { size: 9 })
    drawText2(safe(ref.address) || '—', colX[2], y, { size: 9 })
    y -= 6
    drawLine2(colX[0], y, colX[0] + colW[0])
    drawLine2(colX[1], y, colX[1] + colW[1])
    drawLine2(colX[2], y, colX[2] + colW[2])
    y -= 14
  }

  // ===== Signature Confirmation =====
  y -= 10
  drawLine2(margin, y, margin + width, DARK)
  y -= 14
  const sigTitle = 'SIGNATURE CONFIRMATION'
  const sigTitleWidth = helvBold.widthOfTextAtSize(sigTitle, 10)
  drawText2(sigTitle, margin + (width - sigTitleWidth) / 2, y, { font: helvBold, size: 10 })
  y -= 18

  const confirmText =
    'By submitting this application online, the applicant confirms the accuracy of all information'
  const confirmText2 =
    'above and authorizes SEEK Equipment Rentals to verify the information and conduct a credit evaluation.'
  drawText2(confirmText, margin, y, { size: 9 })
  y -= 12
  drawText2(confirmText2, margin, y, { size: 9 })
  y -= 20

  checkbox2(Boolean(data.signatureConfirmed), 'I confirm the information above is true and accurate (electronic signature).', margin, y)
  y -= 24

  drawField2('Applicant Signature (typed name):', safe(data.signatureName), { col: 'left' })
  drawField2('Date:', safe(data.signatureDate), { col: 'right' })

  y -= 6
  drawText2(
    `Submitted: ${data.submittedAt.toISOString()} • Reference: ${data.referenceNumber}${data.submitterIp ? ` • IP: ${data.submitterIp}` : ''}`,
    margin,
    y,
    { size: 7.5, color: GRAY }
  )

  // Suppress unused warnings for placeholder
  void pageRef

  return pdf.save()
}

export function entityLabel(key: string | null | undefined): string {
  if (!key) return ''
  return ENTITY_LABEL[key] ?? key
}
