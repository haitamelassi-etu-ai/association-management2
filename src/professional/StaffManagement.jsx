import { useState, useEffect, useCallback } from 'react'
import ProfessionalLayout from './ProfessionalLayout'
import { usersAPI, authAPI } from '../services/api'
import './StaffManagement.css'

const ROLES = [
  { value: 'admin',       label: 'Administrateur' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'staff',       label: 'Personnel' },
]

const EMPTY_FORM = {
  prenom: '', nom: '', email: '', password: '',
  role: 'staff', telephone: '', poste: '',
}

const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('professionalUser') || '{}') } catch { return {} }
}

export default function StaffManagement() {
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showModal,     setShowModal]     = useState(false)
  const [formData,      setFormData]      = useState(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showPwd,       setShowPwd]       = useState(false)

  const me = currentUser()
  const isAdmin = me?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await usersAPI.getAll()
      setUsers(res.data.data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFormData(f => ({ ...f, [k]: v }))

  const openModal = () => {
    setFormData(EMPTY_FORM)
    setFormError('')
    setShowPwd(false)
    setShowModal(true)
  }

  const createUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await authAPI.register(formData)
      setShowModal(false)
      load()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création du compte')
    }
    setSaving(false)
  }

  const toggleActive = async (user) => {
    try {
      await usersAPI.update(user._id, { isActive: !user.isActive })
      load()
    } catch (e) { console.error(e) }
  }

  const deleteUser = async () => {
    try {
      await usersAPI.delete(deleteConfirm._id)
      setDeleteConfirm(null)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  return (
    <ProfessionalLayout>
      <div className="sf-page">

        <div className="sf-header">
          <div>
            <h1>👥 Gestion du Personnel</h1>
            <p>Comptes et accès au portail</p>
          </div>
          {isAdmin && (
            <button className="sf-btn sf-btn-primary" onClick={openModal}>
              + Créer un compte
            </button>
          )}
        </div>

        {!isAdmin && (
          <div className="sf-notice">
            Seul l'administrateur peut créer ou modifier les comptes.
          </div>
        )}

        {loading ? (
          <div className="sf-loading"><div className="sf-spinner" /><p>Chargement…</p></div>
        ) : (
          <div className="sf-table-wrap">
            <table className="sf-table">
              <thead>
                <tr>
                  <th>Nom complet</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Poste</th>
                  <th>Statut</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="sf-empty">Aucun compte trouvé</td></tr>
                ) : users.map(u => (
                  <tr key={u._id} className={!u.isActive ? 'sf-row-inactive' : ''}>
                    <td>
                      <div className="sf-name">
                        <span className="sf-avatar">{(u.prenom?.[0] || '') + (u.nom?.[0] || '')}</span>
                        <div>
                          <div className="sf-fullname">{u.prenom} {u.nom}</div>
                          {u.telephone && <div className="sf-sub">{u.telephone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>{u.poste || '—'}</td>
                    <td>
                      <span className={`sf-status sf-status-${u.isActive ? 'active' : 'inactive'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="sf-row-actions">
                          <button
                            className={`sf-btn-sm ${u.isActive ? 'sf-btn-warn' : 'sf-btn-ok'}`}
                            onClick={() => toggleActive(u)}
                            disabled={u._id === me._id}
                            title={u._id === me._id ? 'Vous ne pouvez pas modifier votre propre compte' : ''}
                          >
                            {u.isActive ? 'Désactiver' : 'Activer'}
                          </button>
                          {u._id !== me._id && (
                            <button
                              className="sf-btn-sm sf-btn-danger"
                              onClick={() => setDeleteConfirm(u)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sf-footer">{users.length} compte{users.length !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Create account modal */}
        {showModal && (
          <div className="sf-overlay" onClick={() => setShowModal(false)}>
            <div className="sf-modal" onClick={e => e.stopPropagation()}>
              <div className="sf-modal-header">
                <h2>Créer un compte</h2>
                <button className="sf-modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={createUser} className="sf-form">
                {formError && <div className="sf-error">{formError}</div>}
                <div className="sf-grid">
                  <div className="sf-field">
                    <label>Prénom *</label>
                    <input required value={formData.prenom} onChange={e => setF('prenom', e.target.value)} placeholder="Mohamed" />
                  </div>
                  <div className="sf-field">
                    <label>Nom *</label>
                    <input required value={formData.nom} onChange={e => setF('nom', e.target.value)} placeholder="Alami" />
                  </div>
                  <div className="sf-field sf-field-wide">
                    <label>Email *</label>
                    <input type="email" required value={formData.email} onChange={e => setF('email', e.target.value)} placeholder="mohamed.alami@alawal.ma" />
                  </div>
                  <div className="sf-field sf-field-wide">
                    <label>Mot de passe * (6 caractères min.)</label>
                    <div className="sf-pwd-wrap">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required minLength={6}
                        value={formData.password}
                        onChange={e => setF('password', e.target.value)}
                        placeholder="••••••••"
                      />
                      <button type="button" className="sf-pwd-toggle" onClick={() => setShowPwd(v => !v)}>
                        {showPwd ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div className="sf-field">
                    <label>Rôle</label>
                    <select value={formData.role} onChange={e => setF('role', e.target.value)}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="sf-field">
                    <label>Téléphone</label>
                    <input value={formData.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="+212 6XX XXX XXX" />
                  </div>
                  <div className="sf-field sf-field-wide">
                    <label>Poste</label>
                    <input value={formData.poste} onChange={e => setF('poste', e.target.value)} placeholder="Ex: Responsable stock alimentaire" />
                  </div>
                </div>
                <div className="sf-modal-footer">
                  <button type="button" className="sf-btn sf-btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                  <button type="submit" className="sf-btn sf-btn-primary" disabled={saving}>
                    {saving ? 'Création…' : 'Créer le compte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm && (
          <div className="sf-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="sf-modal sf-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="sf-modal-header">
                <h2>Supprimer le compte</h2>
                <button className="sf-modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
              </div>
              <div className="sf-modal-body">
                <p>Supprimer le compte de <strong>{deleteConfirm.prenom} {deleteConfirm.nom}</strong> ?</p>
                <p className="sf-warn">Cette action est irréversible. Le membre ne pourra plus se connecter.</p>
              </div>
              <div className="sf-modal-footer">
                <button className="sf-btn sf-btn-secondary" onClick={() => setDeleteConfirm(null)}>Annuler</button>
                <button className="sf-btn sf-btn-danger" onClick={deleteUser}>Supprimer</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProfessionalLayout>
  )
}

function RoleBadge({ role }) {
  const map = {
    admin:       ['purple', 'Administrateur'],
    responsable: ['blue',   'Responsable'],
    staff:       ['green',  'Personnel'],
    volunteer:   ['gray',   'Bénévole'],
  }
  const [color, label] = map[role] || ['gray', role]
  return <span className={`sf-badge sf-badge-${color}`}>{label}</span>
}
