import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProfessionalDashboard from './professional/ProfessionalDashboard'
import ProfessionalLogin from './professional/ProfessionalLogin'
import FoodStockManagement from './components/FoodStockManagement'
import MedicalStockManagement from './components/MedicalStockManagement'
import TransportManagement from './components/TransportManagement'
import StaffManagement from './professional/StaffManagement'
import MyProfile from './professional/MyProfile'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('professionalToken')
  if (!token) return <Navigate to="/professional/login" replace />
  return children
}

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/professional/dashboard" replace />} />

        <Route
          path="/professional/login"
          element={
            localStorage.getItem('professionalToken')
              ? <Navigate to="/professional/dashboard" replace />
              : <ProfessionalLogin />
          }
        />

        <Route path="/professional/dashboard"     element={<ProtectedRoute><ProfessionalDashboard /></ProtectedRoute>} />
        <Route path="/professional/food-stock"    element={<ProtectedRoute><FoodStockManagement /></ProtectedRoute>} />
        <Route path="/professional/medical-stock" element={<ProtectedRoute><MedicalStockManagement /></ProtectedRoute>} />
        <Route path="/professional/transport"     element={<ProtectedRoute><TransportManagement /></ProtectedRoute>} />
        <Route path="/professional/staff"         element={<ProtectedRoute><StaffManagement /></ProtectedRoute>} />
        <Route path="/professional/profile"       element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/professional/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default AppRouter
