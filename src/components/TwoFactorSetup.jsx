import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL, getAuthHeaders } from '../utils/api'
import './TwoFactorSetup.css'

function TwoFactorSetup({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const [step, setStep] = useState('info') // info, setup, verify, backup, done
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/2fa/setup`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setQrCode(data.data.qrCode)
        setSecret(data.data.secret)
        setStep('setup')
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/2fa/verify`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ token: verificationCode })
      })
      const data = await response.json()
      if (data.success) {
        setBackupCodes(data.data.backupCodes)
        setStep('backup')
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError('Erreur de vérification')
    } finally {
      setLoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
  }

  const downloadBackupCodes = () => {
    const content = `Codes de secours - Association Adel Elouerif\n\n${backupCodes.join('\n')}\n\nGardez ces codes en sécurité!`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '2fa-backup-codes.txt'
    a.click()
  }

  const handleDone = () => {
    setStep('done')
    if (onSuccess) onSuccess()
  }

  return (
    <div className="twofa-modal-overlay">
      <div className="twofa-modal">
        {/* Header */}
        <div className="twofa-header">
          <h2>🔐 Authentification à deux facteurs</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Step Progress */}
        <div className="step-progress">
          <div className={`step ${['info', 'setup', 'verify', 'backup', 'done'].indexOf(step) >= 0 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Info</span>
          </div>
          <div className={`step ${['setup', 'verify', 'backup', 'done'].indexOf(step) >= 0 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Config</span>
          </div>
          <div className={`step ${['verify', 'backup', 'done'].indexOf(step) >= 0 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Vérifier</span>
          </div>
          <div className={`step ${['backup', 'done'].indexOf(step) >= 0 ? 'active' : ''}`}>
            <span className="step-number">4</span>
            <span className="step-label">Terminé</span>
          </div>
        </div>

        {/* Content */}
        <div className="twofa-content">
          {/* Info Step */}
          {step === 'info' && (
            <div className="step-content">
              <div className="info-icon">🛡️</div>
              <h3>Protégez votre compte</h3>
              <p>
                L'authentification à deux facteurs (2FA) ajoute une couche de sécurité supplémentaire 
                à votre compte en demandant un code unique à chaque connexion.
              </p>
              <div className="benefits">
                <div className="benefit">
                  <span className="benefit-icon">✅</span>
                  <span>Protection contre le vol de mot de passe</span>
                </div>
                <div className="benefit">
                  <span className="benefit-icon">✅</span>
                  <span>Codes temporaires de 30 secondes</span>
                </div>
                <div className="benefit">
                  <span className="benefit-icon">✅</span>
                  <span>Fonctionne avec Google Authenticator, Authy, etc.</span>
                </div>
              </div>
              <button className="primary-btn" onClick={handleSetup} disabled={loading}>
                {loading ? '⏳ Chargement...' : '🚀 Commencer la configuration'}
              </button>
            </div>
          )}

          {/* Setup Step */}
          {step === 'setup' && (
            <div className="step-content">
              <h3>📱 Scannez le QR Code</h3>
              <p>Utilisez une application d'authentification pour scanner ce code:</p>
              
              {qrCode && (
                <div className="qr-container">
                  <img src={qrCode} alt="QR Code 2FA" />
                </div>
              )}

              <div className="manual-entry">
                <p>Ou entrez cette clé manuellement:</p>
                <div className="secret-key">
                  <code>{secret}</code>
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(secret)}
                  >
                    📋
                  </button>
                </div>
              </div>

              <button className="primary-btn" onClick={() => setStep('verify')}>
                ➡️ J'ai scanné le code
              </button>
            </div>
          )}

          {/* Verify Step */}
          {step === 'verify' && (
            <div className="step-content">
              <h3>🔢 Vérification</h3>
              <p>Entrez le code à 6 chiffres affiché dans votre application:</p>

              <div className="code-input-container">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="code-input"
                  autoFocus
                />
              </div>

              {error && <div className="error-message">❌ {error}</div>}

              <div className="button-group">
                <button className="secondary-btn" onClick={() => setStep('setup')}>
                  ← Retour
                </button>
                <button 
                  className="primary-btn" 
                  onClick={handleVerify}
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? '⏳ Vérification...' : '✅ Vérifier'}
                </button>
              </div>
            </div>
          )}

          {/* Backup Step */}
          {step === 'backup' && (
            <div className="step-content">
              <h3>🔑 Codes de secours</h3>
              <p className="warning">
                ⚠️ Gardez ces codes en lieu sûr! Ils vous permettront de vous connecter 
                si vous perdez l'accès à votre application.
              </p>

              <div className="backup-codes">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    {code}
                  </div>
                ))}
              </div>

              <div className="backup-actions">
                <button className="action-btn" onClick={copyBackupCodes}>
                  📋 Copier
                </button>
                <button className="action-btn" onClick={downloadBackupCodes}>
                  📥 Télécharger
                </button>
              </div>

              <label className="confirm-checkbox">
                <input type="checkbox" id="confirmed" />
                <span>J'ai sauvegardé mes codes de secours</span>
              </label>

              <button className="primary-btn" onClick={handleDone}>
                ✅ Terminer
              </button>
            </div>
          )}

          {/* Done Step */}
          {step === 'done' && (
            <div className="step-content">
              <div className="success-icon">🎉</div>
              <h3>2FA Activé!</h3>
              <p>
                Votre compte est maintenant protégé par l'authentification à deux facteurs.
                À chaque connexion, vous devrez entrer un code depuis votre application.
              </p>
              <button className="primary-btn" onClick={onClose}>
                👍 Compris!
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TwoFactorSetup
