import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPages.css'

export default function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(email, password)
      nav(user.role === 'shopkeeper' ? '/dashboard' : '/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.')
    }
    setLoading(false)
  }

  const fillDemo = (role) => {
    if (role === 'shop') { setEmail('shop@ollur.com'); setPassword('shop123') }
    else { setEmail('customer@ollur.com'); setPassword('cust123') }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">🛒</span>
          <h1>OllUR</h1>
        </div>
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to your account</p>

        <div className="demo-pills">
          <span className="demo-label">Try demo:</span>
          <button className="demo-pill" onClick={() => fillDemo('shop')}>🏪 Shopkeeper</button>
          <button className="demo-pill" onClick={() => fillDemo('customer')}>🧑 Customer</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="auth-error">⚠️ {error}</p>}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          New to OllUR? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  )
}
