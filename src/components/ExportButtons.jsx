import { useState } from 'react'
import { exportToPDF, exportToExcel } from '../utils/exportHelpers'
import './ExportButtons.css'

export default function ExportButtons({ title, columns, rows, disabled = false }) {
  const [busy, setBusy] = useState(null) // 'pdf' | 'xlsx' | null

  const empty = !rows || rows.length === 0

  const handle = async (kind) => {
    if (busy || empty || disabled) return
    setBusy(kind)
    try {
      if (kind === 'pdf')  await exportToPDF({ title, columns, rows })
      if (kind === 'xlsx') await exportToExcel({ title, columns, rows })
    } catch (e) {
      console.error('Export failed:', e)
      alert('Erreur lors de l\'export. Réessayez.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="export-buttons">
      <button
        type="button"
        className="export-btn export-btn-pdf"
        onClick={() => handle('pdf')}
        disabled={busy !== null || empty || disabled}
        title={empty ? 'Aucune donnée à exporter' : 'Exporter en PDF'}
      >
        {busy === 'pdf' ? '⏳' : '📄'} PDF
      </button>
      <button
        type="button"
        className="export-btn export-btn-xlsx"
        onClick={() => handle('xlsx')}
        disabled={busy !== null || empty || disabled}
        title={empty ? 'Aucune donnée à exporter' : 'Exporter en Excel'}
      >
        {busy === 'xlsx' ? '⏳' : '📊'} Excel
      </button>
    </div>
  )
}
