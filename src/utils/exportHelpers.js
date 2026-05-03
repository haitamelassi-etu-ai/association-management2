import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

const ASSOCIATION = 'Association Al Amal — AAMH'
const LOGO_PATH = '/images/logo.png'

const today = () => {
  const d = new Date()
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const fileDate = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

// Load logo as base64 (cached after first call)
let logoBase64 = null
const loadLogo = async () => {
  if (logoBase64) return logoBase64
  try {
    const res = await fetch(LOGO_PATH)
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => { logoBase64 = reader.result; resolve(logoBase64) }
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────

export async function exportToPDF({ title, columns, rows }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  // Logo
  const logo = await loadLogo()
  if (logo) {
    try { doc.addImage(logo, 'PNG', 14, 10, 22, 22) } catch {}
  }

  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 58, 138)
  doc.text(ASSOCIATION, pageWidth / 2, 18, { align: 'center' })

  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(title, pageWidth / 2, 26, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Édité le ${today()}`, pageWidth / 2, 32, { align: 'center' })

  // Separator line
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 36, pageWidth - 14, 36)

  // Table
  autoTable(doc, {
    startY: 40,
    head: [columns.map(c => c.header)],
    body: rows.map(row => columns.map(c => {
      const val = c.accessor(row)
      return val == null || val === '' ? '—' : String(val)
    })),
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = doc.internal.getNumberOfPages()
      const currentPage = data.pageNumber
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Page ${currentPage} / ${pageCount}  —  ${ASSOCIATION}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    }
  })

  doc.save(`${slug(title)}_${fileDate()}.pdf`)
}

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

export async function exportToExcel({ title, columns, rows }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = ASSOCIATION
  wb.created = new Date()

  const ws = wb.addWorksheet(title.substring(0, 30), {
    pageSetup: { paperSize: 9, orientation: 'landscape' }
  })

  // Logo (if loadable as image)
  try {
    const logo = await loadLogo()
    if (logo) {
      const imageId = wb.addImage({ base64: logo, extension: 'png' })
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 80, height: 80 } })
    }
  } catch {}

  // Header rows
  ws.mergeCells(1, 2, 1, columns.length)
  const headerCell = ws.getCell(1, 2)
  headerCell.value = ASSOCIATION
  headerCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A8A' } }
  headerCell.alignment = { vertical: 'middle', horizontal: 'center' }

  ws.mergeCells(2, 2, 2, columns.length)
  const titleCell = ws.getCell(2, 2)
  titleCell.value = title
  titleCell.font = { bold: true, size: 13, color: { argb: 'FF0F172A' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  ws.mergeCells(3, 2, 3, columns.length)
  const dateCell = ws.getCell(3, 2)
  dateCell.value = `Édité le ${today()}`
  dateCell.font = { italic: true, size: 10, color: { argb: 'FF64748B' } }
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' }

  ws.getRow(1).height = 28
  ws.getRow(2).height = 22
  ws.getRow(3).height = 18
  ws.getRow(4).height = 10 // spacer

  // Column headers
  const headerRow = ws.addRow(columns.map(c => c.header))
  headerRow.eachCell((cell) => {
    cell.fill     = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }
    cell.font     = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border   = { bottom: { style: 'thin', color: { argb: 'FF1E3A8A' } } }
  })

  // Data rows
  rows.forEach((row, i) => {
    const dataRow = ws.addRow(columns.map(c => c.accessor(row) ?? '—'))
    if (i % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }
    dataRow.eachCell((cell) => {
      cell.alignment = { vertical: 'middle' }
      cell.font = { size: 10 }
    })
  })

  // Auto-width columns
  columns.forEach((col, i) => {
    const colObj = ws.getColumn(i + 1)
    let maxLen = col.header.length
    rows.forEach(r => {
      const v = String(col.accessor(r) ?? '')
      if (v.length > maxLen) maxLen = v.length
    })
    colObj.width = Math.min(Math.max(maxLen + 4, 12), 40)
  })

  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${slug(title)}_${fileDate()}.xlsx`)
}
