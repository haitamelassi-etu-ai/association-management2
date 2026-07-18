import React, { useState, useEffect } from 'react';
import { API_URL, getAuthToken } from '../utils/api';
import ProfessionalLayout from '../professional/ProfessionalLayout';
import './VolunteerPortal.css';

const VolunteerPortal = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '', cin: '',
    adresse: '', competences: '', status: 'en_attente', notes: ''
  });
  const [taskData, setTaskData] = useState({ titre: '', description: '', heures: '', status: 'assignee' });

  const getToken = () => {
    const pu = localStorage.getItem('professionalUser');
    if (pu) return JSON.parse(pu).token;
    return getAuthToken();
  };

  const headers = { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' };

  useEffect(() => { loadData(); }, [filterStatus, search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (search) params.append('search', search);

      const [volRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/volunteers?${params}`, { headers }),
        fetch(`${API_URL}/volunteers/stats`, { headers })
      ]);
      const [vData, sData] = await Promise.all([volRes.json(), statsRes.json()]);
      if (vData.success) setVolunteers(vData.data);
      if (sData.success) setStats(sData.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...formData,
        competences: formData.competences.split(',').map(s => s.trim()).filter(Boolean)
      };
      const url = selectedVolunteer ? `${API_URL}/volunteers/${selectedVolunteer._id}` : `${API_URL}/volunteers`;
      const method = selectedVolunteer ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { setShowModal(false); resetForm(); loadData(); }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedVolunteer) return;
    try {
      const res = await fetch(`${API_URL}/volunteers/${selectedVolunteer._id}/tasks`, {
        method: 'POST', headers, body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (data.success) {
        setShowTaskModal(false);
        setTaskData({ titre: '', description: '', heures: '', status: 'assignee' });
        loadData();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleUpdateTaskStatus = async (volunteerId, taskId, newStatus, heures) => {
    try {
      const body = { status: newStatus };
      if (heures) body.heures = Number(heures);
      await fetch(`${API_URL}/volunteers/${volunteerId}/tasks/${taskId}`, {
        method: 'PUT', headers, body: JSON.stringify(body)
      });
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce bénévole ?')) return;
    try {
      await fetch(`${API_URL}/volunteers/${id}`, { method: 'DELETE', headers });
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const editVolunteer = (v) => {
    setSelectedVolunteer(v);
    setFormData({
      nom: v.nom, prenom: v.prenom, email: v.email || '', telephone: v.telephone || '',
      cin: v.cin || '', adresse: v.adresse || '',
      competences: (v.competences || []).join(', '),
      status: v.status, notes: v.notes || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setSelectedVolunteer(null);
    setFormData({ nom: '', prenom: '', email: '', telephone: '', cin: '', adresse: '', competences: '', status: 'en_attente', notes: '' });
  };

  const statusLabels = { actif: '🟢 Actif', inactif: '🔴 Inactif', en_attente: '🟡 En attente' };
  const taskStatusLabels = { assignee: '📋 Assignée', en_cours: '🔄 En cours', terminee: '✅ Terminée', annulee: '❌ Annulée' };

  return (
    <ProfessionalLayout>
      <div className="volunteer-portal">
        <div className="page-header">
          <h1>🤝 Portail Bénévoles</h1>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Ajouter un Bénévole</button>
        </div>

        <div className="stats-grid">
          <div className="stat-card green"><div className="stat-icon">🟢</div><div className="stat-info"><span className="stat-value">{stats.actifs || 0}</span><span className="stat-label">Actifs</span></div></div>
          <div className="stat-card amber"><div className="stat-icon">🟡</div><div className="stat-info"><span className="stat-value">{stats.enAttente || 0}</span><span className="stat-label">En attente</span></div></div>
          <div className="stat-card blue"><div className="stat-icon">📊</div><div className="stat-info"><span className="stat-value">{stats.total || 0}</span><span className="stat-label">Total</span></div></div>
          <div className="stat-card purple"><div className="stat-icon">⏱️</div><div className="stat-info"><span className="stat-value">{stats.totalHeures || 0}h</span><span className="stat-label">Heures totales</span></div></div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>📋 Liste</button>
          <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>✅ Tâches</button>
        </div>

        <div className="filters-bar">
          <input type="text" placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="status-select">
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="en_attente">En attente</option>
          </select>
        </div>

        {loading ? <div className="loading-state">Chargement...</div> : activeTab === 'list' ? (
          <div className="cards-grid">
            {volunteers.length === 0 ? <div className="empty-state">Aucun bénévole trouvé</div> :
              volunteers.map(v => (
                <div key={v._id} className="volunteer-card">
                  <div className="card-header">
                    <div className="avatar">{v.prenom[0]}{v.nom[0]}</div>
                    <div className="card-title">
                      <h3>{v.prenom} {v.nom}</h3>
                      <span className={`status-badge ${v.status}`}>{statusLabels[v.status]}</span>
                    </div>
                  </div>
                  <div className="card-body">
                    {v.email && <p>📧 {v.email}</p>}
                    {v.telephone && <p>📱 {v.telephone}</p>}
                    {v.competences?.length > 0 && (
                      <div className="competences">{v.competences.map((c, i) => <span key={i} className="comp-tag">{c}</span>)}</div>
                    )}
                    <p className="hours">⏱️ {v.totalHeures || 0} heures · {v.taches?.length || 0} tâches</p>
                  </div>
                  <div className="card-actions">
                    <button className="btn-sm btn-edit" onClick={() => editVolunteer(v)}>✏️ Modifier</button>
                    <button className="btn-sm btn-task" onClick={() => { setSelectedVolunteer(v); setShowTaskModal(true); }}>📋 Tâche</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(v._id)}>🗑️</button>
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="tasks-view">
            {volunteers.filter(v => v.taches?.length > 0).length === 0 ? <div className="empty-state">Aucune tâche assignée</div> :
              volunteers.filter(v => v.taches?.length > 0).map(v => (
                <div key={v._id} className="volunteer-tasks">
                  <h3>{v.prenom} {v.nom}</h3>
                  <div className="tasks-list">
                    {v.taches.map(t => (
                      <div key={t._id} className={`task-item ${t.status}`}>
                        <div className="task-info">
                          <strong>{t.titre}</strong>
                          <p>{t.description}</p>
                          <small>{t.heures ? `${t.heures}h` : ''} · {taskStatusLabels[t.status]}</small>
                        </div>
                        <div className="task-actions">
                          <select value={t.status} onChange={e => handleUpdateTaskStatus(v._id, t._id, e.target.value)}>
                            <option value="assignee">Assignée</option>
                            <option value="en_cours">En cours</option>
                            <option value="terminee">Terminée</option>
                            <option value="annulee">Annulée</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Add/Edit Volunteer Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedVolunteer ? 'Modifier' : 'Ajouter'} un Bénévole</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group"><label>Prénom *</label><input required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} /></div>
                  <div className="form-group"><label>Nom *</label><input required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                  <div className="form-group"><label>Téléphone</label><input value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>CIN</label><input value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} /></div>
                  <div className="form-group"><label>Statut</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="en_attente">En attente</option>
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Adresse</label><input value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} /></div>
                <div className="form-group"><label>Compétences (séparées par des virgules)</label><input value={formData.competences} onChange={e => setFormData({...formData, competences: e.target.value})} placeholder="Cuisine, Transport, Aide médicale..." /></div>
                <div className="form-group"><label>Notes</label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={3} /></div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">{selectedVolunteer ? 'Mettre à jour' : 'Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showTaskModal && (
          <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
            <div className="modal-content small" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assigner une tâche à {selectedVolunteer?.prenom}</h2>
                <button className="modal-close" onClick={() => setShowTaskModal(false)}>✕</button>
              </div>
              <form onSubmit={handleAddTask} className="modal-form">
                <div className="form-group"><label>Titre *</label><input required value={taskData.titre} onChange={e => setTaskData({...taskData, titre: e.target.value})} /></div>
                <div className="form-group"><label>Description</label><textarea value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} rows={3} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Heures estimées</label><input type="number" step="0.5" value={taskData.heures} onChange={e => setTaskData({...taskData, heures: e.target.value})} /></div>
                  <div className="form-group"><label>Statut</label>
                    <select value={taskData.status} onChange={e => setTaskData({...taskData, status: e.target.value})}>
                      <option value="assignee">Assignée</option>
                      <option value="en_cours">En cours</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Annuler</button>
                  <button type="submit" className="btn-primary">Assigner</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
};

export default VolunteerPortal;
