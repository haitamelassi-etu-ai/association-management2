import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { associationsAPI } from '../services/api'
import './AssociationsManagement.css'

const initialForm = {
  name: '',
  logoUrl: '',
  address: '',
  hasStock: true,
  hasTransport: false,
  isActive: true
}

function AssociationsManagement() {
  const [associations, setAssociations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('professionalToken')
    if (!token) {
      navigate('/login')
      return
    }
    loadAssociations()
  }, [navigate])

  const loadAssociations = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await associationsAPI.getAll()
      setAssociations(res.data?.data || [])
    } catch (err) {
      console.error('Failed to load associations:', err)
      if (err.response?.status === 401) {
        navigate('/login')
      } else if (err.response?.status === 403) {
        setError('Acces refuse. Admin requis.')
      } else {
        setError('Impossible de charger les associations.')
      }
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setFormData(initialForm)
    setShowModal(true)
  }

  const openEdit = (association) => {
    setEditingId(association._id)
    setFormData({
      name: association.name || '',
      logoUrl: association.logoUrl || '',
      address: association.address || '',
      hasStock: Boolean(association.hasStock),
      hasTransport: Boolean(association.hasTransport),
      isActive: typeof association.isActive === 'boolean' ? association.isActive : true
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      if (editingId) {
        await associationsAPI.update(editingId, formData)
      } else {
        await associationsAPI.create(formData)
      }
      await loadAssociations()
      setShowModal(false)
    } catch (err) {
      console.error('Failed to save association:', err)
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (association) => {
    if (association.isDefault) return
    setError('')
    try {
      await associationsAPI.update(association._id, { isActive: !association.isActive })
      await loadAssociations()
    } catch (err) {
      console.error('Failed to toggle status:', err)
      setError(err.response?.data?.message || 'Erreur lors du changement de statut')
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🏢 Gestion des Associations</h1>
        <div className="admin-actions">
          <button onClick={() => navigate('/admin')} className="btn-secondary">
            ← Retour au panneau
          </button>
          <button onClick={openCreate} className="btn-primary">
            ➕ Nouvelle association
          </button>
        </div>
      </div>

      <div className="associations-page">
        {error && (
          <div className="error-message">
            ⚠️ {error}
            <button onClick={() => setError('')} className="btn-clear">✕</button>
          </div>
        )}

        <div className="content-card">
          {loading ? (
            <div className="empty-state">Chargement...</div>
          ) : associations.length === 0 ? (
            <div className="empty-state">Aucune association trouvee.</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Association</th>
                    <th>Modules</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {associations.map((association) => (
                    <tr key={association._id}>
                      <td>
                        <div className="assoc-name">
                          <strong>{association.name}</strong>
                          {association.isDefault && <span className="tag">Par defaut</span>}
                        </div>
                        {association.address && (
                          <div className="assoc-sub">{association.address}</div>
                        )}
                      </td>
                      <td>
                        <div className="module-badges">
                          {association.hasStock && <span className="badge stock">Stock</span>}
                          {association.hasTransport && <span className="badge transport">Transport</span>}
                          {!association.hasStock && !association.hasTransport && (
                            <span className="badge off">Aucun</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`status ${association.isActive ? 'active' : 'inactive'}`}>
                          {association.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-link" onClick={() => openEdit(association)}>
                            Modifier
                          </button>
                          <button
                            className="btn-link danger"
                            onClick={() => toggleActive(association)}
                            disabled={association.isDefault}
                          >
                            {association.isActive ? 'Desactiver' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Modifier association' : 'Nouvelle association'}</h2>
            <form onSubmit={handleSubmit} className="association-form">
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Logo URL</label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Modules</label>
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.hasStock}
                      onChange={(e) => setFormData({ ...formData, hasStock: e.target.checked })}
                    />
                    Stock
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.hasTransport}
                      onChange={(e) => setFormData({ ...formData, hasTransport: e.target.checked })}
                    />
                    Transport
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Statut</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? 'En cours...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssociationsManagement
