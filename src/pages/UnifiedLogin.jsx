import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './UnifiedLogin.css'
import { API_URL } from '../utils/api'
import { SITE_INFO } from '../config/siteInfo'

function UnifiedLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check Professional/Staff from MongoDB
    try {
      console.log('🔄 Attempting login to:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      }, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        const user = response.data.data
        // Persist token for API calls (admin and professional)
        localStorage.setItem('professionalUser', JSON.stringify(user))
        localStorage.setItem('professionalToken', user.token)

        const isAdmin = user?.role === 'admin'
        localStorage.setItem('userRole', isAdmin ? 'admin' : 'professional')
        localStorage.setItem('isAdminLoggedIn', isAdmin ? 'true' : 'false')
        
        // Log activity
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
        // All users go to professional dashboard — admins can access admin panel from sidebar
        navigate('/professional/dashboard')
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setLoading(false)
      
      if (err.code === 'ECONNABORTED') {
        setError('Délai d\'attente dépassé. Vérifiez votre connexion.')
      } else if (err.code === 'ERR_NETWORK') {
        setError('Erreur réseau. Le serveur est-il démarré?')
      } else if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect')
      } else if (err.response?.status === 500) {
        setError('Erreur serveur. Réessayez dans un moment.')
      } else {
        setError('Erreur de connexion. Vérifiez votre connexion.')
      }
    }
  }

  return (
    <div className="unified-login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-container">
            <div className="logo-badge">
              <div className="logo-emoji">🤝</div>
              <div className="logo-ring"></div>
            </div>
          </div>
          <h1>{SITE_INFO.name}</h1>
          <p className="subtitle">{SITE_INFO.nameAr}</p>
          <p className="tagline">{SITE_INFO.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              required
            />
          </div>

          <div className="form-group">
            <label>🔒 Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Connexion en cours...
              </>
            ) : (
              <>
                🚀 Se connecter
              </>
            )}
          </button>
        </form>

        <div className="login-info">
          <div className="info-box">
            <h3>👑 Administrateur</h3>
            <p>Accès complet au panneau d'administration</p>
          </div>
          <div className="info-box">
            <h3>👨‍💼 Personnel</h3>
            <p>Accès au portail professionnel</p>
          </div>
        </div>

        <div className="back-home">
          <button onClick={() => navigate('/professional/dashboard')} className="btn-home">
            🧭 Aller au portail
          </button>
        </div>
      </div>
    </div>
  )
}

export default UnifiedLogin
