import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Plus,
  X as XIcon,
  Pencil,
  Trash2,
  Newspaper,
  AlertTriangle,
  Loader2,
  Check,
  ImageIcon
} from 'lucide-react'
import { ProfessionalSidebar } from '../professional/SharedSidebar'
import { API_URL } from '../utils/api'
import './AdminPanel.css'
import '../professional/ProfessionalDashboard.css'

function SiteNews() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [news, setNews] = useState([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [newsError, setNewsError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newArticle, setNewArticle] = useState({
    date: '',
    title: '',
    description: '',
    image: '',
    isActive: true
  })

  useEffect(() => {
    const stored = localStorage.getItem('professionalUser')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { setUser(null) }
    }
  }, [])

  const getAuthHeaders = () => {
    const token = localStorage.getItem('professionalToken')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const formatDateFr = (value) => {
    try {
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return ''
    }
  }

  const toDateInputValue = (value) => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const loadNews = async () => {
    setLoadingNews(true)
    setNewsError('')
    try {
      const res = await axios.get(`${API_URL}/news/all`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        timeout: 15000
      })
      setNews(res.data?.data || [])
    } catch (err) {
      console.error('Failed to load news:', err)
      setNewsError('Impossible de charger les actualités. Vérifiez la connexion.')
      setNews([])
    } finally {
      setLoadingNews(false)
    }
  }

  useEffect(() => { loadNews() }, [])

  const fileToCompressedDataUrl = (file, { maxWidth = 1280, maxHeight = 1280, quality = 0.75 } = {}) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'))
      reader.onload = () => {
        const img = new Image()
        img.onerror = () => reject(new Error('Image invalide'))
        img.onload = () => {
          let { width, height } = img
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', quality))
        }
        img.src = reader.result
      }
      reader.readAsDataURL(file)
    })

  const handleDelete = (id) => {
    if (!window.confirm('Supprimer cette actualité ?')) return
    ;(async () => {
      try {
        await axios.delete(`${API_URL}/news/${id}`, {
          headers: { ...getAuthHeaders() },
          timeout: 15000
        })
        await loadNews()
      } catch (err) {
        console.error('Delete failed:', err)
        window.alert('Suppression impossible. Réessayez.')
      }
    })()
  }

  const resetForm = () => {
    setEditingId(null)
    setNewArticle({ date: '', title: '', description: '', image: '', isActive: true })
  }

  const startCreate = () => {
    resetForm()
    setShowAddForm(true)
  }

  const startEdit = (article) => {
    setEditingId(article._id)
    setNewArticle({
      date: toDateInputValue(article.date),
      title: article.title || '',
      description: article.description || '',
      image: article.image || '',
      isActive: typeof article.isActive === 'boolean' ? article.isActive : true
    })
    setShowAddForm(true)
  }

  const handleSubmitArticle = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setNewsError('')
    try {
      const payload = {
        title: newArticle.title,
        description: newArticle.description,
        date: newArticle.date,
        image: newArticle.image,
        isActive: newArticle.isActive
      }
      const config = {
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        timeout: 20000
      }
      if (editingId) {
        await axios.put(`${API_URL}/news/${editingId}`, payload, config)
      } else {
        await axios.post(`${API_URL}/news`, payload, config)
      }
      await loadNews()
      setShowAddForm(false)
      resetForm()
    } catch (err) {
      console.error('Save failed:', err)
      setNewsError('Enregistrement impossible. Vérifiez les champs et réessayez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePickImage = async (file) => {
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      if (dataUrl.length > 3_000_000) {
        window.alert('Image trop grande après compression. Choisissez une image plus petite.')
        return
      }
      setNewArticle((prev) => ({ ...prev, image: dataUrl }))
    } catch (err) {
      console.error(err)
      window.alert("Impossible de traiter l'image.")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn')
    localStorage.removeItem('professionalUser')
    localStorage.removeItem('professionalToken')
    localStorage.removeItem('userRole')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="professional-dashboard">
      <ProfessionalSidebar user={user} onLogout={handleLogout} />

      <main className="dashboard-main">
        <div className="admin-content">
          <div className="admin-section-head">
            <div className="admin-section-head-title">
              <p>Actualités du site</p>
              <h2>Gérer les annonces publiées sur le site public</h2>
            </div>
          </div>

          <div className="admin-actions">
            <button
              onClick={() => (showAddForm ? (setShowAddForm(false), resetForm()) : startCreate())}
              className={`btn-add-news ${showAddForm ? 'is-secondary' : ''}`}
              type="button"
            >
              {showAddForm ? <XIcon size={16} strokeWidth={2.2} /> : <Plus size={16} strokeWidth={2.2} />}
              <span>{showAddForm ? 'Annuler' : 'Ajouter une actualité'}</span>
            </button>
            <div className="stats">
              <span className="stat-badge">
                <Newspaper size={14} strokeWidth={2} />
                {news.length} actualité{news.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {newsError && (
            <div className="error-message">
              <AlertTriangle size={16} strokeWidth={2} />
              <span>{newsError}</span>
            </div>
          )}

          {showAddForm && (
            <div className="add-form-container">
              <h2>{editingId ? 'Modifier une actualité' : 'Ajouter une actualité'}</h2>
              <form onSubmit={handleSubmitArticle} className="add-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={newArticle.date}
                      onChange={(e) => setNewArticle({ ...newArticle, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Image (URL optionnel)</label>
                    <input
                      type="text"
                      value={newArticle.image}
                      onChange={(e) => setNewArticle({ ...newArticle, image: e.target.value })}
                      placeholder="https://... (ou laissez vide si vous téléversez)"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Téléverser une image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handlePickImage(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                    <small>Sur téléphone : vous pouvez choisir depuis la galerie ou l'appareil photo.</small>
                  </div>

                  <div className="form-group">
                    <label className="form-checkbox">
                      <input
                        type="checkbox"
                        checked={!!newArticle.isActive}
                        onChange={(e) => setNewArticle({ ...newArticle, isActive: e.target.checked })}
                      />
                      Publiée sur le site
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    placeholder="Titre de l'actualité"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newArticle.description}
                    onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                    placeholder="Description..."
                    rows="4"
                    required
                  />
                </div>

                {newArticle.image ? (
                  <div className="form-group form-preview">
                    <label>Aperçu</label>
                    <img
                      src={newArticle.image}
                      alt="Aperçu"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                ) : null}

                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} strokeWidth={2.2} className="admin-spinning" />
                      <span>Enregistrement…</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} strokeWidth={2.4} />
                      <span>{editingId ? 'Mettre à jour' : 'Ajouter'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          <div className="news-list">
            <div className="news-list-head">
              <h2>Toutes les actualités</h2>
            </div>
            {loadingNews ? (
              <div className="empty-state">Chargement…</div>
            ) : news.length === 0 ? (
              <div className="empty-state">Aucune actualité pour le moment</div>
            ) : (
              <div className="news-grid-admin">
                {news.map((article) => (
                  <div key={article._id} className="news-item-admin">
                    <div className="news-image-admin">
                      {article.image ? (
                        <img
                          src={article.image}
                          alt={article.title}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <ImageIcon size={32} strokeWidth={1.4} />
                      )}
                    </div>
                    <div className="news-info">
                      <span className="news-date-admin">{formatDateFr(article.date)}</span>
                      <h3>{article.title}</h3>
                      <p>{article.description}</p>
                      <span className={`news-status ${article.isActive ? 'is-published' : 'is-draft'}`}>
                        {article.isActive ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>
                    <div className="news-actions">
                      <button onClick={() => startEdit(article)} className="btn-submit" type="button">
                        <Pencil size={14} strokeWidth={2} />
                        <span>Modifier</span>
                      </button>
                      <button onClick={() => handleDelete(article._id)} className="btn-delete" type="button">
                        <Trash2 size={14} strokeWidth={2} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SiteNews
