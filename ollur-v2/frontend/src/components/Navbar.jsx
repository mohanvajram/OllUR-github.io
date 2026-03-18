import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const nav = useNavigate()
  const loc = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); nav('/login'); setMenuOpen(false) }
  const isActive = (path) => loc.pathname === path ? 'nav-link active' : 'nav-link'

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-logo">🛒</span>
        <span className="brand-name">OllUR</span>
        <span className="brand-tag">Local Store</span>
      </Link>

      {user && (
        <div className="nav-links">
          {user.role === 'customer' && (
            <>
              <Link to="/" className={isActive('/')}>🏪 Shop</Link>
              <Link to="/whatsapp" className={isActive('/whatsapp')}>📱 Bot</Link>
              <Link to="/group-orders" className={isActive('/group-orders')}>🤝 Group</Link>
              <Link to="/perks" className={isActive('/perks')}>🌱 Perks</Link>
              <Link to="/orders" className={isActive('/orders')}>🧾 Orders</Link>
            </>
          )}
          {user.role === 'shopkeeper' && (
            <>
              <Link to="/dashboard" className={isActive('/dashboard')}>📊 Dashboard</Link>
              <Link to="/orders" className={isActive('/orders')}>📦 Orders</Link>
              <Link to="/khata" className={isActive('/khata')}>🧾 Khata</Link>
            </>
          )}
        </div>
      )}

      <div className="navbar-right">
        {user ? (
          <>
            <span className="nav-greeting">Hi, {user.name.split(' ')[0]}</span>
            <span className={`badge ${user.role === 'shopkeeper' ? 'badge-orange' : 'badge-green'}`} style={{fontSize:11}}>
              {user.role === 'shopkeeper' ? '🏪 Shop' : '🧑 Customer'}
            </span>
            {user.role === 'customer' && (
              <Link to="/checkout" className="cart-btn">
                🛒 {count > 0 && <span className="cart-count">{count}</span>}
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-ghost" style={{padding:'6px 14px',fontSize:13}}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost" style={{padding:'7px 18px',fontSize:14}}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{padding:'7px 18px',fontSize:14}}>Sign up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
