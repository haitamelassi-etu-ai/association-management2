import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SmoothScrollProvider from './components/SmoothScrollProvider'
import { canAccessPath } from './utils/permissions'

const HomePage = lazy(() => import('./pages/HomePage'))
const DonationPage = lazy(() => import('./pages/DonationPage'))
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'))
const UnifiedLogin = lazy(() => import('./pages/UnifiedLogin'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const StaffManagement = lazy(() => import('./pages/StaffManagement'))
const ActivityLog = lazy(() => import('./pages/ActivityLog'))
const Settings = lazy(() => import('./pages/Settings'))
const AssociationsManagement = lazy(() => import('./pages/AssociationsManagement'))
const BackupSystem = lazy(() => import('./pages/BackupSystem'))
const SiteNews = lazy(() => import('./pages/SiteNews'))
const ProfessionalDashboard = lazy(() => import('./professional/ProfessionalDashboard'))
const Beneficiaries = lazy(() => import('./professional/Beneficiaries'))
const Attendance = lazy(() => import('./professional/Attendance'))
const Announcements = lazy(() => import('./professional/Announcements'))
const Reports = lazy(() => import('./professional/Reports'))
const AnalyticsDashboard = lazy(() => import('./professional/AnalyticsDashboard'))
const BackupManager = lazy(() => import('./components/BackupManager'))
const MealDistribution = lazy(() => import('./components/MealDistribution'))
const AdvancedReports = lazy(() => import('./components/AdvancedReports'))
const MedicationManagement = lazy(() => import('./components/MedicationManagement'))
const PharmacyStock = lazy(() => import('./components/PharmacyStock'))
const ExitTracking = lazy(() => import('./components/ExitTracking'))
const FoodStockManagement = lazy(() => import('./components/FoodStockManagement'))
const TransportManagement = lazy(() => import('./components/TransportManagement'))
const ScheduleCalendar = lazy(() => import('./components/ScheduleCalendar'))
const TicketSystem = lazy(() => import('./components/TicketSystem'))
const DocumentManager = lazy(() => import('./components/DocumentManager'))
const ApprovalWorkflow = lazy(() => import('./components/ApprovalWorkflow'))
const AuditLogViewer = lazy(() => import('./components/AuditLogViewer'))
const TwoFactorSetup = lazy(() => import('./components/TwoFactorSetup'))
const UserSettings = lazy(() => import('./components/UserSettings'))
const VisitorManagement = lazy(() => import('./components/VisitorManagement'))
const VolunteerPortal = lazy(() => import('./components/VolunteerPortal'))
const FinancialTracker = lazy(() => import('./components/FinancialTracker'))
const RoomManagement = lazy(() => import('./components/RoomManagement'))
const HealthRecords = lazy(() => import('./components/HealthRecords'))
const CommunicationHub = lazy(() => import('./components/CommunicationHub'))
const Integrations = lazy(() => import('./components/Integrations'))
const NotificationsCenter = lazy(() => import('./components/NotificationsCenter'))
const ExportReports = lazy(() => import('./components/ExportReports'))
const AdvancedSearch = lazy(() => import('./components/AdvancedSearch'))

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

function RouteFallback() {
  return (
    <div className="dash-loading" aria-live="polite">
      <div className="dash-spinner" />
    </div>
  )
}

function getProfessionalUser() {
  const stored = localStorage.getItem('professionalUser')
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function ProfessionalRoute({ path, children }) {
  const user = getProfessionalUser()
  if (!user) return <Navigate to="/login" replace />
  if (!canAccessPath(user, path)) return <Navigate to="/professional/dashboard" replace />
  return children
}

function AnimatedRoutes({ isAdminLoggedIn, handleLogout }) {
  const location = useLocation()
  const professional = (path, element) => (
    <ProfessionalRoute path={path}>{element}</ProfessionalRoute>
  )

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <Suspense fallback={<RouteFallback />}>
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
        <Route path="/professional/dashboard" element={professional('/professional/dashboard', <ProfessionalDashboard />)} />
        <Route path="/professional/analytics" element={professional('/professional/analytics', <AnalyticsDashboard />)} />
        <Route path="/professional/beneficiaries" element={professional('/professional/beneficiaries', <Beneficiaries />)} />
        <Route path="/professional/attendance" element={professional('/professional/attendance', <Attendance />)} />
        <Route path="/professional/announcements" element={professional('/professional/announcements', <Announcements />)} />
        <Route path="/professional/reports" element={professional('/professional/reports', <Reports />)} />
        <Route path="/professional/backup" element={professional('/professional/backup', <BackupManager />)} />
        <Route path="/professional/meals" element={professional('/professional/meals', <MealDistribution />)} />
        <Route path="/professional/pharmacy" element={professional('/professional/pharmacy', <PharmacyStock />)} />
        <Route path="/professional/medications" element={professional('/professional/medications', <MedicationManagement />)} />
        <Route path="/professional/exit-tracking" element={professional('/professional/exit-tracking', <ExitTracking />)} />
        <Route path="/professional/food-stock" element={professional('/professional/food-stock', <FoodStockManagement />)} />
        <Route path="/professional/transport" element={professional('/professional/transport', <TransportManagement />)} />
        <Route path="/professional/advanced-reports" element={professional('/professional/advanced-reports', <AdvancedReports />)} />
        <Route path="/professional/schedule" element={professional('/professional/schedule', <ScheduleCalendar />)} />
        <Route path="/professional/tickets" element={professional('/professional/tickets', <TicketSystem />)} />
        <Route path="/professional/documents" element={professional('/professional/documents', <DocumentManager />)} />
        <Route path="/professional/approvals" element={professional('/professional/approvals', <ApprovalWorkflow />)} />
        <Route path="/professional/audit-log" element={professional('/professional/audit-log', <AuditLogViewer />)} />
        <Route path="/professional/two-factor" element={professional('/professional/two-factor', <TwoFactorSetup />)} />
        <Route path="/professional/settings" element={professional('/professional/settings', <UserSettings />)} />
        <Route path="/professional/visitors" element={professional('/professional/visitors', <VisitorManagement />)} />
        <Route path="/professional/volunteers" element={professional('/professional/volunteers', <VolunteerPortal />)} />
        <Route path="/professional/financial" element={professional('/professional/financial', <FinancialTracker />)} />
        <Route path="/professional/rooms" element={professional('/professional/rooms', <RoomManagement />)} />
        <Route path="/professional/health-records" element={professional('/professional/health-records', <HealthRecords />)} />
        <Route path="/professional/communications" element={professional('/professional/communications', <CommunicationHub />)} />
        <Route path="/professional/integrations" element={professional('/professional/integrations', <Integrations />)} />
        <Route path="/professional/notifications" element={professional('/professional/notifications', <NotificationsCenter />)} />
        <Route path="/professional/export-reports" element={professional('/professional/export-reports', <ExportReports />)} />
        <Route path="/professional/site-news" element={professional('/professional/site-news', <SiteNews />)} />
        <Route path="/professional/search" element={professional('/professional/search', <AdvancedSearch />)} />
        </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

export default AppRouter
