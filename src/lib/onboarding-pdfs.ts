import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'

const ORANGE = rgb(0.933, 0.333, 0.098)
const DARK = rgb(0.12, 0.16, 0.22)
const GRAY = rgb(0.45, 0.5, 0.55)
const LINE = rgb(0.8, 0.82, 0.85)
const HIGHLIGHT = rgb(1, 0.96, 0.86)

const MARGIN = 42
const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

interface PdfContext {
  pdf: PDFDocument
  helv: PDFFont
  helvBold: PDFFont
  page: PDFPage
  y: number
}

async function newDoc(title: string): Promise<PdfContext> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(title)
  pdf.setAuthor('SEEK Equipment Rentals')
  pdf.setProducer('SEEK Equipment Customer Portal')
  pdf.setCreationDate(new Date())

  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  return { pdf, helv, helvBold, page, y: PAGE_HEIGHT - MARGIN }
}

function newPage(ctx: PdfContext): void {
  ctx.page = ctx.pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  ctx.y = PAGE_HEIGHT - MARGIN
}

function ensureSpace(ctx: PdfContext, needed: number): void {
  if (ctx.y - needed < MARGIN) {
    newPage(ctx)
  }
}

function drawText(
  ctx: PdfContext,
  text: string,
  x: number,
  y: number,
  opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb> } = {}
): void {
  ctx.page.drawText(text, {
    x,
    y,
    size: opts.size ?? 10,
    font: opts.font ?? ctx.helv,
    color: opts.color ?? DARK,
  })
}

function drawLine(
  ctx: PdfContext,
  x1: number,
  yy: number,
  x2: number,
  color: ReturnType<typeof rgb> = LINE
): void {
  ctx.page.drawLine({
    start: { x: x1, y: yy },
    end: { x: x2, y: yy },
    thickness: 0.5,
    color,
  })
}

function drawHeader(ctx: PdfContext, subtitle: string, reference: string): void {
  // Brand bar
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 36,
    width: PAGE_WIDTH,
    height: 36,
    color: ORANGE,
  })
  drawText(ctx, 'SEEK EQUIPMENT RENTALS', MARGIN, PAGE_HEIGHT - 22, {
    font: ctx.helvBold,
    size: 13,
    color: rgb(1, 1, 1),
  })
  drawText(ctx, `Reference: ${reference}`, PAGE_WIDTH - MARGIN - 140, PAGE_HEIGHT - 22, {
    size: 9,
    color: rgb(1, 1, 1),
  })

  ctx.y = PAGE_HEIGHT - 60
  drawText(ctx, subtitle, MARGIN, ctx.y, {
    font: ctx.helvBold,
    size: 16,
    color: DARK,
  })
  ctx.y -= 8
  drawLine(ctx, MARGIN, ctx.y, MARGIN + CONTENT_WIDTH, ORANGE)
  ctx.y -= 16
}

function drawSection(ctx: PdfContext, label: string): void {
  ensureSpace(ctx, 24)
  ctx.y -= 4
  drawText(ctx, label.toUpperCase(), MARGIN, ctx.y, {
    font: ctx.helvBold,
    size: 10,
    color: ORANGE,
  })
  ctx.y -= 4
  drawLine(ctx, MARGIN, ctx.y, MARGIN + CONTENT_WIDTH)
  ctx.y -= 14
}

function drawField(ctx: PdfContext, label: string, value: string, col = 0, cols = 2): void {
  const colWidth = CONTENT_WIDTH / cols
  const x = MARGIN + col * colWidth
  drawText(ctx, label, x, ctx.y, { size: 8, color: GRAY })
  drawText(ctx, value || '—', x, ctx.y - 11, { size: 10, color: DARK })
  if (col === cols - 1) {
    ctx.y -= 26
  }
}

function wrapText(
  ctx: PdfContext,
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(test, size) > maxWidth) {
        if (current) lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

function drawParagraph(ctx: PdfContext, text: string, size = 9.5): void {
  const lines = wrapText(ctx, text, ctx.helv, size, CONTENT_WIDTH)
  for (const line of lines) {
    ensureSpace(ctx, size + 4)
    drawText(ctx, line, MARGIN, ctx.y, { size })
    ctx.y -= size + 3
  }
  ctx.y -= 4
}

function drawPlaceholderBanner(ctx: PdfContext): void {
  ensureSpace(ctx, 38)
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 32,
    width: CONTENT_WIDTH,
    height: 32,
    color: HIGHLIGHT,
    borderColor: ORANGE,
    borderWidth: 0.6,
  })
  drawText(ctx, 'PLACEHOLDER LEGAL TEXT — REPLACE BEFORE PRODUCTION USE', MARGIN + 10, ctx.y - 13, {
    font: ctx.helvBold,
    size: 9,
    color: ORANGE,
  })
  drawText(
    ctx,
    'This document uses placeholder language until the final approved template is uploaded by SEEK administration.',
    MARGIN + 10,
    ctx.y - 25,
    { size: 8, color: DARK }
  )
  ctx.y -= 44
}

function drawSignatureBlock(
  ctx: PdfContext,
  signedName: string,
  signedAt: Date,
  email: string,
  ip: string | null
): void {
  drawSection(ctx, 'Electronic Signature')
  ensureSpace(ctx, 80)

  drawField(ctx, 'Signed by (typed full name)', signedName, 0, 2)
  drawField(ctx, 'Date signed', signedAt.toLocaleString('en-US'), 1, 2)
  drawField(ctx, 'Email of record', email, 0, 2)
  drawField(ctx, 'IP address', ip ?? '—', 1, 2)

  ensureSpace(ctx, 40)
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - 30,
    width: CONTENT_WIDTH,
    height: 30,
    color: rgb(0.95, 0.97, 0.99),
    borderColor: LINE,
    borderWidth: 0.5,
  })
  drawText(
    ctx,
    `[X]  I, ${signedName}, agree to be bound by the terms of this document and confirm that this electronic signature has the same legal force as a handwritten signature.`,
    MARGIN + 10,
    ctx.y - 19,
    { size: 9, color: DARK }
  )
  ctx.y -= 44
}

function drawFooter(ctx: PdfContext): void {
  for (let i = 0; i < ctx.pdf.getPageCount(); i++) {
    const page = ctx.pdf.getPage(i)
    page.drawText(
      'SEEK Equipment Rentals  •  info@seekequipment.com  •  (210) 802-0000  •  Generated by the Customer Portal',
      {
        x: MARGIN,
        y: 24,
        size: 7.5,
        font: ctx.helv,
        color: GRAY,
      }
    )
    page.drawText(`Page ${i + 1} of ${ctx.pdf.getPageCount()}`, {
      x: PAGE_WIDTH - MARGIN - 60,
      y: 24,
      size: 7.5,
      font: ctx.helv,
      color: GRAY,
    })
  }
}

/* ------------------------------------------------------------------ */
/*  ACH Authorization PDF                                             */
/* ------------------------------------------------------------------ */

export interface AchPdfInput {
  reference: string
  companyName: string | null
  contactName: string
  email: string
  phone: string | null
  bankName: string
  routingLast4: string
  accountLast4: string
  accountType: 'checking' | 'savings'
  authorizedName: string
  authorizedAt: Date
  ip: string | null
}

export async function buildAchAuthorizationPdf(data: AchPdfInput): Promise<Uint8Array> {
  const ctx = await newDoc(`ACH Authorization — ${data.companyName ?? data.contactName}`)
  drawHeader(ctx, 'ACH Debit Authorization', data.reference)

  drawSection(ctx, 'Applicant')
  drawField(ctx, 'Company / Account Holder', data.companyName ?? '—', 0, 2)
  drawField(ctx, 'Contact Name', data.contactName, 1, 2)
  drawField(ctx, 'Email', data.email, 0, 2)
  drawField(ctx, 'Phone', data.phone ?? '—', 1, 2)

  drawSection(ctx, 'Banking Details (last four digits only)')
  drawField(ctx, 'Bank Name', data.bankName, 0, 2)
  drawField(ctx, 'Account Type', data.accountType.toUpperCase(), 1, 2)
  drawField(ctx, 'Routing Number', `*****${data.routingLast4}`, 0, 2)
  drawField(ctx, 'Account Number', `*********${data.accountLast4}`, 1, 2)

  drawSection(ctx, 'Authorization')
  drawPlaceholderBanner(ctx)
  drawParagraph(
    ctx,
    `By signing below, the undersigned authorizes SEEK Equipment Rentals (the "Company") to initiate electronic debit entries to the account identified above for amounts due under any rental, lease, or service agreement between the undersigned and the Company. The undersigned represents that they are an authorized signer on the named account and have the authority to grant this authorization.`
  )
  drawParagraph(
    ctx,
    `This authorization shall remain in full force and effect until the Company has received written notification from the undersigned of its termination in such time and manner as to afford the Company and the depository institution a reasonable opportunity to act on it. In the event any debit entry is returned unpaid, the undersigned shall remain liable for the amount of the entry plus any applicable returned-item fees.`
  )
  drawParagraph(
    ctx,
    `The undersigned acknowledges that ACH transactions are governed by the rules and regulations of the National Automated Clearing House Association (NACHA) and applicable federal and state law.`
  )

  drawSignatureBlock(ctx, data.authorizedName, data.authorizedAt, data.email, data.ip)
  drawFooter(ctx)
  return ctx.pdf.save()
}

/* ------------------------------------------------------------------ */
/*  Lease Agreement PDF                                               */
/* ------------------------------------------------------------------ */

export interface LeasePdfInput {
  reference: string
  companyName: string | null
  contactName: string
  email: string
  phone: string | null
  signedName: string
  signedAt: Date
  ip: string | null
}

export async function buildLeaseAgreementPdf(data: LeasePdfInput): Promise<Uint8Array> {
  const ctx = await newDoc(`Equipment Rental Agreement — ${data.companyName ?? data.contactName}`)
  drawHeader(ctx, 'Equipment Rental Agreement', data.reference)

  drawSection(ctx, 'Lessee')
  drawField(ctx, 'Company / Lessee', data.companyName ?? '—', 0, 2)
  drawField(ctx, 'Contact Name', data.contactName, 1, 2)
  drawField(ctx, 'Email', data.email, 0, 2)
  drawField(ctx, 'Phone', data.phone ?? '—', 1, 2)

  drawSection(ctx, 'Master Rental Terms')
  drawPlaceholderBanner(ctx)
  drawParagraph(
    ctx,
    `This Equipment Rental Agreement (the "Agreement") is entered into by and between SEEK Equipment Rentals ("Lessor") and the party identified above ("Lessee"). Subject to the terms set forth below, Lessor agrees to rent to Lessee, and Lessee agrees to rent from Lessor, the trailers and related equipment as listed in one or more rental orders or invoices issued under this Agreement (collectively, the "Equipment").`
  )
  drawParagraph(
    ctx,
    `1. TERM. The rental term for each unit of Equipment shall begin on the date such unit is delivered to Lessee or otherwise placed at Lessee's disposal and shall continue on a month-to-month basis until terminated by either party upon thirty (30) days' written notice, unless an earlier termination is permitted under this Agreement.`
  )
  drawParagraph(
    ctx,
    `2. RENT AND PAYMENT. Lessee shall pay rent at the rate set forth on the applicable rental order or invoice. Rent is due in advance on the first day of each rental period. All amounts not paid when due shall bear interest at the lesser of 1.5% per month or the maximum rate permitted by law.`
  )
  drawParagraph(
    ctx,
    `3. USE AND MAINTENANCE. Lessee shall use the Equipment only in the ordinary course of its business, shall comply with all applicable laws and manufacturer specifications, and shall maintain the Equipment in good operating condition, ordinary wear and tear excepted. Lessee shall not sublease, assign, or otherwise transfer the Equipment without Lessor's prior written consent.`
  )
  drawParagraph(
    ctx,
    `4. INSURANCE. Lessee shall, at its sole expense, maintain commercial general liability and physical damage insurance covering the Equipment in amounts not less than those specified by Lessor from time to time, and shall name Lessor as an additional insured and loss payee. Lessee shall provide Lessor with a current certificate of insurance prior to taking possession of any Equipment.`
  )
  drawParagraph(
    ctx,
    `5. RISK OF LOSS. From the time the Equipment is delivered to Lessee until it is returned to Lessor's designated yard, Lessee bears the entire risk of loss, theft, damage, or destruction of the Equipment from any cause whatsoever.`
  )
  drawParagraph(
    ctx,
    `6. RETURN. Upon the expiration or termination of the rental term for any unit of Equipment, Lessee shall return such unit to Lessor's designated yard in the same condition as when received, ordinary wear and tear excepted, free of any liens or encumbrances.`
  )
  drawParagraph(
    ctx,
    `7. DEFAULT AND REMEDIES. If Lessee fails to pay any amount when due or otherwise breaches this Agreement, Lessor may (a) declare all amounts payable under this Agreement immediately due and payable, (b) take possession of the Equipment without liability for trespass, and (c) exercise any other remedy available at law or in equity. The remedies of Lessor are cumulative and not exclusive.`
  )
  drawParagraph(
    ctx,
    `8. GOVERNING LAW. This Agreement shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict-of-laws principles. Any disputes arising under this Agreement shall be brought exclusively in the state or federal courts located in Bexar County, Texas.`
  )

  drawSignatureBlock(ctx, data.signedName, data.signedAt, data.email, data.ip)
  drawFooter(ctx)
  return ctx.pdf.save()
}

/* ------------------------------------------------------------------ */
/*  Personal Guaranty PDF                                             */
/* ------------------------------------------------------------------ */

export interface GuarantyPdfInput {
  reference: string
  companyName: string | null
  guarantorName: string
  email: string
  phone: string | null
  signedAt: Date
  ip: string | null
}

export async function buildPersonalGuarantyPdf(data: GuarantyPdfInput): Promise<Uint8Array> {
  const ctx = await newDoc(`Personal Guaranty — ${data.guarantorName}`)
  drawHeader(ctx, 'Personal Guaranty', data.reference)

  drawSection(ctx, 'Guarantor')
  drawField(ctx, 'Guarantor Name', data.guarantorName, 0, 2)
  drawField(ctx, 'Business Account', data.companyName ?? '—', 1, 2)
  drawField(ctx, 'Email', data.email, 0, 2)
  drawField(ctx, 'Phone', data.phone ?? '—', 1, 2)

  drawSection(ctx, 'Guaranty')
  drawPlaceholderBanner(ctx)
  drawParagraph(
    ctx,
    `For valuable consideration, the receipt and sufficiency of which are hereby acknowledged, and to induce SEEK Equipment Rentals (the "Company") to extend credit, rentals, leases, services, and other accommodations to the business account identified above (the "Debtor"), the undersigned ("Guarantor") absolutely, unconditionally, and irrevocably guarantees to the Company the full and prompt payment and performance of all present and future obligations, liabilities, and indebtedness of the Debtor to the Company of every kind and nature, however arising (the "Obligations").`
  )
  drawParagraph(
    ctx,
    `1. NATURE OF GUARANTY. This is a continuing guaranty of payment and performance, not merely of collection. The Company may proceed directly against Guarantor without first proceeding against the Debtor or any collateral securing the Obligations.`
  )
  drawParagraph(
    ctx,
    `2. WAIVER. Guarantor waives notice of acceptance of this guaranty, notice of any extensions of credit to the Debtor, demand, presentment, protest, notice of dishonor, and all other notices to which Guarantor might otherwise be entitled. Guarantor further waives any right of subrogation, contribution, or indemnification from the Debtor until all Obligations are paid in full.`
  )
  drawParagraph(
    ctx,
    `3. AMENDMENT. The Company may, without notice to or consent of Guarantor, (a) extend, renew, or modify the Obligations, (b) take, hold, exchange, enforce, waive, surrender, or release any collateral, and (c) deal with the Debtor in any manner whatsoever, all without affecting Guarantor's liability hereunder.`
  )
  drawParagraph(
    ctx,
    `4. CONTINUING NATURE. This guaranty shall remain in full force and effect until the Obligations are paid in full and shall not be revoked by Guarantor except by written notice to the Company; provided, however, that any such revocation shall not affect Guarantor's liability with respect to any Obligation existing or any commitment of the Company outstanding at the time of revocation.`
  )
  drawParagraph(
    ctx,
    `5. ATTORNEY'S FEES. Guarantor agrees to pay all costs and expenses, including reasonable attorneys' fees, incurred by the Company in enforcing this guaranty.`
  )
  drawParagraph(
    ctx,
    `6. GOVERNING LAW. This guaranty shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes arising under this guaranty shall be brought exclusively in the state or federal courts located in Bexar County, Texas. Guarantor consents to the personal jurisdiction of such courts.`
  )

  drawSignatureBlock(ctx, data.guarantorName, data.signedAt, data.email, data.ip)
  drawFooter(ctx)
  return ctx.pdf.save()
}
