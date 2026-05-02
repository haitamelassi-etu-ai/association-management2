import { ProfessionalSidebar } from './SharedSidebar'
import './ProfessionalDashboard.css'

function ProfessionalLayout({ children, noPadding = false }) {
  return (
    <div className="professional-dashboard">
      <ProfessionalSidebar user={{}} onLogout={() => {}} />
      <main className={noPadding ? 'dashboard-main dashboard-main--no-padding' : 'dashboard-main'}>
        {children}
      </main>
    </div>
  )
}

export default ProfessionalLayout
