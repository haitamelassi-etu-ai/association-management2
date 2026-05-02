import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProfessionalDashboard from './professional/ProfessionalDashboard'
import FoodStockManagement from './components/FoodStockManagement'
import TransportManagement from './components/TransportManagement'

function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/professional/dashboard" />} />
        <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
        <Route path="/professional/food-stock" element={<FoodStockManagement />} />
        <Route path="/professional/transport" element={<TransportManagement />} />
        <Route path="*" element={<Navigate to="/professional/dashboard" />} />
      </Routes>
    </Router>
  )
}

export default AppRouter
