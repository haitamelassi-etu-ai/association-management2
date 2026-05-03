import { useState } from 'react'
import { authAPI } from '../services/api'
import ProfessionalLayout from './ProfessionalLayout'
import './MyProfile.css'

export default function MyProfile() {
  const user = JSON.parse(localStorage.getItem('professionalUser') || '{}')

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const submit = async (e) => {
    e.preventDefault()
    setMsg({ type: '', text: '' })

    if (form.newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' })
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'error', text: 'La confirmation ne correspond pas au nouveau mot de passe.' })
      return
    }
    if (form.currentPassword === form.newPassword) {
      setMsg({ type: 'error', text: 'Le nouveau mot de passe doit être différent de l\'actuel.' })
      return
    }

    setLoading(true)
    try {
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      setMsg({ type: 'success', text: '✅ Mot de passe modifié avec succès !' })
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la modification.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProfessionalLayout>
      <div className="profile-page">
        <div className="profile-header">
          <h1>👤 Mon profil</h1>
          <p>Gérer vos informations personnelles et votre sécurité</p>
        </div>

        <div className="profile-grid">

          {/* Carte info utilisateur */}
          <div className="profile-card">
            <div className="profile-card-header">
              <span>📋 Informations</span>
            </div>
            <div className="profile-info">
              <div className="profile-avatar-big">
                {(user.prenom?.[0] || '') + (user.nom?.[0] || '')}
              </div>
              <h2>{user.prenom} {user.nom}</h2>
              <p className="profile-role">{user.role === 'admin' ? '🛡️ Administrateur' : user.role === 'responsable' ? '⭐ Responsable' : '👤 Personnel'}</p>

              <dl className="profile-fields">
                <dt>Email</dt><dd>{user.email}</dd>
                {user.poste && (<><dt>Poste</dt><dd>{user.poste}</dd></>)}
                {user.telephone && (<><dt>Téléphone</dt><dd>{user.telephone}</dd></>)}
              </dl>
            </div>
          </div>

          {/* Carte changement de mot de passe */}
          <div className="profile-card">
            <div className="profile-card-header">
              <span>🔒 Changer mon mot de passe</span>
            </div>
            <form className="profile-form" onSubmit={submit}>
              {msg.text && (
                <div className={`profile-msg profile-msg-${msg.type}`}>{msg.text}</div>
              )}

              <div className="profile-field">
                <label htmlFor="currentPassword">Mot de passe actuel</label>
                <input
                  id="currentPassword"
                  type={showPwd ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  id="newPassword"
                  type={showPwd ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={loading}
                />
                <small>Minimum 6 caractères</small>
              </div>

              <div className="profile-field">
                <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
                <input
                  id="confirmPassword"
                  type={showPwd ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
              </div>

              <label className="profile-show">
                <input
                  type="checkbox"
                  checked={showPwd}
                  onChange={(e) => setShowPwd(e.target.checked)}
                />
                Afficher les mots de passe
              </label>

              <button type="submit" className="profile-btn" disabled={loading}>
                {loading ? '⏳ Modification...' : '🔐 Modifier le mot de passe'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </ProfessionalLayout>
  )
}
