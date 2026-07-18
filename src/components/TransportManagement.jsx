import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessionalLayout from '../professional/ProfessionalLayout';
import { transportAPI } from '../services/api';
import './TransportManagement.css';

const TransportManagement = () => {
  const navigate = useNavigate();
  const [moduleAllowed, setModuleAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('vehicles');

  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    matricule: '',
    marque: '',
    modele: '',
    statut: 'actif',
    notes: ''
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicleId: '',
    type: '',
    date: '',
    cost: '',
    mechanic: '',
    notes: ''
  });

  const [incidentForm, setIncidentForm] = useState({
    vehicleId: '',
    description: '',
    status: 'en_cours'
  });

  useEffect(() => {
    const userData = localStorage.getItem('professionalUser');
    if (!userData) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      const hasTransport = parsedUser?.association ? Boolean(parsedUser.association.hasTransport) : false;
      if (!hasTransport) {
        setModuleAllowed(false);
      }
    } catch {
      setModuleAllowed(false);
    }
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [vehiclesRes, maintenanceRes, incidentsRes] = await Promise.all([
        transportAPI.getVehicles(),
        transportAPI.getMaintenance(),
        transportAPI.getIncidents()
      ]);

      setVehicles(vehiclesRes.data?.data || []);
      setMaintenance(maintenanceRes.data?.data || []);
      setIncidents(incidentsRes.data?.data || []);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur de chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!moduleAllowed) return;
    loadData();
  }, [moduleAllowed]);

  const resetVehicleForm = () => {
    setVehicleForm({ matricule: '', marque: '', modele: '', statut: 'actif', notes: '' });
    setEditingVehicleId(null);
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingVehicleId) {
        await transportAPI.updateVehicle(editingVehicleId, vehicleForm);
      } else {
        await transportAPI.createVehicle(vehicleForm);
      }
      resetVehicleForm();
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur lors de la sauvegarde';
      setError(message);
    }
  };

  const handleEditVehicle = (vehicle) => {
    setEditingVehicleId(vehicle._id);
    setVehicleForm({
      matricule: vehicle.matricule || '',
      marque: vehicle.marque || '',
      modele: vehicle.modele || '',
      statut: vehicle.statut || 'actif',
      notes: vehicle.notes || ''
    });
    setActiveTab('vehicles');
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Supprimer ce vehicule ?')) return;
    setError('');
    try {
      await transportAPI.deleteVehicle(vehicleId);
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur lors de la suppression';
      setError(message);
    }
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await transportAPI.createMaintenance({
        vehicleId: maintenanceForm.vehicleId,
        type: maintenanceForm.type,
        date: maintenanceForm.date || undefined,
        cost: maintenanceForm.cost ? Number(maintenanceForm.cost) : 0,
        mechanic: maintenanceForm.mechanic,
        notes: maintenanceForm.notes
      });
      setMaintenanceForm({ vehicleId: '', type: '', date: '', cost: '', mechanic: '', notes: '' });
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur maintenance';
      setError(message);
    }
  };

  const handleDeleteMaintenance = async (maintenanceId) => {
    if (!window.confirm('Supprimer cette maintenance ?')) return;
    setError('');
    try {
      await transportAPI.deleteMaintenance(maintenanceId);
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur suppression';
      setError(message);
    }
  };

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await transportAPI.createIncident({
        vehicleId: incidentForm.vehicleId,
        description: incidentForm.description,
        status: incidentForm.status
      });
      setIncidentForm({ vehicleId: '', description: '', status: 'en_cours' });
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur incident';
      setError(message);
    }
  };

  const handleResolveIncident = async (incidentId) => {
    setError('');
    try {
      await transportAPI.resolveIncident(incidentId);
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur resolution';
      setError(message);
    }
  };

  const handleDeleteIncident = async (incidentId) => {
    if (!window.confirm('Supprimer cet incident ?')) return;
    setError('');
    try {
      await transportAPI.deleteIncident(incidentId);
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Erreur suppression';
      setError(message);
    }
  };

  if (!moduleAllowed) {
    return (
      <ProfessionalLayout>
        <div className="module-locked">
          <h2>Module Transport</h2>
          <p>Ce module est desactive pour cette association.</p>
        </div>
      </ProfessionalLayout>
    );
  }

  if (loading) {
    return (
      <ProfessionalLayout>
        <div className="transport-loading">Chargement...</div>
      </ProfessionalLayout>
    );
  }

  return (
    <ProfessionalLayout>
      <div className="transport-container">
        <div className="transport-header">
          <div>
            <h1>🚚 Gestion Transport</h1>
            <p>Vehicules, maintenance et incidents</p>
          </div>
          <div className="transport-tabs">
            <button
              type="button"
              className={activeTab === 'vehicles' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('vehicles')}
            >
              Vehicules
            </button>
            <button
              type="button"
              className={activeTab === 'maintenance' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('maintenance')}
            >
              Maintenance
            </button>
            <button
              type="button"
              className={activeTab === 'incidents' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('incidents')}
            >
              Incidents
            </button>
          </div>
        </div>

        {error && <div className="transport-error">{error}</div>}

        {activeTab === 'vehicles' && (
          <div className="transport-grid">
            <div className="transport-card">
              <h2>{editingVehicleId ? 'Modifier un vehicule' : 'Ajouter un vehicule'}</h2>
              <form onSubmit={handleVehicleSubmit} className="transport-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Matricule *</label>
                    <input
                      type="text"
                      value={vehicleForm.matricule}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, matricule: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Marque</label>
                    <input
                      type="text"
                      value={vehicleForm.marque}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, marque: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Modele</label>
                    <input
                      type="text"
                      value={vehicleForm.modele}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, modele: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={vehicleForm.statut}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, statut: e.target.value })}
                    >
                      <option value="actif">Actif</option>
                      <option value="en_panne">En panne</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows="3"
                    value={vehicleForm.notes}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingVehicleId ? 'Mettre a jour' : 'Ajouter'}
                  </button>
                  {editingVehicleId && (
                    <button type="button" className="btn-secondary" onClick={resetVehicleForm}>
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="transport-card">
              <h2>Liste des vehicules</h2>
              {vehicles.length === 0 ? (
                <p className="empty-state">Aucun vehicule enregistre.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="transport-table">
                    <thead>
                      <tr>
                        <th>Matricule</th>
                        <th>Marque / Modele</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((vehicle) => (
                        <tr key={vehicle._id}>
                          <td>{vehicle.matricule}</td>
                          <td>{[vehicle.marque, vehicle.modele].filter(Boolean).join(' ') || '-'}</td>
                          <td>
                            <span className={`status-badge ${vehicle.statut}`}>
                              {vehicle.statut}
                            </span>
                          </td>
                          <td className="table-actions">
                            <button type="button" className="btn-link" onClick={() => handleEditVehicle(vehicle)}>
                              Modifier
                            </button>
                            <button type="button" className="btn-link danger" onClick={() => handleDeleteVehicle(vehicle._id)}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="transport-grid">
            <div className="transport-card">
              <h2>Ajouter une maintenance</h2>
              <form onSubmit={handleMaintenanceSubmit} className="transport-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicule *</label>
                    <select
                      value={maintenanceForm.vehicleId}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleId: e.target.value })}
                      required
                    >
                      <option value="">Selectionner</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.matricule} - {vehicle.marque || 'Sans marque'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <input
                      type="text"
                      value={maintenanceForm.type}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, type: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={maintenanceForm.date}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cout</label>
                    <input
                      type="number"
                      min="0"
                      value={maintenanceForm.cost}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mecanicien</label>
                    <input
                      type="text"
                      value={maintenanceForm.mechanic}
                      onChange={(e) => setMaintenanceForm({ ...maintenanceForm, mechanic: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    rows="3"
                    value={maintenanceForm.notes}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Ajouter
                </button>
              </form>
            </div>

            <div className="transport-card">
              <h2>Historique maintenance</h2>
              {maintenance.length === 0 ? (
                <p className="empty-state">Aucune maintenance enregistree.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="transport-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Vehicule</th>
                        <th>Type</th>
                        <th>Cout</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenance.map((item) => (
                        <tr key={item._id}>
                          <td>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{item.vehicle?.matricule || '-'}</td>
                          <td>{item.type}</td>
                          <td>{item.cost ? `${item.cost} MAD` : '-'}</td>
                          <td className="table-actions">
                            <button type="button" className="btn-link danger" onClick={() => handleDeleteMaintenance(item._id)}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="transport-grid">
            <div className="transport-card">
              <h2>Declarer un incident</h2>
              <form onSubmit={handleIncidentSubmit} className="transport-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicule *</label>
                    <select
                      value={incidentForm.vehicleId}
                      onChange={(e) => setIncidentForm({ ...incidentForm, vehicleId: e.target.value })}
                      required
                    >
                      <option value="">Selectionner</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.matricule} - {vehicle.marque || 'Sans marque'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={incidentForm.status}
                      onChange={(e) => setIncidentForm({ ...incidentForm, status: e.target.value })}
                    >
                      <option value="en_cours">En cours</option>
                      <option value="resolu">Resolu</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    rows="4"
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
              </form>
            </div>

            <div className="transport-card">
              <h2>Incidents</h2>
              {incidents.length === 0 ? (
                <p className="empty-state">Aucun incident enregistre.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="transport-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Vehicule</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.map((item) => (
                        <tr key={item._id}>
                          <td>{item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{item.vehicle?.matricule || '-'}</td>
                          <td>
                            <span className={`status-badge ${item.status}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="table-actions">
                            {item.status !== 'resolu' && (
                              <button type="button" className="btn-link" onClick={() => handleResolveIncident(item._id)}>
                                Resoudre
                              </button>
                            )}
                            <button type="button" className="btn-link danger" onClick={() => handleDeleteIncident(item._id)}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProfessionalLayout>
  );
};

export default TransportManagement;
