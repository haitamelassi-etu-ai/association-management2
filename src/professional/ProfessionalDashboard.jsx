import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '../utils/api'
import ProfessionalLayout from './ProfessionalLayout'
import './ProfessionalDashboard.css'
import './Dashboard.css'

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'
const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR')

const authHeader = () => {
  const t = localStorage.getItem('professionalToken') ||
    (() => { try { return JSON.parse(localStorage.getItem('professionalUser') || '{}').token } catch { return '' } })()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

const today = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

// ─── component ───────────────────────────────────────────────────────────────

export default function ProfessionalDashboard() {
  const [foodStats,     setFoodStats]     = useState(null)
  const [foodAlerts,    setFoodAlerts]    = useState({ expiration: [], stock: [] })
  const [medicalStats,  setMedicalStats]  = useState(null)
  const [transportStats,setTransportStats]= useState(null)
  const [loading,       setLoading]       = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const h = { headers: authHeader() }
      const [food, alerts, medical, transport] = await Promise.allSettled([
        axios.get(`${API_URL}/food-stock/stats/overview`,  h),
        axios.get(`${API_URL}/food-stock/alerts/all`,      h),
        axios.get(`${API_URL}/medical-stock/stats`,        h),
        axios.get(`${API_URL}/transport/stats`,            h),
      ])
      if (food.status      === 'fulfilled') setFoodStats(food.value.data)
      if (alerts.status    === 'fulfilled') setFoodAlerts(alerts.value.data)
      if (medical.status   === 'fulfilled') setMedicalStats(medical.value.data?.data)
      if (transport.status === 'fulfilled') setTransportStats(transport.value.data?.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── derived ────────────────────────────────────────────────────────────────
  const foodByStatus  = {}
  ;(foodStats?.statuts || []).forEach(s => { foodByStatus[s._id] = s.count })

  const totalAlerts   = (foodAlerts.expiration?.length || 0) + (foodAlerts.stock?.length || 0)
  const tc            = transportStats?.counts || {}
  const mByEtat       = medicalStats?.byEtat   || {}
  const mByStatut     = medicalStats?.byStatut || {}

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <ProfessionalLayout>
      <div className="dash-page">

        {/* ── Top bar ─────────────────────────────────── */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-title">Tableau de bord</h1>
            <p className="dash-date">{today}</p>
          </div>
          <button className="dash-refresh" onClick={load}>🔄 Actualiser</button>
        </div>

        {loading ? (
          <div className="dash-loading">
            <div className="dash-spinner" />
            <p>Chargement des données…</p>
          </div>
        ) : (
          <>
            {/* ══ STOCK ALIMENTAIRE ══════════════════════ */}
            <div className="dash-section-header">
              <span className="dash-section-icon">🍎</span>
              <h2>Stock Alimentaire</h2>
              <Link to="/professional/food-stock" className="dash-section-link">Voir tout →</Link>
            </div>
            <div className="dash-cards">
              <StatCard icon="📦" label="Total articles"      value={fmtN(foodStats?.total)}                                                    color="blue"   />
              <StatCard icon="✅" label="Disponibles"         value={fmtN(foodByStatus['disponible'])}                                          color="green"  />
              <StatCard icon="🟠" label="Stock faible"        value={fmtN(foodByStatus['faible'])}                                              color="orange" />
              <StatCard icon="🔴" label="Critiques / Expirés" value={fmtN((foodByStatus['critique']||0)+(foodByStatus['expire']||0))}           color="red"    />
              <StatCard icon="💰" label="Valeur totale"       value={`${fmtN(foodStats?.valeurTotale)} DH`}                                     color="purple" wide />
              <StatCard icon="⚠️" label="Alertes actives"    value={fmtN(totalAlerts)}  color={totalAlerts > 0 ? 'red' : 'green'}               />
            </div>

            {/* ══ STOCK MÉDICAL ══════════════════════════ */}
            <div className="dash-section-header">
              <span className="dash-section-icon">🏥</span>
              <h2>Matériel Médical</h2>
              <Link to="/professional/medical-stock" className="dash-section-link">Voir tout →</Link>
            </div>
            <div className="dash-cards">
              <StatCard icon="🏥" label="Total matériel"   value={fmtN(medicalStats?.total)}           color="blue"   />
              <StatCard icon="✅" label="Disponible"        value={fmtN(mByStatut['disponible'])}       color="green"  />
              <StatCard icon="🔄" label="En prêt"           value={fmtN(mByStatut['en_pret'])}          color="orange" />
              <StatCard icon="🔧" label="En maintenance"    value={fmtN(mByStatut['maintenance'])}      color="orange" />
              <StatCard icon="💰" label="Valeur totale"     value={`${fmtN(medicalStats?.valeurTotale)} DH`} color="purple" wide />
              <StatCard icon="⛔" label="Hors service"      value={fmtN(mByEtat['hors_service'])}       color="red"    />
            </div>

            {/* ══ TRANSPORT ══════════════════════════════ */}
            <div className="dash-section-header">
              <span className="dash-section-icon">🚌</span>
              <h2>Transport</h2>
              <Link to="/professional/transport" className="dash-section-link">Voir tout →</Link>
            </div>
            <div className="dash-cards">
              <StatCard icon="🚌" label="Total véhicules"   value={fmtN(tc.total)}                     color="blue"   />
              <StatCard icon="✅" label="Actifs"             value={fmtN(tc.actif)}                     color="green"  />
              <StatCard icon="🔧" label="En maintenance"     value={fmtN(tc.maintenance)}               color="orange" />
              <StatCard icon="⛔" label="Inactifs"           value={fmtN(tc.inactif)}                   color="red"    />
              <StatCard icon="💰" label="Coût entretiens"   value={`${fmtN(transportStats?.totalMaintenanceCost)} DH`} color="purple" wide />
              <StatCard icon="📋" label="Docs expirant (30j)" value={fmtN(transportStats?.expiringDocs)} color={transportStats?.expiringDocs > 0 ? 'orange' : 'green'} />
            </div>

            {/* ══ BOTTOM ROW ═════════════════════════════ */}
            <div className="dash-bottom">

              {/* Alertes stock alimentaire */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <span>⚠️ Alertes Stock Alimentaire</span>
                  <span className="dash-card-count">{totalAlerts} alerte{totalAlerts !== 1 ? 's' : ''}</span>
                </div>
                <div className="dash-card-body">
                  {totalAlerts === 0 ? (
                    <p className="dash-empty">✅ Aucune alerte active</p>
                  ) : (
                    <>
                      {foodAlerts.expiration.slice(0, 3).map(item => (
                        <AlertRow key={item._id} icon="⏰" type="warning"
                          title={item.nom}
                          sub={`Expire le ${fmt(item.dateExpiration)} · ${item.quantite} ${item.unite}`}
                        />
                      ))}
                      {foodAlerts.stock.slice(0, 3).map(item => (
                        <AlertRow key={item._id} icon="📉" type="danger"
                          title={item.nom}
                          sub={`${item.quantite} ${item.unite} restant${item.quantite > 1 ? 's' : ''}`}
                        />
                      ))}
                    </>
                  )}
                </div>
                <Link to="/professional/food-stock" className="dash-card-footer">Gérer le stock →</Link>
              </div>

              {/* État matériel médical */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <span>🏥 État du Matériel Médical</span>
                  <span className="dash-card-count">{fmtN(medicalStats?.total)} articles</span>
                </div>
                <div className="dash-card-body">
                  {!medicalStats || medicalStats.total === 0 ? (
                    <p className="dash-empty">Aucun matériel enregistré</p>
                  ) : (
                    <>
                      <AlertRow icon="✅" type="info"    title="Bon état"      sub={`${fmtN(mByEtat['bon'])} article${(mByEtat['bon']||0)>1?'s':''}`} />
                      <AlertRow icon="⚠️" type="warning" title="Endommagé"     sub={`${fmtN(mByEtat['endommage'])} article${(mByEtat['endommage']||0)>1?'s':''}`} />
                      <AlertRow icon="⛔" type="danger"  title="Hors service"  sub={`${fmtN(mByEtat['hors_service'])} article${(mByEtat['hors_service']||0)>1?'s':''}`} />
                      <AlertRow icon="🔄" type="info"    title="En prêt"       sub={`${fmtN(mByStatut['en_pret'])} article${(mByStatut['en_pret']||0)>1?'s':''}`} />
                    </>
                  )}
                </div>
                <Link to="/professional/medical-stock" className="dash-card-footer">Gérer le matériel →</Link>
              </div>

              {/* Derniers entretiens + Accès rapide */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <span>🔧 Derniers entretiens</span>
                  <span className="dash-card-count">{transportStats?.recentMaintenance?.length || 0} récent{(transportStats?.recentMaintenance?.length||0)!==1?'s':''}</span>
                </div>
                <div className="dash-card-body">
                  {(transportStats?.recentMaintenance || []).length === 0 ? (
                    <p className="dash-empty">Aucun entretien enregistré</p>
                  ) : (
                    transportStats.recentMaintenance.slice(0, 4).map((e, i) => (
                      <AlertRow key={i} icon="🔧" type="info"
                        title={`${e.bus?.matricule} — ${ENTRETIEN_LABELS[e.type] || e.type}`}
                        sub={`${fmt(e.date)} · ${fmtN(e.cout)} DH`}
                      />
                    ))
                  )}
                </div>
                <Link to="/professional/transport" className="dash-card-footer">Gérer le transport →</Link>
              </div>

            </div>

            {/* ══ ACCÈS RAPIDE ═══════════════════════════ */}
            <div className="dash-section-header" style={{ marginTop: '1.75rem' }}>
              <span className="dash-section-icon">🚀</span>
              <h2>Accès rapide</h2>
            </div>
            <div className="dash-quick-grid">
              {[
                { to: '/professional/food-stock',    icon: '🍎', label: 'Stock Alimentaire',  desc: 'Articles alimentaires',        color: '#10b981' },
                { to: '/professional/medical-stock', icon: '🏥', label: 'Matériel Médical',   desc: 'Équipements et matériel',       color: '#7c3aed' },
                { to: '/professional/transport',     icon: '🚌', label: 'Transport',           desc: 'Véhicules et entretiens',       color: '#3b82f6' },
                { to: '/professional/staff',         icon: '👥', label: 'Personnel',           desc: 'Comptes et accès',              color: '#f59e0b' },
              ].map(n => (
                <Link key={n.to} to={n.to} className="dash-quick-item">
                  <span className="dash-quick-icon" style={{ background: n.color + '18', color: n.color }}>{n.icon}</span>
                  <div>
                    <div className="dash-quick-title">{n.label}</div>
                    <div className="dash-quick-desc">{n.desc}</div>
                  </div>
                  <span className="dash-quick-arrow">→</span>
                </Link>
              ))}
            </div>

          </>
        )}
      </div>
    </ProfessionalLayout>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color, wide }) {
  return (
    <div className={`dash-stat dash-stat-${color}${wide ? ' dash-stat-wide' : ''}`}>
      <div className="dash-stat-icon">{icon}</div>
      <div>
        <div className="dash-stat-value">{value}</div>
        <div className="dash-stat-label">{label}</div>
      </div>
    </div>
  )
}

function AlertRow({ icon, type, title, sub }) {
  return (
    <div className={`dash-alert-row dash-alert-${type}`}>
      <span className="dash-alert-icon">{icon}</span>
      <div>
        <div className="dash-alert-title">{title}</div>
        <div className="dash-alert-sub">{sub}</div>
      </div>
    </div>
  )
}

const ENTRETIEN_LABELS = {
  vidange: 'Vidange', pneus: 'Pneus', reparation: 'Réparation',
  revision: 'Révision', controle_technique: 'Contrôle technique',
  nettoyage: 'Nettoyage', carburant: 'Carburant', autre: 'Autre'
}
