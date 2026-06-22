import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib'

/**
 * Small auto-paginating PDF builder shared by the onboarding document PDFs
 * (ACH authorization, lease agreement & guaranty). Tracks a running y-cursor
 * and adds a new page when content would overflow the bottom margin.
 *
 * WinAnsi/Helvetica only — pass plain ASCII text (no Unicode checkmarks).
 */

export const PDF_COLORS = {
  orange: rgb(0.933, 0.333, 0.098),
  dark: rgb(0.12, 0.16, 0.22),
  gray: rgb(0.45, 0.5, 0.55),
  line: rgb(0.8, 0.82, 0.85),
  white: rgb(1, 1, 1),
} as const

type Color = ReturnType<typeof rgb>

interface TextOpts {
  font?: PDFFont
  size?: number
  color?: Color
}

const PAGE = { w: 612, h: 792 } // US Letter
const MARGIN = 50

export interface PdfDoc {
  readonly helv: PDFFont
  readonly bold: PDFFont
  readonly margin: number
  readonly contentWidth: number
  y: number
  /** Raw text draw at an absolute (x, y) on the current page. */
  draw(text: string, x: number, yy: number, opts?: TextOpts): void
  /** Horizontal rule on the current page at the given y. */
  rule(x1: number, yy: number, x2: number, color?: Color): void
  /** Ensure `height` pts of vertical space remain; add a page otherwise. */
  ensure(height: number): void
  /** Advance the cursor down by `h` pts (adds a page if needed). */
  space(h: number): void
  /** Centered document title. */
  title(text: string, size?: number): void
  /** Centered subtitle (gray). */
  subtitle(text: string, size?: number): void
  /** Full-width section header with a rule above it. */
  sectionHeader(label: string): void
  /** Word-wrapped paragraph. Optional left-indent and leading number/heading. */
  paragraph(
    text: string,
    opts?: { size?: number; font?: PDFFont; indent?: number; gapAfter?: number; color?: Color }
  ): void
  /** Numbered clause: bold number in the gutter, wrapped body. */
  clause(num: string, text: string, opts?: { size?: number }): void
  /** Indented list item (e.g. "(a) ..."). */
  item(text: string, opts?: { size?: number; indent?: number }): void
  /** Label + value field on a printed underline (full / left / right column). */
  field(label: string, value: string, opts?: { col?: 'full' | 'left' | 'right'; rowHeight?: number }): void
  /** Square checkbox + label at an absolute x on the current line. */
  checkbox(checked: boolean, label: string, x: number): void
  /** A labelled signature line (underline with caption below). */
  signatureLine(label: string, value: string, opts?: { col?: 'full' | 'left' | 'right' }): void
  /**
   * Like signatureLine but renders a drawn signature PNG (data URL) above the
   * line, falling back to the typed name when no image is supplied.
   */
  embedSignature(
    label: string,
    pngDataUrl: string | null | undefined,
    typedName: string,
    opts?: { col?: 'full' | 'left' | 'right' }
  ): Promise<void>
  save(): Promise<Uint8Array>
}

export async function createPdfDoc(meta: {
  title: string
  submittedAt: Date
}): Promise<PdfDoc> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(meta.title)
  pdf.setAuthor('SEEK Equipment')
  pdf.setProducer('SEEK Equipment Portal')
  pdf.setCreationDate(meta.submittedAt)

  const helv = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  const contentWidth = PAGE.w - MARGIN * 2
  let page: PDFPage = pdf.addPage([PAGE.w, PAGE.h])
  let y = PAGE.h - MARGIN

  const newPage = () => {
    page = pdf.addPage([PAGE.w, PAGE.h])
    y = PAGE.h - MARGIN
  }

  const wrap = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
    const out: string[] = []
    for (const rawLine of text.split('\n')) {
      const words = rawLine.split(/\s+/).filter(Boolean)
      let line = ''
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
          out.push(line)
          line = word
        } else {
          line = candidate
        }
      }
      out.push(line)
    }
    return out
  }

  const draw: PdfDoc['draw'] = (text, x, yy, opts = {}) => {
    page.drawText(text, {
      x,
      y: yy,
      size: opts.size ?? 9,
      font: opts.font ?? helv,
      color: opts.color ?? PDF_COLORS.dark,
    })
  }

  const rule: PdfDoc['rule'] = (x1, yy, x2, color = PDF_COLORS.line) => {
    page.drawLine({ start: { x: x1, y: yy }, end: { x: x2, y: yy }, thickness: 0.5, color })
  }

  const ensure: PdfDoc['ensure'] = (height) => {
    if (y - height < MARGIN) newPage()
  }

  const space: PdfDoc['space'] = (h) => {
    y -= h
    if (y < MARGIN) newPage()
  }

  const doc: PdfDoc = {
    helv,
    bold,
    margin: MARGIN,
    contentWidth,
    get y() {
      return y
    },
    set y(value: number) {
      y = value
    },
    draw,
    rule,
    ensure,
    space,

    title(text, size = 14) {
      ensure(size + 8)
      const tw = bold.widthOfTextAtSize(text, size)
      draw(text, MARGIN + (contentWidth - tw) / 2, y, { font: bold, size })
      y -= size + 4
    },

    subtitle(text, size = 9) {
      ensure(size + 6)
      const tw = helv.widthOfTextAtSize(text, size)
      draw(text, MARGIN + (contentWidth - tw) / 2, y, { size, color: PDF_COLORS.gray })
      y -= size + 4
    },

    sectionHeader(label) {
      ensure(28)
      rule(MARGIN, y, MARGIN + contentWidth, PDF_COLORS.dark)
      y -= 14
      const tw = bold.widthOfTextAtSize(label, 10)
      draw(label, MARGIN + (contentWidth - tw) / 2, y, { font: bold, size: 10 })
      y -= 12
    },

    paragraph(text, opts = {}) {
      const size = opts.size ?? 9
      const font = opts.font ?? helv
      const indent = opts.indent ?? 0
      const lines = wrap(text, font, size, contentWidth - indent)
      for (const line of lines) {
        ensure(size + 3)
        draw(line, MARGIN + indent, y, { size, font, color: opts.color })
        y -= size + 3
      }
      y -= opts.gapAfter ?? 5
    },

    clause(num, text, opts = {}) {
      const size = opts.size ?? 9
      const gutter = 22
      const lines = wrap(text, helv, size, contentWidth - gutter)
      ensure(size + 3)
      draw(num, MARGIN, y, { size, font: bold })
      let first = true
      for (const line of lines) {
        if (!first) ensure(size + 3)
        draw(line, MARGIN + gutter, y, { size })
        y -= size + 3
        first = false
      }
      y -= 5
    },

    item(text, opts = {}) {
      const size = opts.size ?? 9
      const indent = opts.indent ?? 18
      const lines = wrap(text, helv, size, contentWidth - indent)
      for (const line of lines) {
        ensure(size + 3)
        draw(line, MARGIN + indent, y, { size })
        y -= size + 3
      }
      y -= 4
    },

    field(label, value, opts = {}) {
      const col = opts.col ?? 'full'
      const rowHeight = opts.rowHeight ?? 18
      ensure(rowHeight + 2)
      const colWidth = col === 'full' ? contentWidth : contentWidth / 2 - 6
      const x = col === 'right' ? MARGIN + contentWidth / 2 + 6 : MARGIN
      const labelWidth = helv.widthOfTextAtSize(label, 8.5)
      draw(label, x, y, { size: 8.5, color: PDF_COLORS.gray })
      draw(value || '-', x + labelWidth + 4, y, { size: 9.5, font: bold })
      rule(x, y - 2.5, x + colWidth)
      if (col !== 'left') y -= rowHeight
    },

    checkbox(checked, label, x) {
      page.drawRectangle({
        x,
        y: y - 1,
        width: 8,
        height: 8,
        borderColor: PDF_COLORS.dark,
        borderWidth: 0.8,
        color: checked ? PDF_COLORS.dark : PDF_COLORS.white,
      })
      if (checked) {
        draw('X', x + 1.5, y + 0.5, { size: 7, font: bold, color: PDF_COLORS.white })
      }
      draw(label, x + 13, y, { size: 9 })
    },

    signatureLine(label, value, opts = {}) {
      const col = opts.col ?? 'full'
      ensure(28)
      const colWidth = col === 'full' ? contentWidth : contentWidth / 2 - 12
      const x = col === 'right' ? MARGIN + contentWidth / 2 + 12 : MARGIN
      draw(value || '', x, y, { size: 11, font: bold })
      rule(x, y - 3, x + colWidth, PDF_COLORS.dark)
      draw(label, x, y - 13, { size: 7.5, color: PDF_COLORS.gray })
      if (col !== 'left') y -= 32
    },

    async embedSignature(label, pngDataUrl, typedName, opts = {}) {
      const col = opts.col ?? 'full'
      ensure(46)
      const colWidth = col === 'full' ? contentWidth : contentWidth / 2 - 12
      const x = col === 'right' ? MARGIN + contentWidth / 2 + 12 : MARGIN
      const prefix = 'data:image/png;base64,'
      let drewImage = false
      if (pngDataUrl && pngDataUrl.startsWith(prefix)) {
        try {
          const bytes = Uint8Array.from(Buffer.from(pngDataUrl.slice(prefix.length), 'base64'))
          const png = await pdf.embedPng(bytes)
          const maxW = Math.min(colWidth, 190)
          const maxH = 32
          const scale = Math.min(maxW / png.width, maxH / png.height, 1)
          page.drawImage(png, {
            x,
            y: y - png.height * scale + 6,
            width: png.width * scale,
            height: png.height * scale,
          })
          drewImage = true
        } catch {
          drewImage = false
        }
      }
      if (!drewImage) {
        draw(typedName || '', x, y, { size: 11, font: bold })
      }
      rule(x, y - 3, x + colWidth, PDF_COLORS.dark)
      draw(label, x, y - 13, { size: 7.5, color: PDF_COLORS.gray })
      if (drewImage && typedName) {
        draw(typedName, x, y - 22, { size: 7.5, color: PDF_COLORS.gray })
      }
      if (col !== 'left') y -= 40
    },

    save() {
      return pdf.save()
    },
  }

  return doc
}
