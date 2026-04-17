import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from "react"

import api from "../services/api"
import toast from "react-hot-toast"

/* ───────────────── Types ───────────────── */

type User = {
  username: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<any>
  register: (
    username: string,
    password: string,
    email: string,
    role: string
  ) => Promise<any>
  logout: () => void
  isAdmin: boolean
  isStaff: boolean
  isOperator: boolean
  canWrite: boolean
}

/* ───────────────── Context ───────────────── */

const AuthContext = createContext<AuthContextType | null>(null)

/* ───────────────── Provider ───────────────── */

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /* ───── Load user from localStorage ───── */

  useEffect(() => {

    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (token && userData) {
      try {

        const parsed: User = JSON.parse(userData)

        setUser(parsed)

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      } catch {
        localStorage.clear()
      }
    }

    setLoading(false)

  }, [])

  /* ───── Login ───── */

  const login = useCallback(async (username: string, password: string) => {

    const { data } = await api.post("/auth/login", { username, password })

    const userData: User = {
      username: data.username,
      email: data.email,
      role: data.role
    }

    localStorage.setItem("token", data.token)
    localStorage.setItem("refreshToken", data.refreshToken)
    localStorage.setItem("user", JSON.stringify(userData))

    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`

    setUser(userData)

    return data

  }, [])

  /* ───── Register ───── */

  const register = useCallback(
    async (username: string, password: string, email: string, role: string) => {

      const { data } = await api.post("/auth/register", {
        username,
        password,
        email,
        role
      })

      const userData: User = {
        username: data.username,
        email: data.email,
        role: data.role
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("refreshToken", data.refreshToken)
      localStorage.setItem("user", JSON.stringify(userData))

      api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`

      setUser(userData)

      return data
    },
    []
  )

  /* ───── Logout ───── */

  const logout = useCallback(() => {

    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")

    delete api.defaults.headers.common["Authorization"]

    setUser(null)

    toast.success("Logged out successfully")

  }, [])

  /* ───── Role helpers ───── */

  const isAdmin =
    user?.role === "ROLE_ADMIN" || user?.role === "ADMIN"

  const isStaff =
    user?.role === "ROLE_STAFF" || user?.role === "STAFF"

  const isOperator =
    user?.role === "ROLE_OPERATOR" || user?.role === "OPERATOR"

  const canWrite = isAdmin || isStaff

  /* ───── Context value ───── */

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isStaff,
    isOperator,
    canWrite
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/* ───────────────── Hook ───────────────── */

export function useAuth() {

  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return ctx
}