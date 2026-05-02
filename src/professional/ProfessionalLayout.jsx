import { useNavigate } from 'react-router-dom'
import { ProfessionalSidebar } from './SharedSidebar'
import './ProfessionalDashboard.css'

function ProfessionalLayout({ children, noPadding = false }) {
  const navigate = useNavigate()

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('professionalUser') || '{}') } catch { return {} }
  })()

  const handleLogout = () => {
    localStorage.removeItem('professionalToken')
    localStorage.removeItem('professionalUser')
    localStorage.removeItem('userRole')
    navigate('/professional/login', { replace: true })
  }

  return (
    <div className="professional-dashboard">
      <ProfessionalSidebar user={user} onLogout={handleLogout} />
      <main className={noPadding ? 'dashboard-main dashboard-main--no-padding' : 'dashboard-main'}>
        {children}
      </main>
    </div>
  )
}

export default ProfessionalLayout
