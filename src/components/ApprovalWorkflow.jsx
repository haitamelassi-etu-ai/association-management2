import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL, getAuthHeaders } from '../utils/api'
import './ApprovalWorkflow.css'

function ApprovalWorkflow() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [comment, setComment] = useState('')
  const [formData, setFormData] = useState({
    type: 'leave',
    title: '',
    description: '',
    priority: 'medium',
    startDate: '',
    endDate: '',
    leaveType: 'annual'
  })

  const requestTypes = [
    { value: 'leave', label: 'Congé', icon: '🏖️' },
    { value: 'stock', label: 'Stock', icon: '📦' },
    { value: 'expense', label: 'Dépense', icon: '💰' },
    { value: 'document', label: 'Document', icon: '📄' },
    { value: 'general', label: 'Autre', icon: '📋' }
  ]

  const leaveTypes = [
    { value: 'annual', label: 'Congé annuel' },
    { value: 'sick', label: 'Congé maladie' },
    { value: 'personal', label: 'Congé personnel' },
    { value: 'emergency', label: 'Congé d\'urgence' },
    { value: 'other', label: 'Autre' }
  ]

  const priorities = [
    { value: 'low', label: 'Basse', color: '#27ae60' },
    { value: 'medium', label: 'Moyenne', color: '#f39c12' },
    { value: 'high', label: 'Haute', color: '#e67e22' },
    { value: 'urgent', label: 'Urgente', color: '#e74c3c' }
  ]

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const status = activeTab === 'all' ? '' : activeTab
      const response = await fetch(
        `${API_URL}/approvals?status=${status}`,
        {
          headers: getAuthHeaders()
        }
      )
      const data = await response.json()
      if (data.success) {
        setRequests(data.data)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        `${API_URL}/approvals`,
        {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(formData)
        }
      )
      const data = await response.json()
      if (data.success) {
        setShowModal(false)
        fetchRequests()
        resetForm()
      }
    } catch (error) {
      console.error('Error creating request:', error)
    }
  }

  const handleAction = async (requestId, action) => {
    try {
      const response = await fetch(
        `${API_URL}/approvals/${requestId}/${action}`,
        {
          method: 'PATCH',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ comment })
        }
      )
      const data = await response.json()
      if (data.success) {
        setSelectedRequest(null)
        setComment('')
        fetchRequests()
      }
    } catch (error) {
      console.error(`Error ${action} request:`, error)
    }
  }

  const resetForm = () => {
    setFormData({
      type: 'leave',
      title: '',
      description: '',
      priority: 'medium',
      startDate: '',
      endDate: '',
      leaveType: 'annual'
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', color: '#f39c12', icon: '⏳' },
      approved: { label: 'Approuvé', color: '#27ae60', icon: '✅' },
      rejected: { label: 'Rejeté', color: '#e74c3c', icon: '❌' },
      cancelled: { label: 'Annulé', color: '#95a5a6', icon: '🚫' }
    }
    return badges[status] || badges.pending
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="approval-workflow">
      <div className="workflow-header">
        <div className="header-info">
          <h2>📋 Demandes d'approbation</h2>
          <p>Gérez vos demandes de congé, stock et dépenses</p>
        </div>
        <button className="new-request-btn" onClick={() => setShowModal(true)}>
          ➕ Nouvelle demande
        </button>
      </div>

      {/* Tabs */}
      <div className="workflow-tabs">
        <button 
          className={activeTab === 'pending' ? 'active' : ''} 
          onClick={() => setActiveTab('pending')}
        >
          ⏳ En attente
        </button>
        <button 
          className={activeTab === 'approved' ? 'active' : ''} 
          onClick={() => setActiveTab('approved')}
        >
          ✅ Approuvées
        </button>
        <button 
          className={activeTab === 'rejected' ? 'active' : ''} 
          onClick={() => setActiveTab('rejected')}
        >
          ❌ Rejetées
        </button>
        <button 
          className={activeTab === 'all' ? 'active' : ''} 
          onClick={() => setActiveTab('all')}
        >
          📋 Toutes
        </button>
      </div>

      {/* Requests List */}
      <div className="requests-list">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Aucune demande {activeTab !== 'all' ? `${getStatusBadge(activeTab).label.toLowerCase()}` : ''}</p>
          </div>
        ) : (
          requests.map(request => {
            const typeInfo = requestTypes.find(t => t.value === request.type)
            const statusInfo = getStatusBadge(request.status)
            const priorityInfo = priorities.find(p => p.value === request.priority)

            return (
              <div 
                key={request._id} 
                className="request-card"
                onClick={() => setSelectedRequest(request)}
              >
                <div className="request-icon">{typeInfo?.icon}</div>
                
                <div className="request-content">
                  <div className="request-header">
                    <h4>{request.title}</h4>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {statusInfo.icon} {statusInfo.label}
                    </span>
                  </div>
                  
                  <p className="request-description">{request.description}</p>
                  
                  <div className="request-meta">
                    <span className="meta-item">
                      👤 {request.requestedBy?.prenom} {request.requestedBy?.nom}
                    </span>
                    <span className="meta-item">
                      📅 {formatDate(request.createdAt)}
                    </span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: priorityInfo?.color }}
                    >
                      {priorityInfo?.label}
                    </span>
                  </div>
                </div>

                <div className="request-actions">
                  {request.status === 'pending' && (
                    <>
                      <button 
                        className="action-btn approve"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(request._id, 'approve')
                        }}
                      >
                        ✅
                      </button>
                      <button 
                        className="action-btn reject"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAction(request._id, 'reject')
                        }}
                      >
                        ❌
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="request-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Nouvelle demande</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Type de demande</label>
                <div className="type-selector">
                  {requestTypes.map(type => (
                    <button
                      key={type.value}
                      className={`type-btn ${formData.type === type.value ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, type: type.value })}
                    >
                      <span>{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Demande de congé annuel"
                />
              </div>

              {formData.type === 'leave' && (
                <>
                  <div className="form-group">
                    <label>Type de congé</label>
                    <select
                      value={formData.leaveType}
                      onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                    >
                      {leaveTypes.map(lt => (
                        <option key={lt.value} value={lt.value}>{lt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date début</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date fin</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Priorité</label>
                <div className="priority-selector">
                  {priorities.map(priority => (
                    <button
                      key={priority.value}
                      className={`priority-btn ${formData.priority === priority.value ? 'active' : ''}`}
                      style={{ '--priority-color': priority.color }}
                      onClick={() => setFormData({ ...formData, priority: priority.value })}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de votre demande..."
                  rows={4}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button 
                className="submit-btn" 
                onClick={handleSubmit}
                disabled={!formData.title}
              >
                📤 Soumettre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{requestTypes.find(t => t.value === selectedRequest.type)?.icon} Détails de la demande</h3>
              <button className="close-btn" onClick={() => setSelectedRequest(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="detail-item">
                <strong>Titre:</strong> {selectedRequest.title}
              </div>
              <div className="detail-item">
                <strong>Type:</strong> {requestTypes.find(t => t.value === selectedRequest.type)?.label}
              </div>
              <div className="detail-item">
                <strong>Statut:</strong> 
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusBadge(selectedRequest.status).color }}
                >
                  {getStatusBadge(selectedRequest.status).label}
                </span>
              </div>
              <div className="detail-item">
                <strong>Demandeur:</strong> {selectedRequest.requestedBy?.prenom} {selectedRequest.requestedBy?.nom}
              </div>
              <div className="detail-item">
                <strong>Date:</strong> {formatDate(selectedRequest.createdAt)}
              </div>
              <div className="detail-item">
                <strong>Description:</strong>
                <p>{selectedRequest.description || 'Aucune description'}</p>
              </div>

              {selectedRequest.status === 'pending' && (
                <div className="action-section">
                  <div className="form-group">
                    <label>Commentaire (optionnel)</label>
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      rows={2}
                    />
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="approve-btn"
                      onClick={() => handleAction(selectedRequest._id, 'approve')}
                    >
                      ✅ Approuver
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleAction(selectedRequest._id, 'reject')}
                    >
                      ❌ Rejeter
                    </button>
                  </div>
                </div>
              )}

              {/* Approval History */}
              {selectedRequest.approvalHistory?.length > 0 && (
                <div className="history-section">
                  <h4>📜 Historique</h4>
                  <div className="history-list">
                    {selectedRequest.approvalHistory.map((item, index) => (
                      <div key={index} className="history-item">
                        <span className="history-action">{item.action}</span>
                        <span className="history-date">{formatDate(item.timestamp)}</span>
                        {item.comment && <p className="history-comment">{item.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalWorkflow
