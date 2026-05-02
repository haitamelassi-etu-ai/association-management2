import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_URL } from '../utils/api'
import ProfessionalLayout from '../professional/ProfessionalLayout'
import './TransportManagement.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTRETIEN_TYPES = [
  { value: 'vidange',            label: 'Vidange',             icon: '🛢️' },
  { value: 'pneus',              label: 'Pneus',               icon: '🔄' },
  { value: 'reparation',         label: 'Réparation',          icon: '🔧' },
  { value: 'revision',           label: 'Révision générale',   icon: '🔍' },
  { value: 'controle_technique', label: 'Contrôle technique',  icon: '📋' },
  { value: 'nettoyage',          label: 'Nettoyage',           icon: '🧹' },
  { value: 'carburant',          label: 'Carburant',           icon: '⛽' },
  { value: 'autre',              label: 'Autre',               icon: '⚙️' },
]

const STATUT_CONFIG = {
  actif:       { label: 'Actif',          cls: 'badge-actif',       icon: '✅' },
  maintenance: { label: 'En maintenance', cls: 'badge-maintenance', icon: '🔧' },
  inactif:     { label: 'Inactif',        cls: 'badge-inactif',     icon: '⛔' },
}

const getToken = () => {
  const t = localStorage.getItem('professionalToken')
  if (t) return t
  try { return JSON.parse(localStorage.getItem('professionalUser') || '{}').token || '' }
  catch { return '' }
}
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` })

const fmt    = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtDT  = (d) => d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const fmtMoney = (n) => n != null ? `${Number(n).toLocaleString('fr-FR')} DH` : '—'

const EMPTY_BUS = {
  matricule: '', marque: '', modele: '', annee: new Date().getFullYear(),
  capacite: 20, couleur: '', statut: 'actif',
  chauffeur: { nom: '', telephone: '', permis: '' },
  kilometrage: 0,
  assuranceExpiration: '', controleExpiration: '',
  carteGriseNumero: '', dateMiseEnCirculation: '', dateExpirationCarteGrise: '',
  notes: ''
}

const EMPTY_MAINTENANCE = {
  busId: '', type: 'vidange', description: '',
  date: new Date().toISOString().split('T')[0],
  cout: '', kilometrage: '', prestataire: '', notes: ''
}

const EMPTY_MOUCHARD = {
  busId: '', dateDepart: new Date().toISOString().slice(0, 16),
  dateRetour: '', destination: '', conducteur: '',
  kilometrageDepart: '', kilometrageRetour: '', commentaire: ''
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TransportManagement() {
  const [buses, setBuses]             = useState([])
  const [stats, setStats]             = useState(null)
  const [history, setHistory]         = useState([])
  const [mouchard, setMouchard]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [histLoading, setHistLoading] = useState(false)
  const [mouchLoading, setMouchLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('vehicles')
  const [sortField, setSortField] = useState('createdAt')
  const [sortDir, setSortDir]     = useState('desc')

  const [busFilters, setBusFilters]   = useState({ search: '', statut: '' })
  const [histFilters, setHistFilters] = useState({ busId: '', type: '', dateFrom: '', dateTo: '' })
  const [mouchFilter, setMouchFilter] = useState({ busId: '' })

  const [busModal,       setBusModal]       = useState({ open: false, editing: null })
  const [maintModal,     setMaintModal]     = useState({ open: false, busId: null, busLabel: '' })
  const [detailModal,    setDetailModal]    = useState({ open: false, bus: null })
  const [mouchModal,     setMouchModal]     = useState({ open: false, busId: null, busLabel: '' })
  const [deleteConfirm,  setDeleteConfirm]  = useState({ open: false, id: null, label: '' })

  const [busForm,   setBusForm]   = useState(EMPTY_BUS)
  const [maintForm, setMaintForm] = useState(EMPTY_MAINTENANCE)
  const [mouchForm, setMouchForm] = useState(EMPTY_MOUCHARD)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchBuses = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (busFilters.search) params.search = busFilters.search
      if (busFilters.statut) params.statut = busFilters.statut
      const { data } = await axios.get(`${API_URL}/transport`, { params, headers: authHeader() })
      setBuses(data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [busFilters])

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/transport/stats`, { headers: authHeader() })
      setStats(data.data)
    } catch (e) { console.error(e) }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistLoading(true)
    try {
      const params = {}
      if (histFilters.busId)   params.busId   = histFilters.busId
      if (histFilters.type)    params.type     = histFilters.type
      if (histFilters.dateFrom) params.dateFrom = histFilters.dateFrom
      if (histFilters.dateTo)   params.dateTo   = histFilters.dateTo
      const { data } = await axios.get(`${API_URL}/transport/maintenance/history`, { params, headers: authHeader() })
      setHistory(data.data || [])
    } catch (e) { console.error(e) }
    finally { setHistLoading(false) }
  }, [histFilters])

  const fetchMouchard = useCallback(async () => {
    setMouchLoading(true)
    try {
      if (mouchFilter.busId) {
        const { data } = await axios.get(`${API_URL}/transport/${mouchFilter.busId}/mouchard`, { headers: authHeader() })
        setMouchard(data.data || [])
      } else {
        // Fetch all buses' mouchard and flatten
        const all = []
        for (const b of buses) {
          try {
            const { data } = await axios.get(`${API_URL}/transport/${b._id}/mouchard`, { headers: authHeader() })
            ;(data.data || []).forEach(m => all.push({ ...m, bus: { _id: b._id, matricule: b.matricule, marque: b.marque } }))
          } catch {}
        }
        all.sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart))
        setMouchard(all)
      }
    } catch (e) { console.error(e) }
    finally { setMouchLoading(false) }
  }, [mouchFilter, buses])

  useEffect(() => { fetchBuses(); fetchStats() }, [fetchBuses, fetchStats])
  useEffect(() => { if (activeTab === 'maintenance') fetchHistory() }, [activeTab, fetchHistory])
  useEffect(() => { if (activeTab === 'mouchard' && buses.length > 0) fetchMouchard() }, [activeTab, fetchMouchard, buses])

  // ─── Sorting ────────────────────────────────────────────────────────────────

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedBuses = [...buses].sort((a, b) => {
    let vA = a[sortField], vB = b[sortField]
    if (sortField === 'chauffeur') { vA = a.chauffeur?.nom || ''; vB = b.chauffeur?.nom || '' }
    if (vA == null) return 1
    if (vB == null) return -1
    if (typeof vA === 'string') return sortDir === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA)
    return sortDir === 'asc' ? vA - vB : vB - vA
  })

  const SortIcon = ({ field }) => (
    <span className={`sort-icon ${sortField === field ? 'active' : ''}`}>
      {sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'}
    </span>
  )

  // ─── Bus CRUD ────────────────────────────────────────────────────────────────

  const openAddBus = () => { setBusForm(EMPTY_BUS); setBusModal({ open: false, editing: null }); setError(''); setBusModal({ open: true, editing: null }) }

  const openEditBus = (bus) => {
    setBusForm({
      matricule: bus.matricule,
      marque: bus.marque,
      modele: bus.modele || '',
      annee: bus.annee || new Date().getFullYear(),
      capacite: bus.capacite || 20,
      couleur: bus.couleur || '',
      statut: bus.statut,
      chauffeur: { nom: bus.chauffeur?.nom || '', telephone: bus.chauffeur?.telephone || '', permis: bus.chauffeur?.permis || '' },
      kilometrage: bus.kilometrage || 0,
      assuranceExpiration:    bus.assuranceExpiration    ? bus.assuranceExpiration.split('T')[0]    : '',
      controleExpiration:     bus.controleExpiration     ? bus.controleExpiration.split('T')[0]     : '',
      carteGriseNumero:       bus.carteGriseNumero       || '',
      dateMiseEnCirculation:  bus.dateMiseEnCirculation  ? bus.dateMiseEnCirculation.split('T')[0]  : '',
      dateExpirationCarteGrise: bus.dateExpirationCarteGrise ? bus.dateExpirationCarteGrise.split('T')[0] : '',
      notes: bus.notes || ''
    })
    setBusModal({ open: true, editing: bus._id })
    setError('')
  }

  const saveBus = async () => {
    if (!busForm.matricule.trim()) return setError('Le matricule est obligatoire')
    if (!busForm.marque.trim())    return setError('La marque est obligatoire')
    setSaving(true); setError('')
    try {
      if (busModal.editing) {
        await axios.put(`${API_URL}/transport/${busModal.editing}`, busForm, { headers: authHeader() })
      } else {
        await axios.post(`${API_URL}/transport`, busForm, { headers: authHeader() })
      }
      setBusModal({ open: false, editing: null })
      fetchBuses(); fetchStats()
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  const confirmDelete = (bus) => setDeleteConfirm({ open: true, id: bus._id, label: bus.matricule })

  const deleteBus = async () => {
    try {
      await axios.delete(`${API_URL}/transport/${deleteConfirm.id}`, { headers: authHeader() })
      setDeleteConfirm({ open: false, id: null, label: '' })
      if (detailModal.bus?._id === deleteConfirm.id) setDetailModal({ open: false, bus: null })
      fetchBuses(); fetchStats()
    } catch (e) { alert(e.response?.data?.message || 'Erreur lors de la suppression') }
  }

  const openDetail = async (bus) => {
    try {
      const { data } = await axios.get(`${API_URL}/transport/${bus._id}`, { headers: authHeader() })
      setDetailModal({ open: true, bus: data.data })
    } catch { setDetailModal({ open: true, bus }) }
  }

  // ─── Maintenance ────────────────────────────────────────────────────────────

  const openAddMaintenance = (bus) => {
    setMaintForm({ ...EMPTY_MAINTENANCE, busId: bus._id, kilometrage: bus.kilometrage || '' })
    setMaintModal({ open: true, busId: bus._id, busLabel: `${bus.matricule} — ${bus.marque}` })
    setError('')
  }

  const saveMaintenance = async () => {
    if (!maintForm.description.trim()) return setError('La description est obligatoire')
    if (!maintForm.date)               return setError('La date est obligatoire')
    setSaving(true); setError('')
    try {
      await axios.post(`${API_URL}/transport/${maintForm.busId}/entretien`, maintForm, { headers: authHeader() })
      setMaintModal({ open: false, busId: null, busLabel: '' })
      fetchBuses(); fetchStats()
      if (activeTab === 'maintenance') fetchHistory()
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  const deleteMaintenance = async (busId, entretienId) => {
    if (!window.confirm('Supprimer cet entretien ?')) return
    try {
      await axios.delete(`${API_URL}/transport/${busId}/entretien/${entretienId}`, { headers: authHeader() })
      if (detailModal.open) {
        const { data } = await axios.get(`${API_URL}/transport/${busId}`, { headers: authHeader() })
        setDetailModal({ open: true, bus: data.data })
      }
      fetchHistory(); fetchStats()
    } catch (e) { alert(e.response?.data?.message || 'Erreur') }
  }

  // ─── Mouchard ───────────────────────────────────────────────────────────────

  const openAddMouchard = (bus) => {
    setMouchForm({ ...EMPTY_MOUCHARD, busId: bus._id, conducteur: bus.chauffeur?.nom || '', kilometrageDepart: bus.kilometrage || '' })
    setMouchModal({ open: true, busId: bus._id, busLabel: `${bus.matricule} — ${bus.marque}` })
    setError('')
  }

  const saveMouchard = async () => {
    if (!mouchForm.destination.trim()) return setError('La destination est obligatoire')
    if (!mouchForm.dateDepart)         return setError('La date de départ est obligatoire')
    setSaving(true); setError('')
    try {
      await axios.post(`${API_URL}/transport/${mouchForm.busId}/mouchard`, mouchForm, { headers: authHeader() })
      setMouchModal({ open: false, busId: null, busLabel: '' })
      fetchBuses(); fetchMouchard()
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally { setSaving(false) }
  }

  const deleteMouchardEntry = async (busId, logId) => {
    if (!window.confirm('Supprimer cette entrée mouchard ?')) return
    try {
      await axios.delete(`${API_URL}/transport/${busId}/mouchard/${logId}`, { headers: authHeader() })
      fetchMouchard()
    } catch (e) { alert(e.response?.data?.message || 'Erreur') }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const getExpiryClass = (dateStr) => {
    if (!dateStr) return ''
    const days = (new Date(dateStr) - Date.now()) / 86400000
    if (days < 0)  return 'expiry-expired'
    if (days < 30) return 'expiry-soon'
    return 'expiry-ok'
  }

  const typeLabel = (v) => ENTRETIEN_TYPES.find(t => t.value === v)?.label || v
  const typeIcon  = (v) => ENTRETIEN_TYPES.find(t => t.value === v)?.icon  || '⚙️'

  const countsByType = stats?.maintenanceCostByType || []

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <ProfessionalLayout>
      <div className="transport-page">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="transport-header">
          <div className="transport-title">
            <h1>🚌 Gestion du Transport</h1>
            <p>Véhicules, entretiens, carte grise et suivi d'utilisation</p>
          </div>
          <button className="btn-add-bus" onClick={openAddBus}>+ Ajouter un véhicule</button>
        </div>

        {/* ── Stats cards ───────────────────────────────────────────────── */}
        <div className="transport-stats">
          {[
            { label: 'Total véhicules',       value: stats?.counts?.total       ?? '—', icon: '🚌', cls: 'stat-total' },
            { label: 'Actifs',                value: stats?.counts?.actif       ?? '—', icon: '✅', cls: 'stat-actif' },
            { label: 'En maintenance',        value: stats?.counts?.maintenance ?? '—', icon: '🔧', cls: 'stat-maintenance' },
            { label: 'Inactifs',              value: stats?.counts?.inactif     ?? '—', icon: '⛔', cls: 'stat-inactif' },
            { label: 'Coût total entretiens', value: stats ? fmtMoney(stats.totalMaintenanceCost) : '—', icon: '💰', cls: 'stat-cost' },
            { label: 'Docs expirant (30j)',   value: stats?.expiringDocs        ?? '—', icon: '⚠️', cls: 'stat-expiry' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.cls}`}>
              <span className="stat-icon">{s.icon}</span>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="transport-tabs">
          {[
            { id: 'vehicles',    label: '🚌 Véhicules' },
            { id: 'maintenance', label: '🔧 Entretiens' },
            { id: 'mouchard',    label: '🗺️ Mouchard' },
            { id: 'stats',       label: '📊 Statistiques' },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ TAB: VEHICLES ══════════════════════════════════════════════ */}
        {activeTab === 'vehicles' && (
          <div className="tab-content">
            <div className="filter-bar">
              <input className="filter-input" placeholder="🔍 Rechercher (matricule, marque, chauffeur…)"
                value={busFilters.search} onChange={e => setBusFilters(f => ({ ...f, search: e.target.value }))} />
              <select className="filter-select" value={busFilters.statut} onChange={e => setBusFilters(f => ({ ...f, statut: e.target.value }))}>
                <option value="">Tous les statuts</option>
                {Object.entries(STATUT_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.icon} {c.label}</option>)}
              </select>
              <button className="btn-filter" onClick={fetchBuses}>Appliquer</button>
              <button className="btn-reset" onClick={() => setBusFilters({ search: '', statut: '' })}>Réinitialiser</button>
            </div>

            {loading ? (
              <div className="loading-state">⏳ Chargement…</div>
            ) : sortedBuses.length === 0 ? (
              <div className="empty-state">
                <span>🚌</span>
                <p>Aucun véhicule trouvé. <button className="link-btn" onClick={openAddBus}>Ajouter le premier</button></p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="transport-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('matricule')} className="sortable">Matricule <SortIcon field="matricule" /></th>
                      <th onClick={() => handleSort('marque')}    className="sortable">Marque / Modèle <SortIcon field="marque" /></th>
                      <th onClick={() => handleSort('annee')}     className="sortable">Année <SortIcon field="annee" /></th>
                      <th onClick={() => handleSort('chauffeur')} className="sortable">Chauffeur <SortIcon field="chauffeur" /></th>
                      <th onClick={() => handleSort('kilometrage')} className="sortable">Km <SortIcon field="kilometrage" /></th>
                      <th>Assurance</th>
                      <th>Contrôle</th>
                      <th>Carte grise</th>
                      <th onClick={() => handleSort('statut')} className="sortable">Statut <SortIcon field="statut" /></th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBuses.map(bus => {
                      const sc = STATUT_CONFIG[bus.statut] || STATUT_CONFIG.inactif
                      return (
                        <tr key={bus._id} className="bus-row">
                          <td><strong>{bus.matricule}</strong></td>
                          <td>{bus.marque}{bus.modele ? ` — ${bus.modele}` : ''}</td>
                          <td>{bus.annee || '—'}</td>
                          <td>{bus.chauffeur?.nom || <span className="text-muted">Non assigné</span>}</td>
                          <td>{bus.kilometrage?.toLocaleString('fr-FR')} km</td>
                          <td><span className={`expiry-tag ${getExpiryClass(bus.assuranceExpiration)}`}>{fmt(bus.assuranceExpiration)}</span></td>
                          <td><span className={`expiry-tag ${getExpiryClass(bus.controleExpiration)}`}>{fmt(bus.controleExpiration)}</span></td>
                          <td><span className={`expiry-tag ${getExpiryClass(bus.dateExpirationCarteGrise)}`}>{fmt(bus.dateExpirationCarteGrise)}</span></td>
                          <td><span className={`status-badge ${sc.cls}`}>{sc.icon} {sc.label}</span></td>
                          <td>
                            <div className="action-btns">
                              <button className="btn-icon" title="Détails"    onClick={() => openDetail(bus)}>👁️</button>
                              <button className="btn-icon" title="Entretien"  onClick={() => openAddMaintenance(bus)}>🔧</button>
                              <button className="btn-icon" title="Mouchard"   onClick={() => { setActiveTab('mouchard'); setMouchFilter({ busId: bus._id }) }}>🗺️</button>
                              <button className="btn-icon" title="Modifier"   onClick={() => openEditBus(bus)}>✏️</button>
                              <button className="btn-icon btn-danger" title="Supprimer" onClick={() => confirmDelete(bus)}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: MAINTENANCE ═══════════════════════════════════════════ */}
        {activeTab === 'maintenance' && (
          <div className="tab-content">
            <div className="filter-bar">
              <select className="filter-select" value={histFilters.busId} onChange={e => setHistFilters(f => ({ ...f, busId: e.target.value }))}>
                <option value="">Tous les véhicules</option>
                {buses.map(b => <option key={b._id} value={b._id}>{b.matricule} — {b.marque}</option>)}
              </select>
              <select className="filter-select" value={histFilters.type} onChange={e => setHistFilters(f => ({ ...f, type: e.target.value }))}>
                <option value="">Tous les types</option>
                {ENTRETIEN_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
              </select>
              <input type="date" className="filter-input filter-date" value={histFilters.dateFrom} onChange={e => setHistFilters(f => ({ ...f, dateFrom: e.target.value }))} />
              <input type="date" className="filter-input filter-date" value={histFilters.dateTo}   onChange={e => setHistFilters(f => ({ ...f, dateTo: e.target.value }))} />
              <button className="btn-filter" onClick={fetchHistory}>Appliquer</button>
              <button className="btn-reset" onClick={() => setHistFilters({ busId: '', type: '', dateFrom: '', dateTo: '' })}>Réinitialiser</button>
            </div>
            {histLoading ? <div className="loading-state">⏳ Chargement…</div> :
             history.length === 0 ? <div className="empty-state"><span>🔧</span><p>Aucun entretien enregistré.</p></div> : (
              <div className="table-wrapper">
                <table className="transport-table">
                  <thead>
                    <tr><th>Date</th><th>Véhicule</th><th>Type</th><th>Description</th><th>Coût</th><th>Km</th><th>Prestataire</th></tr>
                  </thead>
                  <tbody>
                    {history.map((e, i) => (
                      <tr key={e._id || i}>
                        <td>{fmt(e.date)}</td>
                        <td><strong>{e.bus?.matricule}</strong><br /><small>{e.bus?.marque}</small></td>
                        <td><span className="type-badge">{typeIcon(e.type)} {typeLabel(e.type)}</span></td>
                        <td>{e.description}</td>
                        <td>{fmtMoney(e.cout)}</td>
                        <td>{e.kilometrage ? `${e.kilometrage.toLocaleString('fr-FR')} km` : '—'}</td>
                        <td>{e.prestataire || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: MOUCHARD ══════════════════════════════════════════════ */}
        {activeTab === 'mouchard' && (
          <div className="tab-content">
            <div className="filter-bar">
              <select className="filter-select" value={mouchFilter.busId} onChange={e => setMouchFilter({ busId: e.target.value })}>
                <option value="">Tous les véhicules</option>
                {buses.map(b => <option key={b._id} value={b._id}>{b.matricule} — {b.marque}</option>)}
              </select>
              <button className="btn-filter" onClick={fetchMouchard}>Appliquer</button>
              <button className="btn-reset"  onClick={() => setMouchFilter({ busId: '' })}>Tous</button>
              {mouchFilter.busId && (
                <button className="btn-add-mouchard" onClick={() => {
                  const bus = buses.find(b => b._id === mouchFilter.busId)
                  if (bus) openAddMouchard(bus)
                }}>+ Ajouter une sortie</button>
              )}
            </div>

            {mouchLoading ? <div className="loading-state">⏳ Chargement…</div> :
             mouchard.length === 0 ? (
              <div className="empty-state">
                <span>🗺️</span>
                <p>Aucune sortie enregistrée.{' '}
                  {buses.length > 0 && <button className="link-btn" onClick={() => openAddMouchard(buses[0])}>Enregistrer une sortie</button>}
                </p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="transport-table">
                  <thead>
                    <tr>
                      <th>Départ</th>
                      <th>Retour</th>
                      <th>Véhicule</th>
                      <th>Destination</th>
                      <th>Conducteur</th>
                      <th>Km départ</th>
                      <th>Km retour</th>
                      <th>Commentaire</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mouchard.map((m, i) => (
                      <tr key={m._id || i}>
                        <td>{fmtDT(m.dateDepart)}</td>
                        <td>{m.dateRetour ? fmtDT(m.dateRetour) : <span className="badge-en-cours">En cours</span>}</td>
                        <td><strong>{m.bus?.matricule || '—'}</strong></td>
                        <td>{m.destination}</td>
                        <td>{m.conducteur || '—'}</td>
                        <td>{m.kilometrageDepart ? `${Number(m.kilometrageDepart).toLocaleString('fr-FR')} km` : '—'}</td>
                        <td>{m.kilometrageRetour ? `${Number(m.kilometrageRetour).toLocaleString('fr-FR')} km` : '—'}</td>
                        <td>{m.commentaire || '—'}</td>
                        <td>
                          <button className="btn-icon btn-danger" title="Supprimer"
                            onClick={() => deleteMouchardEntry(m.bus?._id || mouchFilter.busId, m._id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: STATS ═════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="tab-content stats-tab">
            <div className="stats-grid">
              <div className="stats-card">
                <h3>💰 Coûts par type d'entretien</h3>
                {countsByType.length === 0 ? <p className="text-muted">Aucune donnée</p> : (
                  <table className="stats-table">
                    <thead><tr><th>Type</th><th>Interventions</th><th>Coût total</th></tr></thead>
                    <tbody>
                      {countsByType.sort((a, b) => b.totalCost - a.totalCost).map(r => (
                        <tr key={r.type}>
                          <td>{typeIcon(r.type)} {typeLabel(r.type)}</td>
                          <td><span className="count-badge">{r.count}</span></td>
                          <td><strong>{fmtMoney(r.totalCost)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="stats-card">
                <h3>🕐 Derniers entretiens</h3>
                {(stats?.recentMaintenance || []).length === 0 ? <p className="text-muted">Aucun entretien</p> : (
                  <ul className="recent-list">
                    {stats.recentMaintenance.map((e, i) => (
                      <li key={i} className="recent-item">
                        <span className="recent-icon">{typeIcon(e.type)}</span>
                        <div>
                          <div className="recent-bus">{e.bus?.matricule} — {typeLabel(e.type)}</div>
                          <div className="recent-meta">{fmt(e.date)} · {fmtMoney(e.cout)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="stats-card">
                <h3>🚌 État de la flotte</h3>
                <div className="fleet-summary">
                  {Object.entries(STATUT_CONFIG).map(([key, cfg]) => (
                    <div key={key} className={`fleet-item fleet-${key}`}>
                      <span className="fleet-icon">{cfg.icon}</span>
                      <span className="fleet-label">{cfg.label}</span>
                      <span className="fleet-count">{stats?.counts?.[key] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: Add/Edit Bus ════════════════════════════════════════ */}
        {busModal.open && (
          <div className="modal-overlay" onClick={() => setBusModal({ open: false, editing: null })}>
            <div className="modal-content modal-bus" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{busModal.editing ? '✏️ Modifier le véhicule' : '🚌 Nouveau véhicule'}</h2>
                <button className="close-btn" onClick={() => setBusModal({ open: false, editing: null })}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="form-error">⚠️ {error}</div>}

                <div className="form-section">
                  <h4>Informations générales</h4>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Matricule *</label>
                      <input value={busForm.matricule} onChange={e => setBusForm(f => ({ ...f, matricule: e.target.value.toUpperCase() }))} placeholder="Ex: 123-456-07" />
                    </div>
                    <div className="form-group">
                      <label>Marque *</label>
                      <input value={busForm.marque} onChange={e => setBusForm(f => ({ ...f, marque: e.target.value }))} placeholder="Ex: Mercedes" />
                    </div>
                    <div className="form-group">
                      <label>Modèle</label>
                      <input value={busForm.modele} onChange={e => setBusForm(f => ({ ...f, modele: e.target.value }))} placeholder="Ex: Sprinter" />
                    </div>
                    <div className="form-group">
                      <label>Année</label>
                      <input type="number" value={busForm.annee} onChange={e => setBusForm(f => ({ ...f, annee: +e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Capacité (places)</label>
                      <input type="number" value={busForm.capacite} onChange={e => setBusForm(f => ({ ...f, capacite: +e.target.value }))} min={1} />
                    </div>
                    <div className="form-group">
                      <label>Couleur</label>
                      <input value={busForm.couleur} onChange={e => setBusForm(f => ({ ...f, couleur: e.target.value }))} placeholder="Ex: Blanc" />
                    </div>
                    <div className="form-group">
                      <label>Kilométrage</label>
                      <input type="number" value={busForm.kilometrage} onChange={e => setBusForm(f => ({ ...f, kilometrage: +e.target.value }))} min={0} />
                    </div>
                    <div className="form-group">
                      <label>Statut</label>
                      <select value={busForm.statut} onChange={e => setBusForm(f => ({ ...f, statut: e.target.value }))}>
                        {Object.entries(STATUT_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.icon} {c.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>📄 Carte grise</h4>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>N° carte grise</label>
                      <input value={busForm.carteGriseNumero} onChange={e => setBusForm(f => ({ ...f, carteGriseNumero: e.target.value }))} placeholder="Numéro d'immatriculation" />
                    </div>
                    <div className="form-group">
                      <label>Date mise en circulation</label>
                      <input type="date" value={busForm.dateMiseEnCirculation} onChange={e => setBusForm(f => ({ ...f, dateMiseEnCirculation: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Expiration carte grise</label>
                      <input type="date" value={busForm.dateExpirationCarteGrise} onChange={e => setBusForm(f => ({ ...f, dateExpirationCarteGrise: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>📋 Documents</h4>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Expiration assurance</label>
                      <input type="date" value={busForm.assuranceExpiration} onChange={e => setBusForm(f => ({ ...f, assuranceExpiration: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Expiration contrôle technique</label>
                      <input type="date" value={busForm.controleExpiration} onChange={e => setBusForm(f => ({ ...f, controleExpiration: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>👤 Chauffeur assigné</h4>
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Nom</label>
                      <input value={busForm.chauffeur.nom} onChange={e => setBusForm(f => ({ ...f, chauffeur: { ...f.chauffeur, nom: e.target.value } }))} placeholder="Nom complet" />
                    </div>
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input value={busForm.chauffeur.telephone} onChange={e => setBusForm(f => ({ ...f, chauffeur: { ...f.chauffeur, telephone: e.target.value } }))} placeholder="0X XX XX XX XX" />
                    </div>
                    <div className="form-group">
                      <label>N° permis</label>
                      <input value={busForm.chauffeur.permis} onChange={e => setBusForm(f => ({ ...f, chauffeur: { ...f.chauffeur, permis: e.target.value } }))} placeholder="Numéro permis" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea value={busForm.notes} onChange={e => setBusForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Observations…" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setBusModal({ open: false, editing: null })}>Annuler</button>
                <button className="btn-submit" onClick={saveBus} disabled={saving}>
                  {saving ? '⏳ Enregistrement…' : busModal.editing ? '💾 Mettre à jour' : '✅ Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: Add Maintenance ══════════════════════════════════════ */}
        {maintModal.open && (
          <div className="modal-overlay" onClick={() => setMaintModal({ open: false, busId: null, busLabel: '' })}>
            <div className="modal-content modal-maintenance" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🔧 Enregistrer un entretien</h2>
                <button className="close-btn" onClick={() => setMaintModal({ open: false, busId: null, busLabel: '' })}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="form-error">⚠️ {error}</div>}
                <div className="maint-bus-label">🚌 {maintModal.busLabel}</div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Type d'entretien *</label>
                    <select value={maintForm.type} onChange={e => setMaintForm(f => ({ ...f, type: e.target.value }))}>
                      {ENTRETIEN_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date *</label>
                    <input type="date" value={maintForm.date} onChange={e => setMaintForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Coût (DH)</label>
                    <input type="number" value={maintForm.cout} onChange={e => setMaintForm(f => ({ ...f, cout: e.target.value }))} min={0} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Kilométrage</label>
                    <input type="number" value={maintForm.kilometrage} onChange={e => setMaintForm(f => ({ ...f, kilometrage: e.target.value }))} min={0} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea value={maintForm.description} onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Décrivez l'intervention…" />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Prestataire</label>
                    <input value={maintForm.prestataire} onChange={e => setMaintForm(f => ({ ...f, prestataire: e.target.value }))} placeholder="Nom du garage / prestataire" />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <input value={maintForm.notes} onChange={e => setMaintForm(f => ({ ...f, notes: e.target.value }))} placeholder="Remarques…" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setMaintModal({ open: false, busId: null, busLabel: '' })}>Annuler</button>
                <button className="btn-submit" onClick={saveMaintenance} disabled={saving}>
                  {saving ? '⏳ Enregistrement…' : '✅ Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: Add Mouchard ════════════════════════════════════════ */}
        {mouchModal.open && (
          <div className="modal-overlay" onClick={() => setMouchModal({ open: false, busId: null, busLabel: '' })}>
            <div className="modal-content modal-maintenance" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🗺️ Enregistrer une sortie</h2>
                <button className="close-btn" onClick={() => setMouchModal({ open: false, busId: null, busLabel: '' })}>✕</button>
              </div>
              <div className="modal-body">
                {error && <div className="form-error">⚠️ {error}</div>}
                <div className="maint-bus-label">🚌 {mouchModal.busLabel}</div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Date / heure départ *</label>
                    <input type="datetime-local" value={mouchForm.dateDepart} onChange={e => setMouchForm(f => ({ ...f, dateDepart: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Date / heure retour</label>
                    <input type="datetime-local" value={mouchForm.dateRetour} onChange={e => setMouchForm(f => ({ ...f, dateRetour: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Destination *</label>
                    <input value={mouchForm.destination} onChange={e => setMouchForm(f => ({ ...f, destination: e.target.value }))} placeholder="Ex: Centre-ville, Hôpital…" />
                  </div>
                  <div className="form-group">
                    <label>Conducteur</label>
                    <input value={mouchForm.conducteur} onChange={e => setMouchForm(f => ({ ...f, conducteur: e.target.value }))} placeholder="Nom du conducteur" />
                  </div>
                  <div className="form-group">
                    <label>Km au départ</label>
                    <input type="number" value={mouchForm.kilometrageDepart} onChange={e => setMouchForm(f => ({ ...f, kilometrageDepart: e.target.value }))} min={0} />
                  </div>
                  <div className="form-group">
                    <label>Km au retour</label>
                    <input type="number" value={mouchForm.kilometrageRetour} onChange={e => setMouchForm(f => ({ ...f, kilometrageRetour: e.target.value }))} min={0} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Commentaire</label>
                  <textarea value={mouchForm.commentaire} onChange={e => setMouchForm(f => ({ ...f, commentaire: e.target.value }))} rows={2} placeholder="Objet de la sortie…" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setMouchModal({ open: false, busId: null, busLabel: '' })}>Annuler</button>
                <button className="btn-submit" onClick={saveMouchard} disabled={saving}>
                  {saving ? '⏳ Enregistrement…' : '✅ Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: Bus Detail ══════════════════════════════════════════ */}
        {detailModal.open && detailModal.bus && (
          <div className="modal-overlay" onClick={() => setDetailModal({ open: false, bus: null })}>
            <div className="modal-content modal-detail" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🚌 {detailModal.bus.matricule} — {detailModal.bus.marque}</h2>
                <button className="close-btn" onClick={() => setDetailModal({ open: false, bus: null })}>✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-info-grid">
                  {[
                    ['Marque / Modèle', `${detailModal.bus.marque} ${detailModal.bus.modele || ''}`],
                    ['Année', detailModal.bus.annee || '—'],
                    ['Capacité', `${detailModal.bus.capacite} places`],
                    ['Couleur', detailModal.bus.couleur || '—'],
                    ['Kilométrage', `${(detailModal.bus.kilometrage || 0).toLocaleString('fr-FR')} km`],
                    ['Statut', `${STATUT_CONFIG[detailModal.bus.statut]?.icon} ${STATUT_CONFIG[detailModal.bus.statut]?.label}`],
                    ['Chauffeur', detailModal.bus.chauffeur?.nom || 'Non assigné'],
                    ['Tél. chauffeur', detailModal.bus.chauffeur?.telephone || '—'],
                    ['Permis', detailModal.bus.chauffeur?.permis || '—'],
                    ['N° Carte grise', detailModal.bus.carteGriseNumero || '—'],
                    ['Mise en circulation', fmt(detailModal.bus.dateMiseEnCirculation)],
                    ['Exp. carte grise', fmt(detailModal.bus.dateExpirationCarteGrise)],
                    ['Assurance exp.', fmt(detailModal.bus.assuranceExpiration)],
                    ['Contrôle exp.', fmt(detailModal.bus.controleExpiration)],
                  ].map(([k, v]) => (
                    <div key={k} className="detail-info-item">
                      <span className="detail-info-key">{k}</span>
                      <span className="detail-info-val">{v}</span>
                    </div>
                  ))}
                </div>
                {detailModal.bus.notes && <p className="detail-notes">📝 {detailModal.bus.notes}</p>}

                <div className="detail-history">
                  <div className="detail-history-header">
                    <h4>🔧 Historique des entretiens ({detailModal.bus.historique?.length || 0})</h4>
                    <button className="btn-sm-add" onClick={() => { setDetailModal({ open: false, bus: null }); openAddMaintenance(detailModal.bus) }}>+ Ajouter</button>
                  </div>
                  {(detailModal.bus.historique || []).length === 0 ? (
                    <p className="text-muted">Aucun entretien enregistré.</p>
                  ) : (
                    <div className="history-list">
                      {[...detailModal.bus.historique].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => (
                        <div key={e._id} className="history-card">
                          <div className="history-card-header">
                            <span className="history-type">{typeIcon(e.type)} {typeLabel(e.type)}</span>
                            <span className="history-date">{fmt(e.date)}</span>
                            <button className="btn-del-history" onClick={() => deleteMaintenance(detailModal.bus._id, e._id)}>🗑️</button>
                          </div>
                          <div className="history-card-body">
                            <p>{e.description}</p>
                            <div className="history-meta">
                              {e.cout > 0 && <span>💰 {fmtMoney(e.cout)}</span>}
                              {e.kilometrage && <span>📍 {e.kilometrage.toLocaleString('fr-FR')} km</span>}
                              {e.prestataire && <span>🏪 {e.prestataire}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setDetailModal({ open: false, bus: null })}>Fermer</button>
                <button className="btn-submit" onClick={() => { setDetailModal({ open: false, bus: null }); openEditBus(detailModal.bus) }}>✏️ Modifier</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MODAL: Delete Confirm ══════════════════════════════════════ */}
        {deleteConfirm.open && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm({ open: false, id: null, label: '' })}>
            <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>⚠️ Confirmer la suppression</h2>
                <button className="close-btn" onClick={() => setDeleteConfirm({ open: false, id: null, label: '' })}>✕</button>
              </div>
              <div className="modal-body">
                <p>Supprimer le véhicule <strong>{deleteConfirm.label}</strong> et tout son historique ?</p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setDeleteConfirm({ open: false, id: null, label: '' })}>Annuler</button>
                <button className="btn-delete" onClick={deleteBus}>🗑️ Supprimer définitivement</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProfessionalLayout>
  )
}
