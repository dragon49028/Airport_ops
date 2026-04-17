import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { useSse } from './hooks/useSse'
import Layout from './components/Layout'
import { Spinner } from './components/ui'

import Login              from './pages/Login'
import Dashboard          from './pages/Dashboard'
import Flights            from './pages/Flights'
import FlightKanban       from './pages/FlightKanban'
import Aircraft           from './pages/Aircraft'
import Gates              from './pages/Gates'
import Runways            from './pages/Runways'
import Baggage            from './pages/Baggage'
import Refuel             from './pages/Refuel'
import Maintenance        from './pages/Maintenance'
import Staff              from './pages/Staff'
import ResourceAllocation from './pages/ResourceAllocation'
import Reports            from './pages/Reports'

function SseConnector() { useSse(); return null }

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="animate-spin"/>
    </div>
  )
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      {user && <SseConnector />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*" element={
          <AuthGuard>
            <Layout>
              <Routes>
                <Route path="/"              element={<Dashboard />} />
                <Route path="/flights"       element={<Flights />} />
                <Route path="/flights/board" element={<FlightKanban />} />
                <Route path="/aircraft"      element={<Aircraft />} />
                <Route path="/gates"         element={<Gates />} />
                <Route path="/runways"       element={<Runways />} />
                <Route path="/baggage"       element={<Baggage />} />
                <Route path="/refuel"        element={<Refuel />} />
                <Route path="/maintenance"   element={<Maintenance />} />
                <Route path="/staff"         element={<Staff />} />
                <Route path="/resources"     element={<ResourceAllocation />} />
                <Route path="/reports"       element={<Reports />} />
              </Routes>
            </Layout>
          </AuthGuard>
        } />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
