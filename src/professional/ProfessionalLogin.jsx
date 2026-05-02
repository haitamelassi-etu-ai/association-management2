import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import './ProfessionalLogin.css'
import { SITE_INFO } from '../config/siteInfo'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 15 * 60 * 1000 // 15 minutes

function ProfessionalLogin() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error,     setError]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attempts,  setAttempts]  = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const navigate = useNavigate()

  const isLocked = lockedUntil && Date.now() < lockedUntil

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (isLocked) {
      const mins = Math.ceil((lockedUntil - Date.now()) / 60000)
      setError(`Trop de tentatives. Réessayez dans ${mins} min.`)
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.login(credentials)
      const userData = response.data.data

      localStorage.setItem('professionalUser',  JSON.stringify(userData))
      localStorage.setItem('professionalToken', userData.token)
      localStorage.setItem('userRole', userData?.role === 'admin' ? 'admin' : 'professional')

      setAttempts(0)
      navigate('/professional/dashboard')
    } catch (err) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)

      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS)
        setError('Compte temporairement bloqué après 5 tentatives. Réessayez dans 15 min.')
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts
        const msg = err.response?.data?.message || 'Email ou mot de passe incorrect'
        setError(`${msg} (${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''})`)
      }
      setIsLoading(false)
    }
  }

  return (
    <div className="professional-login-page">
      <div className="login-container-pro">
        <div className="login-header-pro">
          <div className="logo-section">
            <img src="/images/logo.png" alt={`Logo ${SITE_INFO.name}`} className="login-logo" />
            <h1>Portail Professionnel</h1>
          </div>
          <p>{SITE_INFO.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-pro" autoComplete="on">
          {error && <div className="error-message-pro">{error}</div>}

          <div className="form-group-pro">
            <label htmlFor="login-email">Email professionnel</label>
            <input
              id="login-email"
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              placeholder="votre@email.com"
              autoComplete="email"
              required
              disabled={isLoading || isLocked}
            />
          </div>

          <div className="form-group-pro">
            <label htmlFor="login-password">Mot de passe</label>
            <div className="password-wrapper">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isLoading || isLocked}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login-pro" disabled={isLoading || isLocked}>
            {isLoading ? '⏳ Connexion...' : isLocked ? '🔒 Bloqué' : '🔓 Se connecter'}
          </button>

          <div className="login-hint-pro">
            <small>🔒 Accès réservé au personnel autorisé</small>
          </div>
        </form>

        <div className="login-footer-pro">
          <a href="/">← Retour au site public</a>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalLogin
