import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token    = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, role: data.role }))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser({ username: data.username, email: data.email, role: data.role })
    return data
  }, [])

  const register = useCallback(async (username, password, email, role) => {
    const { data } = await api.post('/auth/register', { username, password, email, role })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, email: data.email, role: data.role }))
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser({ username: data.username, email: data.email, role: data.role })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const isAdmin    = user?.role === 'ROLE_ADMIN'    || user?.role === 'ADMIN'
  const isStaff    = user?.role === 'ROLE_STAFF'    || user?.role === 'STAFF'
  const isOperator = user?.role === 'ROLE_OPERATOR' || user?.role === 'OPERATOR'
  const canWrite   = isAdmin || isStaff

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isStaff, isOperator, canWrite }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
