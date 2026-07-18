import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken } from '../utils/api';
import ProfessionalLayout from '../professional/ProfessionalLayout';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './FinancialTracker.css';

const COLORS = ['#1f6d3b', '#b82920', '#caa24a', '#a0805a', '#d4924a', '#5b8068', '#7a6f5e', '#25231f'];
const categorieLabels = {
  don: 'Dons', subvention: 'Subventions', cotisation: 'Cotisations', vente: 'Ventes', autre_revenu: 'Autre revenu',
  salaires: 'Salaires', loyer: 'Loyer', nourriture: 'Nourriture', medicaments: 'Médicaments',
  equipement: 'Équipement', transport: 'Transport', maintenance: 'Maintenance',
  fournitures: 'Fournitures', autre_depense: 'Autre dépense'
};
const modeLabels = { especes: 'Espèces', cheque: 'Chèque', virement: 'Virement', carte: 'Carte', autre: 'Autre' };

const FinancialTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    type: 'revenu', categorie: 'don', montant: '', description: '',
    date: new Date().toISOString().split('T')[0], reference: '',
    modePaiement: 'especes', donateur: { nom: '', telephone: '', email: '', anonyme: false },
    notes: ''
  });

  const getToken = () => {
    const pu = localStorage.getItem('professionalUser');
    if (pu) return JSON.parse(pu).token;
    return getAuthToken();
  };

  const headers = { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' };

  useEffect(() => { loadData(); }, [filterType, filterCategorie, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterCategorie) params.append('categorie', filterCategorie);
      if (search) params.append('search', search);

      const [txRes, stRes] = await Promise.all([
        fetch(`${API_URL}/financial?${params}`, { headers }),
        fetch(`${API_URL}/financial/stats`, { headers })
      ]);
      const [txData, stData] = await Promise.all([txRes.json(), stRes.json()]);
      if (txData.success) setTransactions(txData.data);
      if (stData.success) setStats(stData.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...formData, montant: Number(formData.montant) };
      if (body.donateur?.anonyme || !body.donateur?.nom) delete body.donateur;
      const res = await fetch(`${API_URL}/financial`, {
        method: 'POST', headers, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) { setShowModal(false); resetForm(); loadData(); }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette transaction ?')) return;
    try {
      await fetch(`${API_URL}/financial/${id}`, { method: 'DELETE', headers });
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'revenu', categorie: 'don', montant: '', description: '',
      date: new Date().toISOString().split('T')[0], reference: '',
      modePaiement: 'especes', donateur: { nom: '', telephone: '', email: '', anonyme: false }, notes: ''
    });
  };

  const formatMoney = (n) => n ? `${Number(n).toLocaleString('fr-FR')} DH` : '0 DH';

  // Charts data
  const categoryChartData = (stats.categories || []).map(c => ({
    name: categorieLabels[c._id?.categorie] || c._id?.categorie,
    value: c.total,
    type: c._id?.type
  }));

  const revenuCategories = categoryChartData.filter(c => c.type === 'revenu');
  const depenseCategories = categoryChartData.filter(c => c.type === 'depense');

  return (
    <ProfessionalLayout>
      <div className="financial-tracker">
        <div className="page-header">
          <h1>💰 Suivi Financier</h1>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Nouvelle Transaction</button>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-icon">📈</div>
            <div className="kpi-info">
              <span className="kpi-label">Revenus ce mois</span>
              <span className="kpi-value">{formatMoney(stats.monthly?.revenu)}</span>
            </div>
          </div>
          <div className="kpi-card expense">
            <div className="kpi-icon">📉</div>
            <div className="kpi-info">
              <span className="kpi-label">Dépenses ce mois</span>
              <span className="kpi-value">{formatMoney(stats.monthly?.depense)}</span>
            </div>
          </div>
          <div className="kpi-card balance">
            <div className="kpi-icon">💎</div>
            <div className="kpi-info">
              <span className="kpi-label">Solde mensuel</span>
              <span className="kpi-value" style={{color: (stats.monthly?.solde || 0) >= 0 ? '#27ae60' : '#e74c3c'}}>
                {formatMoney(stats.monthly?.solde)}
              </span>
            </div>
          </div>
          <div className="kpi-card yearly">
            <div className="kpi-icon">📊</div>
            <div className="kpi-info">
              <span className="kpi-label">Solde annuel</span>
              <span className="kpi-value" style={{color: (stats.yearly?.solde || 0) >= 0 ? '#27ae60' : '#e74c3c'}}>
                {formatMoney(stats.yearly?.solde)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Vue d'ensemble</button>
          <button className={`tab ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>📋 Transactions</button>
          <button className={`tab ${activeTab === 'charts' ? 'active' : ''}`} onClick={() => setActiveTab('charts')}>📈 Graphiques</button>
        </div>

        {loading ? <div className="loading-state">Chargement...</div> : (
          <>
            {activeTab === 'overview' && (
              <div className="overview-grid">
                <div className="chart-card">
                  <h3>Revenus par catégorie</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={revenuCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {revenuCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatMoney(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h3>Dépenses par catégorie</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={depenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {depenseCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatMoney(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card full-width">
                  <h3>Dernières transactions</h3>
                  <div className="recent-list">
                    {(stats.recentTransactions || []).map(t => (
                      <div key={t._id} className={`recent-item ${t.type}`}>
                        <div className="recent-info">
                          <strong>{t.type === 'revenu' ? '📈' : '📉'} {categorieLabels[t.categorie]}</strong>
                          <span>{t.description || '-'}</span>
                          <small>{new Date(t.date).toLocaleDateString('fr-FR')}</small>
                        </div>
                        <span className={`amount ${t.type}`}>
                          {t.type === 'revenu' ? '+' : '-'}{formatMoney(t.montant)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <>
                <div className="filters-bar">
                  <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="filter-select">
                    <option value="">Tous les types</option>
                    <option value="revenu">Revenus</option>
                    <option value="depense">Dépenses</option>
                  </select>
                  <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} className="filter-select">
                    <option value="">Toutes catégories</option>
                    {Object.entries(categorieLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Catégorie</th>
                        <th>Description</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr><td colSpan="7" className="empty-state">Aucune transaction</td></tr>
                      ) : transactions.map(t => (
                        <tr key={t._id}>
                          <td>{new Date(t.date).toLocaleDateString('fr-FR')}</td>
                          <td><span className={`type-badge ${t.type}`}>{t.type === 'revenu' ? '📈 Revenu' : '📉 Dépense'}</span></td>
                          <td>{categorieLabels[t.categorie]}</td>
                          <td>{t.description || '-'}</td>
                          <td className={`amount-cell ${t.type}`}>{t.type === 'revenu' ? '+' : '-'}{formatMoney(t.montant)}</td>
                          <td>{modeLabels[t.modePaiement]}</td>
                          <td><button className="btn-sm btn-danger" onClick={() => handleDelete(t._id)}>🗑️</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'charts' && (
              <div className="charts-grid">
                <div className="chart-card full-width">
                  <h3>Évolution mensuelle</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(() => {
                      const monthNames = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
                      const trend = stats.monthlyTrend || [];
                      const months = {};
                      trend.forEach(t => {
                        const key = `${monthNames[t._id.month-1]} ${t._id.year}`;
                        if (!months[key]) months[key] = { name: key, revenu: 0, depense: 0 };
                        months[key][t._id.type] = t.total;
                      });
                      return Object.values(months);
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={v => formatMoney(v)} />
                      <Legend />
                      <Bar dataKey="revenu" fill="#1f6d3b" name="Revenus" radius={[4,4,0,0]} />
                      <Bar dataKey="depense" fill="#b82920" name="Dépenses" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h3>Revenus annuels: {formatMoney(stats.yearly?.revenu)}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={revenuCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label>
                        {revenuCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h3>Dépenses annuelles: {formatMoney(stats.yearly?.depense)}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={depenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label>
                        {depenseCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => formatMoney(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add Transaction Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Nouvelle Transaction</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group"><label>Type *</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value, categorie: e.target.value === 'revenu' ? 'don' : 'salaires'})}>
                      <option value="revenu">📈 Revenu</option>
                      <option value="depense">📉 Dépense</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Catégorie *</label>
                    <select value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})}>
                      {formData.type === 'revenu' ? (
                        <>
                          <option value="don">Dons</option>
                          <option value="subvention">Subventions</option>
                          <option value="cotisation">Cotisations</option>
                          <option value="vente">Ventes</option>
                          <option value="autre_revenu">Autre</option>
                        </>
                      ) : (
                        <>
                          <option value="salaires">Salaires</option>
                          <option value="loyer">Loyer</option>
                          <option value="nourriture">Nourriture</option>
                          <option value="medicaments">Médicaments</option>
                          <option value="equipement">Équipement</option>
                          <option value="transport">Transport</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="fournitures">Fournitures</option>
                          <option value="autre_depense">Autre</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Montant (DH) *</label><input required type="number" min="0" step="0.01" value={formData.montant} onChange={e => setFormData({...formData, montant: e.target.value})} /></div>
                  <div className="form-group"><label>Date *</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                </div>
                <div className="form-group"><label>Description</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Référence</label><input value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} /></div>
                  <div className="form-group"><label>Mode de paiement</label>
                    <select value={formData.modePaiement} onChange={e => setFormData({...formData, modePaiement: e.target.value})}>
                      {Object.entries(modeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                {formData.type === 'revenu' && (
                  <>
                    <h4 style={{margin: '16px 0 8px', color: '#555'}}>Donateur (optionnel)</h4>
                    <div className="form-row">
                      <div className="form-group"><label>Nom</label><input value={formData.donateur.nom} onChange={e => setFormData({...formData, donateur: {...formData.donateur, nom: e.target.value}})} /></div>
                      <div className="form-group"><label>Téléphone</label><input value={formData.donateur.telephone} onChange={e => setFormData({...formData, donateur: {...formData.donateur, telephone: e.target.value}})} /></div>
                    </div>
                  </>
                )}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
};

export default FinancialTracker;
