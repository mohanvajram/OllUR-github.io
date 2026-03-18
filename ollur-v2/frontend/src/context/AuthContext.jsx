import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ollur_token')
    const stored = localStorage.getItem('ollur_user')
    if (token && stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('ollur_token', res.data.access_token)
    localStorage.setItem('ollur_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('ollur_token')
    localStorage.removeItem('ollur_user')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
