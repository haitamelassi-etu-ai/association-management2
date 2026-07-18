import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TwoFactorSetup from './TwoFactorSetup'
import { API_URL, getAuthHeaders } from '../utils/api'
import './UserSettings.css'

function UserSettings() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [show2FASetup, setShow2FASetup] = useState(false)
  
  const [profile, setProfile] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  })
  
  const [preferences, setPreferences] = useState({
    language: 'fr',
    theme: 'light',
    notifications: {
      email: true,
      inApp: true,
      sms: false
    }
  })
  
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    lastLogin: null,
    activeSessions: 1
  })
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setProfile({
          nom: data.data.nom || '',
          prenom: data.data.prenom || '',
          email: data.data.email || '',
          telephone: data.data.telephone || ''
        })
        setPreferences(prev => ({
          ...prev,
          ...data.data.preferences,
          notifications: {
            ...prev.notifications,
            ...(data.data.preferences?.notifications || {})
          }
        }))
        setSecurity(prev => ({
          ...prev,
          twoFactorEnabled: data.data.twoFactorEnabled || false,
          lastLogin: data.data.lastLogin
        }))
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(profile)
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès' })
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de mise à jour' })
    }
    setLoading(false)
  }

  const handlePreferencesUpdate = async () => {
    setLoading(true)
    try {
      await fetch(`${API_URL}/users/preferences`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(preferences)
      })
      
      // Apply theme
      document.documentElement.setAttribute('data-theme', preferences.theme)
      
      // Apply language
      i18n.changeLanguage(preferences.language)
      
      setMessage({ type: 'success', text: 'Préférences sauvegardées' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de sauvegarde' })
    }
    setLoading(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' })
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Mot de passe changé avec succès' })
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du changement' })
    }
    setLoading(false)
  }

  const handleDisable2FA = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver la 2FA?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/2fa/disable`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setSecurity(prev => ({ ...prev, twoFactorEnabled: false }))
        setMessage({ type: 'success', text: '2FA désactivée' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur' })
    }
    setLoading(false)
  }

  return (
    <div className="user-settings">
      {/* Sidebar */}
      <div className="settings-sidebar">
        <h2>⚙️ Paramètres</h2>
        <nav className="settings-nav">
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            <span className="nav-icon">👤</span>
            <span>Profil</span>
          </button>
          <button 
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            <span className="nav-icon">🔒</span>
            <span>Sécurité</span>
          </button>
          <button 
            className={activeTab === 'preferences' ? 'active' : ''}
            onClick={() => setActiveTab('preferences')}
          >
            <span className="nav-icon">🎨</span>
            <span>Préférences</span>
          </button>
          <button 
            className={activeTab === 'notifications' ? 'active' : ''}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span>Notifications</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="settings-content">
        {/* Message */}
        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h3>👤 Informations du profil</h3>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={profile.nom}
                  onChange={e => setProfile(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Votre nom"
                />
              </div>
              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={profile.prenom}
                  onChange={e => setProfile(prev => ({ ...prev, prenom: e.target.value }))}
                  placeholder="Votre prénom"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  value={profile.telephone}
                  onChange={e => setProfile(prev => ({ ...prev, telephone: e.target.value }))}
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
              </button>
            </form>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h3>🔒 Sécurité du compte</h3>
            
            {/* 2FA */}
            <div className="security-card">
              <div className="security-info">
                <span className="security-icon">🔐</span>
                <div>
                  <h4>Authentification à deux facteurs</h4>
                  <p>Ajoutez une couche de sécurité supplémentaire</p>
                </div>
              </div>
              <div className="security-action">
                {security.twoFactorEnabled ? (
                  <>
                    <span className="status-badge enabled">✅ Activée</span>
                    <button className="danger-btn" onClick={handleDisable2FA}>
                      Désactiver
                    </button>
                  </>
                ) : (
                  <button className="primary-btn" onClick={() => setShow2FASetup(true)}>
                    Activer la 2FA
                  </button>
                )}
              </div>
            </div>
            
            {/* Password Change */}
            <div className="password-section">
              <h4>🔑 Changer le mot de passe</h4>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label>Mot de passe actuel</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="form-group">
                  <label>Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? '⏳' : '🔑'} Changer le mot de passe
                </button>
              </form>
            </div>
            
            {/* Session Info */}
            <div className="session-info">
              <h4>📱 Sessions actives</h4>
              <p>Dernière connexion: {security.lastLogin ? new Date(security.lastLogin).toLocaleString('fr-FR') : 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="settings-section">
            <h3>🎨 Préférences d'affichage</h3>
            
            <div className="form-group">
              <label>🌐 Langue</label>
              <select
                value={preferences.language}
                onChange={e => setPreferences(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>🎨 Thème</label>
              <div className="theme-options">
                <button 
                  className={`theme-btn ${preferences.theme === 'light' ? 'active' : ''}`}
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'light' }))}
                >
                  ☀️ Clair
                </button>
                <button 
                  className={`theme-btn ${preferences.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'dark' }))}
                >
                  🌙 Sombre
                </button>
                <button 
                  className={`theme-btn ${preferences.theme === 'auto' ? 'active' : ''}`}
                  onClick={() => setPreferences(prev => ({ ...prev, theme: 'auto' }))}
                >
                  🔄 Auto
                </button>
              </div>
            </div>
            
            <button className="save-btn" onClick={handlePreferencesUpdate} disabled={loading}>
              {loading ? '⏳ Enregistrement...' : '💾 Sauvegarder les préférences'}
            </button>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h3>🔔 Préférences de notifications</h3>
            
            <div className="notification-options">
              <label className="switch-label">
                <span>📧 Notifications par email</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications?.email}
                  onChange={e => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                />
                <span className="switch"></span>
              </label>
              
              <label className="switch-label">
                <span>🔔 Notifications in-app</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications?.inApp}
                  onChange={e => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, inApp: e.target.checked }
                  }))}
                />
                <span className="switch"></span>
              </label>
              
              <label className="switch-label">
                <span>📱 Notifications SMS</span>
                <input
                  type="checkbox"
                  checked={preferences.notifications?.sms}
                  onChange={e => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: e.target.checked }
                  }))}
                />
                <span className="switch"></span>
              </label>
            </div>
            
            <button className="save-btn" onClick={handlePreferencesUpdate} disabled={loading}>
              {loading ? '⏳ Enregistrement...' : '💾 Sauvegarder'}
            </button>
          </div>
        )}
      </div>

      {/* 2FA Setup Modal */}
      {show2FASetup && (
        <TwoFactorSetup 
          onClose={() => setShow2FASetup(false)}
          onSuccess={() => {
            setSecurity(prev => ({ ...prev, twoFactorEnabled: true }))
            setShow2FASetup(false)
          }}
        />
      )}
    </div>
  )
}

export default UserSettings
