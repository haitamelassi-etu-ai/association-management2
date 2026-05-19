import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SmoothScrollProvider from './components/SmoothScrollProvider'
import HomePage from './pages/HomePage'
import DonationPage from './pages/DonationPage'
import EmergencyPage from './pages/EmergencyPage'
import UnifiedLogin from './pages/UnifiedLogin'
import AdminPanel from './pages/AdminPanel'
import UserManagement from './pages/UserManagement'
import StaffManagement from './pages/StaffManagement'
import ActivityLog from './pages/ActivityLog'
import Settings from './pages/Settings'
import AssociationsManagement from './pages/AssociationsManagement'
import BackupSystem from './pages/BackupSystem'
import ProfessionalDashboard from './professional/ProfessionalDashboard'
import Beneficiaries from './professional/Beneficiaries'
import Attendance from './professional/Attendance'
import Announcements from './professional/Announcements'
import Reports from './professional/Reports'
import AnalyticsDashboard from './professional/AnalyticsDashboard'
import BackupManager from './components/BackupManager'
import MealDistribution from './components/MealDistribution'
import AdvancedReports from './components/AdvancedReports'
import MedicationManagement from './components/MedicationManagement'
import PharmacyStock from './components/PharmacyStock'
import ExitTracking from './components/ExitTracking'
import FoodStockManagement from './components/FoodStockManagement'
import TransportManagement from './components/TransportManagement'
import ScheduleCalendar from './components/ScheduleCalendar'
import TicketSystem from './components/TicketSystem'
import DocumentManager from './components/DocumentManager'
import ApprovalWorkflow from './components/ApprovalWorkflow'
import AuditLogViewer from './components/AuditLogViewer'
import TwoFactorSetup from './components/TwoFactorSetup'
import UserSettings from './components/UserSettings'
import VisitorManagement from './components/VisitorManagement'
import VolunteerPortal from './components/VolunteerPortal'
import FinancialTracker from './components/FinancialTracker'
import RoomManagement from './components/RoomManagement'
import HealthRecords from './components/HealthRecords'
import CommunicationHub from './components/CommunicationHub'
import Integrations from './components/Integrations'
import NotificationsCenter from './components/NotificationsCenter'
import ExportReports from './components/ExportReports'
import AdvancedSearch from './components/AdvancedSearch'

function AppRouter() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)

  useEffect(() => {
    // Check on mount and when storage changes
    const checkAuth = () => {
      const loggedIn = localStorage.getItem('isAdminLoggedIn')
      setIsAdminLoggedIn(loggedIn === 'true')
    }
    
    checkAuth()
    
    // Listen for storage changes
    window.addEventListener('storage', checkAuth)
    
    // Also check periodically (for same-tab changes)
    const interval = setInterval(checkAuth, 500)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      clearInterval(interval)
    }
  }, [])

  const handleLogin = () => {
    setIsAdminLoggedIn(true)
  }

  const handleLogout = () => {
    setIsAdminLoggedIn(false)
    localStorage.removeItem('isAdminLoggedIn')
    localStorage.removeItem('userRole')
  }

  return (
    <Router>
      <SmoothScrollProvider>
        <AnimatedRoutes isAdminLoggedIn={isAdminLoggedIn} handleLogout={handleLogout} />
      </SmoothScrollProvider>
    </Router>
  )
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.22, ease: 'easeIn' } }
}

function AnimatedRoutes({ isAdminLoggedIn, handleLogout }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/don" element={<DonationPage />} />
        <Route path="/urgence" element={<EmergencyPage />} />
        <Route 
          path="/login" 
          element={<UnifiedLogin />} 
        />
        <Route
          path="/professional-login"
          element={<UnifiedLogin />}
        />
        <Route 
          path="/admin" 
          element={
            isAdminLoggedIn ? <AdminPanel onLogout={handleLogout} /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            isAdminLoggedIn ? <UserManagement /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/admin/staff" 
          element={
            isAdminLoggedIn ? <StaffManagement /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/admin/activity" 
          element={
            isAdminLoggedIn ? <ActivityLog /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/admin/associations" 
          element={
            isAdminLoggedIn ? <AssociationsManagement /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            isAdminLoggedIn ? <Settings /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/admin/backup" 
          element={
            isAdminLoggedIn ? <BackupSystem /> : <Navigate to="/login" />
          } 
        />
        <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
        <Route path="/professional/analytics" element={<AnalyticsDashboard />} />
        <Route path="/professional/beneficiaries" element={<Beneficiaries />} />
        <Route path="/professional/attendance" element={<Attendance />} />
        <Route path="/professional/announcements" element={<Announcements />} />
        <Route path="/professional/reports" element={<Reports />} />
        <Route path="/professional/backup" element={<BackupManager />} />
        <Route path="/professional/meals" element={<MealDistribution />} />
        <Route path="/professional/pharmacy" element={<PharmacyStock />} />
        <Route path="/professional/medications" element={<MedicationManagement />} />
        <Route path="/professional/exit-tracking" element={<ExitTracking />} />
        <Route path="/professional/food-stock" element={<FoodStockManagement />} />
        <Route path="/professional/transport" element={<TransportManagement />} />
        <Route path="/professional/advanced-reports" element={<AdvancedReports />} />
        <Route path="/professional/schedule" element={<ScheduleCalendar />} />
        <Route path="/professional/tickets" element={<TicketSystem />} />
        <Route path="/professional/documents" element={<DocumentManager />} />
        <Route path="/professional/approvals" element={<ApprovalWorkflow />} />
        <Route path="/professional/audit-log" element={<AuditLogViewer />} />
        <Route path="/professional/two-factor" element={<TwoFactorSetup />} />
        <Route path="/professional/settings" element={<UserSettings />} />
        <Route path="/professional/visitors" element={<VisitorManagement />} />
        <Route path="/professional/volunteers" element={<VolunteerPortal />} />
        <Route path="/professional/financial" element={<FinancialTracker />} />
        <Route path="/professional/rooms" element={<RoomManagement />} />
        <Route path="/professional/health-records" element={<HealthRecords />} />
        <Route path="/professional/communications" element={<CommunicationHub />} />
        <Route path="/professional/integrations" element={<Integrations />} />
        <Route path="/professional/notifications" element={<NotificationsCenter />} />
        <Route path="/professional/export-reports" element={<ExportReports />} />
        <Route path="/professional/search" element={<AdvancedSearch />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default AppRouter
