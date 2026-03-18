import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function RegisterPage() {
  const { register, login } = useAuth()
  const nav = useNavigate()
  const [role, setRole] = useState('customer')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await register({ ...form, role })
      const user = await login(form.email, form.password)
      nav(user.role === 'shopkeeper' ? '/dashboard' : '/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="auth-brand">
          <span className="auth-logo">🛒</span>
          <h1>OllUR</h1>
        </div>
        <h2>Create account</h2>
        <p className="auth-sub">Join your local store network</p>

        {/* Role toggle */}
        <div className="role-toggle">
          <button
            className={`role-btn ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')} type="button"
          >
            🧑 I'm a Customer
          </button>
          <button
            className={`role-btn ${role === 'shopkeeper' ? 'active' : ''}`}
            onClick={() => setRole('shopkeeper')} type="button"
          >
            🏪 I'm a Shopkeeper
          </button>
        </div>
        {role === 'shopkeeper' && (
          <p className="role-note">
            As a shopkeeper you can add products, manage inventory and handle orders.
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form two-col">
          <div className="field">
            <label>{role === 'shopkeeper' ? 'Store Name' : 'Full Name'}</label>
            <input placeholder={role === 'shopkeeper' ? "Ravi's Kirana" : 'Priya Sharma'}
              value={form.name} onChange={set('name')} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters"
              value={form.password} onChange={set('password')} required minLength={6} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input placeholder="98765 43210" value={form.phone} onChange={set('phone')} />
          </div>
          <div className="field full">
            <label>{role === 'shopkeeper' ? 'Shop Address' : 'Delivery Address'}</label>
            <input placeholder="12 Gandhi Nagar, Hyderabad"
              value={form.address} onChange={set('address')} />
          </div>
          {error && <p className="auth-error full">⚠️ {error}</p>}
          <button type="submit" className="btn btn-primary auth-submit full" disabled={loading}>
            {loading ? 'Creating account...' : `Create ${role === 'shopkeeper' ? 'Shop' : 'Customer'} Account`}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
