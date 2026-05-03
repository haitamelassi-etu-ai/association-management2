import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';
import ProfessionalLayout from '../professional/ProfessionalLayout';
import ExportButtons from './ExportButtons';
import './MedicalStockManagement.css';

const BASE = `${API_URL}/medical-stock`;

const CATEGORIES = [
  { value: 'mobilite',       label: 'Mobilité' },
  { value: 'soins',          label: 'Soins' },
  { value: 'diagnostic',     label: 'Diagnostic' },
  { value: 'rehabilitation', label: 'Réhabilitation' },
  { value: 'hygiene',        label: 'Hygiène' },
  { value: 'autre',          label: 'Autre' },
];

const ETATS = [
  { value: 'bon',          label: 'Bon état' },
  { value: 'endommage',    label: 'Endommagé' },
  { value: 'hors_service', label: 'Hors service' },
];

const STATUTS = [
  { value: 'disponible',   label: 'Disponible' },
  { value: 'en_pret',      label: 'En prêt' },
  { value: 'maintenance',  label: 'Maintenance' },
  { value: 'hors_service', label: 'Hors service' },
];

const UNITES = ['pièces', 'unités', 'boîtes', 'paires', 'lots'];

const EMPTY_FORM = {
  nom: '', categorie: 'autre', quantite: 1, unite: 'pièces',
  etat: 'bon', statut: 'disponible', fournisseur: '', emplacement: '',
  dateAcquisition: new Date().toISOString().split('T')[0],
  valeur: 0, numeroSerie: '', notes: '',
};

const fmtN = (n) => Number(n || 0).toLocaleString('fr-FR');
const fmt  = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—';

function badge(value, map) {
  const entry = map.find(m => m.value === value);
  return <span className={`ms-badge ms-badge-${value}`}>{entry?.label || value}</span>;
}

const MEDICAL_EXPORT_COLUMNS = [
  { header: 'Nom',         accessor: r => r.nom },
  { header: 'Catégorie',   accessor: r => CATEGORIES.find(c => c.value === r.categorie)?.label || r.categorie },
  { header: 'Quantité',    accessor: r => `${r.quantite} ${r.unite || ''}`.trim() },
  { header: 'État',        accessor: r => ETATS.find(e => e.value === r.etat)?.label || r.etat },
  { header: 'Statut',      accessor: r => STATUTS.find(s => s.value === r.statut)?.label || r.statut },
  { header: 'Fournisseur', accessor: r => r.fournisseur },
  { header: 'Emplacement', accessor: r => r.emplacement },
  { header: 'N° Série',    accessor: r => r.numeroSerie },
  { header: 'Valeur (DH)', accessor: r => r.valeur != null ? fmtN(r.valeur) : '' },
  { header: 'Acquisition', accessor: r => fmt(r.dateAcquisition) },
];

export default function MedicalStockManagement() {
  const [items,   setItems]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('liste');

  const [filters, setFilters] = useState({ etat: '', statut: '', categorie: '', search: '' });
  const [sortField, setSortField] = useState('nom');
  const [sortDir,   setSortDir]   = useState('asc');

  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [formData,    setFormData]    = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.etat)      params.etat      = filters.etat;
      if (filters.statut)    params.statut    = filters.statut;
      if (filters.categorie) params.categorie = filters.categorie;
      if (filters.search)    params.search    = filters.search;

      const [itemsRes, statsRes] = await Promise.all([
        axios.get(BASE, { params }),
        axios.get(`${BASE}/stats`),
      ]);
      setItems(itemsRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...items].sort((a, b) => {
    let va = a[sortField], vb = b[sortField];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const openAdd = () => {
    setEditItem(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      nom:             item.nom || '',
      categorie:       item.categorie || 'autre',
      quantite:        item.quantite ?? 1,
      unite:           item.unite || 'pièces',
      etat:            item.etat || 'bon',
      statut:          item.statut || 'disponible',
      fournisseur:     item.fournisseur || '',
      emplacement:     item.emplacement || '',
      dateAcquisition: item.dateAcquisition ? item.dateAcquisition.split('T')[0] : '',
      valeur:          item.valeur ?? 0,
      numeroSerie:     item.numeroSerie || '',
      notes:           item.notes || '',
    });
    setShowModal(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await axios.put(`${BASE}/${editItem._id}`, formData);
      } else {
        await axios.post(BASE, formData);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${BASE}/${deleteConfirm._id}`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const setF = (k, v) => setFormData(f => ({ ...f, [k]: v }));
  const setFilt = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <ProfessionalLayout>
      <div className="ms-page">

        {/* Header */}
        <div className="ms-header">
          <div>
            <h1>🏥 Stock Médical</h1>
            <p>Matériel et équipements médicaux</p>
          </div>
          <div className="ms-header-actions">
            <ExportButtons
              title="Stock Médical"
              columns={MEDICAL_EXPORT_COLUMNS}
              rows={sorted}
            />
            <button className="ms-btn ms-btn-secondary" onClick={load}>🔄 Actualiser</button>
            <button className="ms-btn ms-btn-primary" onClick={openAdd}>+ Ajouter un article</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="ms-tabs">
          {[['liste', '📋 Liste'], ['stats', '📊 Statistiques']].map(([k, l]) => (
            <button key={k} className={`ms-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div className="ms-loading"><div className="ms-spinner" /><p>Chargement…</p></div>
        ) : tab === 'liste' ? (
          <>
            {/* Filters */}
            <div className="ms-filters">
              <input
                className="ms-search" placeholder="Rechercher…"
                value={filters.search} onChange={e => setFilt('search', e.target.value)}
              />
              <select value={filters.categorie} onChange={e => setFilt('categorie', e.target.value)}>
                <option value="">Toutes catégories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <select value={filters.etat} onChange={e => setFilt('etat', e.target.value)}>
                <option value="">Tous états</option>
                {ETATS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
              <select value={filters.statut} onChange={e => setFilt('statut', e.target.value)}>
                <option value="">Tous statuts</option>
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {(filters.search || filters.categorie || filters.etat || filters.statut) && (
                <button className="ms-btn-clear" onClick={() => setFilters({ etat: '', statut: '', categorie: '', search: '' })}>✕ Réinitialiser</button>
              )}
            </div>

            {/* Table */}
            <div className="ms-table-wrap">
              <table className="ms-table">
                <thead>
                  <tr>
                    {[['nom','Nom'],['categorie','Catégorie'],['quantite','Qté'],['etat','État'],['statut','Statut'],['emplacement','Emplacement'],['dateAcquisition','Acquisition']].map(([f,l]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="sortable">
                        {l} {sortField === f ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr><td colSpan={8} className="ms-empty">Aucun article trouvé</td></tr>
                  ) : sorted.map(item => (
                    <tr key={item._id}>
                      <td>
                        <div className="ms-item-name">{item.nom}</div>
                        {item.numeroSerie && <div className="ms-item-sub">N° {item.numeroSerie}</div>}
                      </td>
                      <td>{CATEGORIES.find(c => c.value === item.categorie)?.label || item.categorie}</td>
                      <td><strong>{item.quantite}</strong> {item.unite}</td>
                      <td>{badge(item.etat, ETATS)}</td>
                      <td>{badge(item.statut, STATUTS)}</td>
                      <td>{item.emplacement || '—'}</td>
                      <td>{fmt(item.dateAcquisition)}</td>
                      <td>
                        <div className="ms-row-actions">
                          <button className="ms-btn-icon" title="Modifier" onClick={() => openEdit(item)}>✏️</button>
                          <button className="ms-btn-icon ms-btn-danger" title="Supprimer" onClick={() => setDeleteConfirm(item)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ms-table-footer">{sorted.length} article{sorted.length !== 1 ? 's' : ''}</div>
          </>
        ) : (
          /* Stats tab */
          stats && (
            <div className="ms-stats-grid">
              <StatCard icon="📦" label="Total articles" value={fmtN(stats.total)} color="blue" />
              <StatCard icon="💰" label="Valeur totale" value={`${fmtN(stats.valeurTotale)} DH`} color="purple" />

              <div className="ms-stat-group">
                <h3>Par état</h3>
                {ETATS.map(e => (
                  <div key={e.value} className="ms-stat-row">
                    <span>{e.label}</span>
                    <strong>{fmtN(stats.byEtat?.[e.value] || 0)}</strong>
                  </div>
                ))}
              </div>

              <div className="ms-stat-group">
                <h3>Par statut</h3>
                {STATUTS.map(s => (
                  <div key={s.value} className="ms-stat-row">
                    <span>{s.label}</span>
                    <strong>{fmtN(stats.byStatut?.[s.value] || 0)}</strong>
                  </div>
                ))}
              </div>

              <div className="ms-stat-group ms-stat-group-wide">
                <h3>Par catégorie</h3>
                <div className="ms-cat-grid">
                  {CATEGORIES.map(c => (
                    <div key={c.value} className="ms-cat-item">
                      <div className="ms-cat-count">{fmtN(stats.byCategorie?.[c.value] || 0)}</div>
                      <div className="ms-cat-label">{c.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="ms-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="ms-modal" onClick={e => e.stopPropagation()}>
              <div className="ms-modal-header">
                <h2>{editItem ? 'Modifier l\'article' : 'Ajouter un article médical'}</h2>
                <button className="ms-modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={saveItem} className="ms-form">
                <div className="ms-form-grid">
                  <div className="ms-field ms-field-wide">
                    <label>Nom *</label>
                    <input required value={formData.nom} onChange={e => setF('nom', e.target.value)} placeholder="Nom de l'article" />
                  </div>
                  <div className="ms-field">
                    <label>Catégorie</label>
                    <select value={formData.categorie} onChange={e => setF('categorie', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="ms-field">
                    <label>Quantité</label>
                    <input type="number" min="0" value={formData.quantite} onChange={e => setF('quantite', +e.target.value)} />
                  </div>
                  <div className="ms-field">
                    <label>Unité</label>
                    <select value={formData.unite} onChange={e => setF('unite', e.target.value)}>
                      {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="ms-field">
                    <label>État</label>
                    <select value={formData.etat} onChange={e => setF('etat', e.target.value)}>
                      {ETATS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </div>
                  <div className="ms-field">
                    <label>Statut</label>
                    <select value={formData.statut} onChange={e => setF('statut', e.target.value)}>
                      {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="ms-field">
                    <label>Valeur (DH)</label>
                    <input type="number" min="0" value={formData.valeur} onChange={e => setF('valeur', +e.target.value)} />
                  </div>
                  <div className="ms-field">
                    <label>Numéro de série</label>
                    <input value={formData.numeroSerie} onChange={e => setF('numeroSerie', e.target.value)} placeholder="SN-XXXX" />
                  </div>
                  <div className="ms-field">
                    <label>Fournisseur</label>
                    <input value={formData.fournisseur} onChange={e => setF('fournisseur', e.target.value)} />
                  </div>
                  <div className="ms-field">
                    <label>Emplacement</label>
                    <input value={formData.emplacement} onChange={e => setF('emplacement', e.target.value)} />
                  </div>
                  <div className="ms-field">
                    <label>Date d'acquisition</label>
                    <input type="date" value={formData.dateAcquisition} onChange={e => setF('dateAcquisition', e.target.value)} />
                  </div>
                  <div className="ms-field ms-field-wide">
                    <label>Notes</label>
                    <textarea rows={3} value={formData.notes} onChange={e => setF('notes', e.target.value)} />
                  </div>
                </div>
                <div className="ms-modal-footer">
                  <button type="button" className="ms-btn ms-btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="ms-btn ms-btn-primary" disabled={saving}>
                    {saving ? 'Enregistrement…' : (editItem ? 'Modifier' : 'Ajouter')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="ms-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="ms-modal ms-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="ms-modal-header">
                <h2>Confirmer la suppression</h2>
                <button className="ms-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
              </div>
              <div className="ms-modal-body">
                <p>Supprimer <strong>{deleteConfirm.nom}</strong> ?</p>
                <p className="ms-warn">Cette action est irréversible.</p>
              </div>
              <div className="ms-modal-footer">
                <button className="ms-btn ms-btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className="ms-btn ms-btn-danger" onClick={confirmDelete}>Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`ms-stat-card ms-stat-${color}`}>
      <div className="ms-stat-icon">{icon}</div>
      <div className="ms-stat-value">{value}</div>
      <div className="ms-stat-label">{label}</div>
    </div>
  );
}
