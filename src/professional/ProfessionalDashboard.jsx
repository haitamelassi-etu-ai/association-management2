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
  const [stockStats, setStockStats]     = useState(null)
  const [stockAlerts, setStockAlerts]   = useState({ expiration: [], stock: [] })
  const [transportStats, setTransportStats] = useState(null)
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const h = { headers: authHeader() }
      const [s, a, t] = await Promise.allSettled([
        axios.get(`${API_URL}/food-stock/stats/overview`, h),
        axios.get(`${API_URL}/food-stock/alerts/all`, h),
        axios.get(`${API_URL}/transport/stats`, h),
      ])
      if (s.status === 'fulfilled') setStockStats(s.value.data)
      if (a.status === 'fulfilled') setStockAlerts(a.value.data)
      if (t.status === 'fulfilled') setTransportStats(t.value.data?.data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── derived values ─────────────────────────────────────────────────────────

  const stockByStatus = {}
  ;(stockStats?.statuts || []).forEach(s => { stockByStatus[s._id] = s.count })

  const totalAlerts = (stockAlerts.expiration?.length || 0) + (stockAlerts.stock?.length || 0)
  const tc = transportStats?.counts || {}

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <ProfessionalLayout>
      <div className="dash-page">

        {/* ── Top bar ───────────────────────────────────── */}
        <div className="dash-topbar">
          <div>
            <h1 className="dash-title">Tableau de bord</h1>
            <p className="dash-date">{today}</p>
          </div>
          <button className="dash-refresh" onClick={load} title="Actualiser">
            🔄 Actualiser
          </button>
        </div>

        {loading ? (
          <div className="dash-loading">
            <div className="dash-spinner" />
            <p>Chargement des données…</p>
          </div>
        ) : (
          <>
            {/* ── Section: Stock ────────────────────────── */}
            <div className="dash-section-header">
              <span className="dash-section-icon">🏪</span>
              <h2>Stock Alimentaire</h2>
              <Link to="/professional/food-stock" className="dash-section-link">Voir tout →</Link>
            </div>

            <div className="dash-cards">
              <StatCard
                icon="📦" label="Total articles"
                value={fmtN(stockStats?.total)}
                color="blue"
              />
              <StatCard
                icon="✅" label="Disponibles"
                value={fmtN(stockByStatus['disponible'])}
                color="green"
              />
              <StatCard
                icon="🟠" label="Stock faible"
                value={fmtN(stockByStatus['faible'])}
                color="orange"
              />
              <StatCard
                icon="🔴" label="Critiques / Expirés"
                value={fmtN((stockByStatus['critique'] || 0) + (stockByStatus['expire'] || 0))}
                color="red"
              />
              <StatCard
                icon="💰" label="Valeur totale"
                value={`${fmtN(stockStats?.valeurTotale)} DH`}
                color="purple"
                wide
              />
              <StatCard
                icon="⚠️" label="Alertes actives"
                value={fmtN(totalAlerts)}
                color={totalAlerts > 0 ? 'red' : 'green'}
              />
            </div>

            {/* ── Section: Transport ────────────────────── */}
            <div className="dash-section-header">
              <span className="dash-section-icon">🚌</span>
              <h2>Transport</h2>
              <Link to="/professional/transport" className="dash-section-link">Voir tout →</Link>
            </div>

            <div className="dash-cards">
              <StatCard icon="🚌" label="Total véhicules"  value={fmtN(tc.total)}       color="blue" />
              <StatCard icon="✅" label="Actifs"           value={fmtN(tc.actif)}        color="green" />
              <StatCard icon="🔧" label="En maintenance"   value={fmtN(tc.maintenance)}  color="orange" />
              <StatCard icon="⛔" label="Inactifs"         value={fmtN(tc.inactif)}      color="red" />
              <StatCard
                icon="💰" label="Coût entretiens"
                value={`${fmtN(transportStats?.totalMaintenanceCost)} DH`}
                color="purple"
                wide
              />
              <StatCard
                icon="📋" label="Docs expirant (30j)"
                value={fmtN(transportStats?.expiringDocs)}
                color={transportStats?.expiringDocs > 0 ? 'orange' : 'green'}
              />
            </div>

            {/* ── Alerts + Recent maintenance ───────────── */}
            <div className="dash-bottom">

              {/* Stock alerts */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <span>⚠️ Alertes Stock</span>
                  <span className="dash-card-count">{totalAlerts} alerte{totalAlerts !== 1 ? 's' : ''}</span>
                </div>
                <div className="dash-card-body">
                  {totalAlerts === 0 ? (
                    <p className="dash-empty">✅ Aucune alerte active</p>
                  ) : (
                    <>
                      {stockAlerts.expiration.slice(0, 4).map(item => (
                        <AlertRow
                          key={item._id}
                          icon="⏰"
                          type="warning"
                          title={item.nom}
                          sub={`Expire le ${fmt(item.dateExpiration)} · ${item.quantite} ${item.unite}`}
                        />
                      ))}
                      {stockAlerts.stock.slice(0, 4).map(item => (
                        <AlertRow
                          key={item._id}
                          icon="📉"
                          type="danger"
                          title={item.nom}
                          sub={`${item.quantite} ${item.unite} restant${item.quantite > 1 ? 's' : ''} · Seuil: ${item.seuilCritique}`}
                        />
                      ))}
                    </>
                  )}
                </div>
                <Link to="/professional/food-stock" className="dash-card-footer">
                  Gérer le stock →
                </Link>
              </div>

              {/* Recent transport maintenance */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <span>🔧 Derniers entretiens</span>
                  <span className="dash-card-count">{transportStats?.recentMaintenance?.length || 0} récent{(transportStats?.recentMaintenance?.length || 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="dash-card-body">
                  {(transportStats?.recentMaintenance || []).length === 0 ? (
                    <p className="dash-empty">Aucun entretien enregistré</p>
                  ) : (
                    transportStats.recentMaintenance.map((e, i) => (
                      <AlertRow
                        key={i}
                        icon="🔧"
                        type="info"
                        title={`${e.bus?.matricule} — ${ENTRETIEN_LABELS[e.type] || e.type}`}
                        sub={`${fmt(e.date)} · ${fmtN(e.cout)} DH`}
                      />
                    ))
                  )}
                </div>
                <Link to="/professional/transport" className="dash-card-footer">
                  Gérer le transport →
                </Link>
              </div>

              {/* Quick nav */}
              <div className="dash-card dash-card-nav">
                <div className="dash-card-header"><span>🚀 Accès rapide</span></div>
                <div className="dash-card-body dash-nav-grid">
                  {[
                    { to: '/professional/food-stock', icon: '🏪', label: 'Stock Alimentaire', desc: 'Gérer les articles et les stocks' },
                    { to: '/professional/transport',  icon: '🚌', label: 'Transport',          desc: 'Véhicules et entretiens' },
                  ].map(n => (
                    <Link key={n.to} to={n.to} className="dash-nav-item">
                      <span className="dash-nav-icon">{n.icon}</span>
                      <div>
                        <div className="dash-nav-title">{n.label}</div>
                        <div className="dash-nav-desc">{n.desc}</div>
                      </div>
                      <span className="dash-nav-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </div>

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
