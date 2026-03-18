import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ShopPage from './pages/ShopPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import ShopkeeperDashboard from './pages/ShopkeeperDashboard'
import CarbonWallet from './pages/CarbonWallet'
import KhataPage from './pages/KhataPage'
import GroupOrderPage from './pages/GroupOrderPage'
import WhatsAppPage from './pages/WhatsAppPage'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'80px'}}><div className="spinner"/></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user?.role === 'shopkeeper' ? <Navigate to="/dashboard" replace /> : <ShopPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<ProtectedRoute role="customer"><CheckoutPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute role="shopkeeper"><ShopkeeperDashboard /></ProtectedRoute>} />
        <Route path="/perks" element={<ProtectedRoute role="customer"><CarbonWallet /></ProtectedRoute>} />
        <Route path="/khata" element={<ProtectedRoute><KhataPage /></ProtectedRoute>} />
        <Route path="/group-orders" element={<ProtectedRoute role="customer"><GroupOrderPage /></ProtectedRoute>} />
        <Route path="/whatsapp" element={<ProtectedRoute role="customer"><WhatsAppPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
