import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { API_URL } from '../utils/api'
import ProfessionalLayout from './ProfessionalLayout'
import ExportButtons from '../components/ExportButtons'
import './StockHistory.css'

const ACTION_LABELS = {
  create:  { label: 'Création',    icon: '➕', cls: 'sh-act-create' },
  add:     { label: 'Ajout',       icon: '🟢', cls: 'sh-act-add' },
  remove:  { label: 'Retrait',     icon: '🔴', cls: 'sh-act-remove' },
  consume: { label: 'Consommé',    icon: '🍽️', cls: 'sh-act-consume' },
  update:  { label: 'Modification', icon: '✏️', cls: 'sh-act-update' },
  delete:  { label: 'Suppression', icon: '🗑️', cls: 'sh-act-delete' },
}

const TYPE_LABELS = {
  food:    { label: 'Alimentaire', icon: '🍎', cls: 'sh-type-food' },
  medical: { label: 'Médical',     icon: '🏥', cls: 'sh-type-medical' },
}

const fmtDateTime = (d) => d
  ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  : '—'

const HISTORY_EXPORT_COLUMNS = [
  { header: 'Date',     accessor: r => fmtDateTime(r.createdAt) },
  { header: 'Type',     accessor: r => TYPE_LABELS[r.itemType]?.label || r.itemType },
  { header: 'Article',  accessor: r => r.itemName },
  { header: 'Action',   accessor: r => ACTION_LABELS[r.action]?.label || r.action },
  { header: 'Avant',    accessor: r => r.quantityBefore != null ? `${r.quantityBefore} ${r.unite || ''}`.trim() : '' },
  { header: 'Après',    accessor: r => r.quantityAfter != null ? `${r.quantityAfter} ${r.unite || ''}`.trim() : '' },
  { header: 'Variation', accessor: r => r.quantityChange != null ? (r.quantityChange > 0 ? `+${r.quantityChange}` : `${r.quantityChange}`) : '' },
  { header: 'Raison',   accessor: r => r.reason },
  { header: 'Par',      accessor: r => r.performedBy?.name || '—' },
  { header: 'Rôle',     accessor: r => r.performedBy?.role || '' },
]

export default function StockHistory() {
  const [items, setItems]       = useState([])
  const [pagination, setPag]    = useState({ total: 0, page: 1, pages: 1 })
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({
    itemType: '',
    action:   '',
    search:   '',
    dateFrom: '',
    dateTo:   '',
    page: 1,
    limit: 50
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })

      const [list, st] = await Promise.all([
        axios.get(`${API_URL}/stock-movements?${params.toString()}`),
        axios.get(`${API_URL}/stock-movements/stats`)
      ])

      setItems(list.data.data || [])
      setPag(list.data.pagination || { total: 0, page: 1, pages: 1 })
      setStats(st.data.data || null)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }))
  const goPage = (p) => setFilters(f => ({ ...f, page: p }))

  const reset = () => setFilters({ itemType: '', action: '', search: '', dateFrom: '', dateTo: '', page: 1, limit: 50 })

  const hasFilters = filters.itemType || filters.action || filters.search || filters.dateFrom || filters.dateTo

  return (
    <ProfessionalLayout>
      <div className="sh-page">
        {/* Header */}
        <div className="sh-header">
          <div>
            <h1>📜 Historique des mouvements</h1>
            <p>Traçabilité complète des entrées et sorties du stock</p>
          </div>
          <div className="sh-header-actions">
            <ExportButtons title="Historique des mouvements" columns={HISTORY_EXPORT_COLUMNS} rows={items} />
            <button className="sh-btn-refresh" onClick={load}>🔄 Actualiser</button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="sh-stats">
            <div className="sh-stat sh-stat-blue">
              <span className="sh-stat-icon">📊</span>
              <div><div className="sh-stat-value">{stats.total}</div><div className="sh-stat-label">Total mouvements</div></div>
            </div>
            <div className="sh-stat sh-stat-green">
              <span className="sh-stat-icon">📈</span>
              <div><div className="sh-stat-value">{stats.last7days}</div><div className="sh-stat-label">7 derniers jours</div></div>
            </div>
            <div className="sh-stat sh-stat-orange">
              <span className="sh-stat-icon">🍎</span>
              <div><div className="sh-stat-value">{stats.byType?.food || 0}</div><div className="sh-stat-label">Stock alimentaire</div></div>
            </div>
            <div className="sh-stat sh-stat-purple">
              <span className="sh-stat-icon">🏥</span>
              <div><div className="sh-stat-value">{stats.byType?.medical || 0}</div><div className="sh-stat-label">Stock médical</div></div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="sh-filters">
          <input
            className="sh-search"
            placeholder="🔍 Rechercher (article, raison, utilisateur…)"
            value={filters.search}
            onChange={e => setF('search', e.target.value)}
          />
          <select value={filters.itemType} onChange={e => setF('itemType', e.target.value)}>
            <option value="">Tous les types</option>
            <option value="food">🍎 Alimentaire</option>
            <option value="medical">🏥 Médical</option>
          </select>
          <select value={filters.action} onChange={e => setF('action', e.target.value)}>
            <option value="">Toutes les actions</option>
            {Object.entries(ACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setF('dateFrom', e.target.value)}
            title="Date début"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setF('dateTo', e.target.value)}
            title="Date fin"
          />
          {hasFilters && (
            <button className="sh-btn-clear" onClick={reset}>✕ Réinitialiser</button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="sh-loading"><div className="sh-spinner" /><p>Chargement…</p></div>
        ) : items.length === 0 ? (
          <div className="sh-empty">
            <p>📭 Aucun mouvement trouvé</p>
            <small>Les mouvements apparaîtront dès qu'un article sera ajouté, modifié ou supprimé.</small>
          </div>
        ) : (
          <>
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Article</th>
                    <th>Action</th>
                    <th>Variation</th>
                    <th>Raison</th>
                    <th>Par</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => {
                    const a = ACTION_LABELS[m.action] || { label: m.action, icon: '•', cls: '' }
                    const t = TYPE_LABELS[m.itemType]  || { label: m.itemType, icon: '•', cls: '' }
                    const change = m.quantityChange
                    return (
                      <tr key={m._id}>
                        <td className="sh-date">{fmtDateTime(m.createdAt)}</td>
                        <td><span className={`sh-badge ${t.cls}`}>{t.icon} {t.label}</span></td>
                        <td className="sh-item-name">{m.itemName}</td>
                        <td><span className={`sh-badge ${a.cls}`}>{a.icon} {a.label}</span></td>
                        <td>
                          {change != null && change !== 0 ? (
                            <span className={`sh-change ${change > 0 ? 'sh-change-pos' : 'sh-change-neg'}`}>
                              {change > 0 ? '+' : ''}{change} {m.unite || ''}
                            </span>
                          ) : (
                            <span className="sh-muted">—</span>
                          )}
                        </td>
                        <td className="sh-reason">{m.reason || <span className="sh-muted">—</span>}</td>
                        <td>
                          <div className="sh-user">
                            <div className="sh-user-name">{m.performedBy?.name || 'Système'}</div>
                            {m.performedBy?.role && <div className="sh-user-role">{m.performedBy.role}</div>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="sh-pagination">
                <button onClick={() => goPage(pagination.page - 1)} disabled={pagination.page <= 1}>← Précédent</button>
                <span>Page {pagination.page} / {pagination.pages} <small>({pagination.total} entrées)</small></span>
                <button onClick={() => goPage(pagination.page + 1)} disabled={pagination.page >= pagination.pages}>Suivant →</button>
              </div>
            )}
          </>
        )}
      </div>
    </ProfessionalLayout>
  )
}
