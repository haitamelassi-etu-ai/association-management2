import { useNavigate } from 'react-router-dom'
import {
  ShieldUser,
  LogOut,
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  ScrollText,
  Settings,
  HardDriveDownload,
  Newspaper
} from 'lucide-react'
import './AdminPanel.css'

function AdminPanel({ onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn')
    onLogout()
  }

  const menuItems = [
    { path: '/professional/dashboard', icon: LayoutDashboard, title: 'Portail professionnel', desc: 'Bénéficiaires, stock, pointage, rapports' },
    { path: '/admin/users', icon: Users, title: 'Gestion des utilisateurs', desc: 'Ajouter, modifier, supprimer des utilisateurs' },
    { path: '/admin/associations', icon: Building2, title: 'Associations', desc: 'Créer et activer les modules' },
    { path: '/admin/staff', icon: UserCog, title: 'Gestion du personnel', desc: 'Équipes, horaires, statuts' },
    { path: '/professional/site-news', icon: Newspaper, title: 'Actualités du site', desc: 'Publier et modifier les annonces de la page d\'accueil' },
    { path: '/admin/activity', icon: ScrollText, title: 'Journal d\'activité', desc: "Consulter l'historique des actions" },
    { path: '/admin/settings', icon: Settings, title: 'Paramètres', desc: 'Configuration système' },
    { path: '/admin/backup', icon: HardDriveDownload, title: 'Sauvegardes', desc: 'Backup et restauration' }
  ]

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-header-title">
            <span className="admin-header-icon" aria-hidden="true">
              <ShieldUser size={22} strokeWidth={2} />
            </span>
            <div>
              <h1>Panneau d'administration</h1>
              <p>Espace administrateur</p>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-logout" type="button">
            <LogOut size={15} strokeWidth={2} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      <div className="admin-menu-grid">
        {menuItems.map(({ path, icon: Icon, title, desc }) => (
          <button key={path} onClick={() => navigate(path)} className="menu-card" type="button">
            <span className="menu-icon" aria-hidden="true"><Icon size={22} strokeWidth={1.9} /></span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel
