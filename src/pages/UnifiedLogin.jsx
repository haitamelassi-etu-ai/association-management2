import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import './UnifiedLogin.css'
import { API_URL } from '../utils/api'
import { SITE_INFO } from '../config/siteInfo'

function UnifiedLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.data.success) {
        const user = response.data.data
        localStorage.setItem('professionalUser', JSON.stringify(user))
        localStorage.setItem('professionalToken', user.token)

        const isAdmin = user?.role === 'admin'
        localStorage.setItem('userRole', isAdmin ? 'admin' : 'professional')
        localStorage.setItem('isAdminLoggedIn', isAdmin ? 'true' : 'false')

        const activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]')
        activityLog.unshift({
          id: Date.now().toString(),
          type: 'login',
          user: `${user.nom} ${user.prenom}`,
          description: 'Connexion au portail',
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('activityLog', JSON.stringify(activityLog))

        setLoading(false)
        navigate('/professional/dashboard')
      }
    } catch (err) {
      setLoading(false)
      if (err.code === 'ECONNABORTED') {
        setError("Délai d'attente dépassé. Vérifiez votre connexion.")
      } else if (err.code === 'ERR_NETWORK') {
        setError('Erreur réseau. Le serveur est-il démarré ?')
      } else if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.')
      } else if (err.response?.status === 500) {
        setError('Erreur serveur. Veuillez réessayer dans un instant.')
      } else {
        setError('Erreur de connexion. Vérifiez votre connexion.')
      }
    }
  }

  return (
    <div className="login-page">
      <motion.aside
        className="login-brand"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="login-brand-media" aria-hidden="true">
          <img src="/images/hero-background.jpg" alt="" />
          <div className="login-brand-shade" />
        </div>

        <button
          type="button"
          className="login-back"
          onClick={() => navigate('/')}
          aria-label="Retour à l'accueil"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Accueil</span>
        </button>

        <div className="login-brand-content">
          <motion.img
            className="login-brand-logo"
            src="/images/logo.png"
            alt=""
            initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1], delay: 0.25 }}
          />
          <motion.p
            className="login-brand-name-ar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
          >
            {SITE_INFO.nameAr}
          </motion.p>
          <motion.p
            className="login-brand-name"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
          >
            {SITE_INFO.name}
          </motion.p>
          <motion.p
            className="login-brand-tagline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.7 }}
          >
            {SITE_INFO.tagline}
          </motion.p>
        </div>

        <div className="login-brand-footer">
          <small>{SITE_INFO.location.city}, {SITE_INFO.location.country}</small>
        </div>
      </motion.aside>

      <motion.main
        className="login-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1], delay: 0.15 }}
      >
        <div className="login-card">
          <header className="login-card-head">
            <p className="login-kicker">
              <span className="login-kicker-line" aria-hidden="true" />
              Espace équipe
            </p>
            <h1>Connexion</h1>
            <p className="login-subtitle">
              Accédez au portail professionnel pour gérer l'accueil, le suivi et la coordination.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <label className="login-field">
              <span className="login-field-label">Email</span>
              <span className="login-field-control">
                <span className="login-field-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@association.org"
                  autoComplete="email"
                  required
                />
              </span>
            </label>

            <label className="login-field">
              <span className="login-field-label">Mot de passe</span>
              <span className="login-field-control">
                <span className="login-field-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-field-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </span>
            </label>

            {error && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                role="alert"
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="login-submit"
              disabled={loading}
              whileHover={loading ? undefined : { y: -2 }}
              whileTap={loading ? undefined : { scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              {loading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>

          <footer className="login-card-foot">
            <small>
              Besoin d'aide ? <a href={`mailto:${SITE_INFO.contact.email}`}>{SITE_INFO.contact.email}</a>
            </small>
          </footer>
        </div>
      </motion.main>
    </div>
  )
}

export default UnifiedLogin
