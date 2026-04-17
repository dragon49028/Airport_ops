import { useQuery } from '@tanstack/react-query'
import { dashboardApi, flightsApi, maintenanceApi } from '../services/api'
import { StatCard, PageLoader, ErrorMessage } from '../components/ui'
import { StatusBadge, fmt, SEVERITY_COLORS } from '../utils/helpers'
import {
  Plane, GitBranch, DoorOpen, Wind, Fuel,
  Wrench, Users, AlertTriangle, Clock, Activity,
  TrendingUp, Radio
} from 'lucide-react'

function LiveClock() {
  const [time, setTime] = React.useState(new Date())
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
      <span className="font-mono text-gray-400">{time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
      <span className="text-gray-700">IST</span>
    </div>
  )
}

import React from 'react'

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: flights } = useQuery({
    queryKey: ['flights', 'active'],
    queryFn: () => flightsApi.getAll({ active: true }).then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['maintenance', 'critical'],
    queryFn: () => maintenanceApi.getAll().then(r => r.data),
  })

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage message="Failed to load dashboard" />

  const flightsList = Array.isArray(flights)
    ? flights
    : (Array.isArray(flights?.content) ? flights.content : [])

  const alertsList = Array.isArray(alerts)
    ? alerts
    : (Array.isArray(alerts?.content) ? alerts.content : [])

  const criticalAlerts = alertsList.filter(a =>
    a.severity === 'CRITICAL' && a.clearanceStatus !== 'CLEARED'
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Operations Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time airport ground operations overview</p>
        </div>
        <LiveClock />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard label="Total Flights"      value={stats?.totalFlights}      icon={Plane}          color="indigo"  />
        <StatCard label="Active Flights"     value={stats?.activeFlights}     icon={Activity}       color="sky"     />
        <StatCard label="Delayed"            value={stats?.delayedFlights}    icon={Clock}          color="amber"   />
        <StatCard label="Available Aircraft" value={stats?.availableAircraft} icon={GitBranch}      color="emerald" />
        <StatCard label="Occupied Gates"     value={stats?.occupiedGates}     icon={DoorOpen}       color="purple"  />
        <StatCard label="Pending Refuels"    value={stats?.pendingRefuels}    icon={Fuel}           color="teal"    />
        <StatCard label="Maintenance Open"   value={stats?.pendingMaintenance}icon={Wrench}         color="rose"    />
        <StatCard label="Staff Available"    value={stats?.availableStaff}    icon={Users}          color="emerald"
          sub={`of ${stats?.totalStaff} total`} />
        <StatCard label="Critical Alerts"    value={stats?.criticalAlerts}    icon={AlertTriangle}  color="red"     />
        <StatCard label="Total Aircraft"     value={stats?.totalAircraft}     icon={TrendingUp}     color="indigo"  />
      </div>

      {/* Active flights + Critical alerts */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Active Flights */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-indigo-400" />
              <h2 className="font-display font-semibold text-white text-sm">Active Flights</h2>
            </div>
            <span className="text-xs text-gray-600">{flightsList.length} operations</span>
          </div>
          <div className="divide-y divide-gray-800/60">
            {flightsList.length === 0 && (
              <p className="text-center text-gray-600 py-10 text-sm">No active flights</p>
            )}
            {flightsList.slice(0, 8).map(f => (
              <div key={f.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/20 transition-colors">
                <div className="w-16 font-mono text-xs font-semibold text-indigo-300">{f.flightNumber}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-200 font-medium truncate">
                    {f.origin} → {f.destination}
                  </div>
                  <div className="text-xs text-gray-600 font-mono">
                    {f.aircraft?.registrationNumber ?? '—'} · {f.aircraft?.model ?? ''}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-500 hidden sm:block">
                  <div>ARR {fmt.time(f.scheduledArrival)}</div>
                  <div>DEP {fmt.time(f.scheduledDeparture)}</div>
                </div>
                <StatusBadge status={f.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="card">
          <div className="card-header flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="font-display font-semibold text-white text-sm">Critical Alerts</h2>
          </div>
          <div className="p-4 space-y-3">
            {criticalAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-600 text-sm">
                <div className="text-emerald-400 text-2xl mb-2">✓</div>
                All clear — no critical issues
              </div>
            ) : (
              criticalAlerts.map(a => (
                <div key={a.id} className="p-3 bg-red-900/20 border border-red-800/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-red-300">
                        {a.aircraft?.registrationNumber ?? 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.issueDescription}</div>
                      <StatusBadge status={a.clearanceStatus} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gate availability strip */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-purple-400" />
            Gate Overview
          </h2>
        </div>
        <div className="p-5">
          <GateAvailabilityStrip />
        </div>
      </div>
    </div>
  )
}

function GateAvailabilityStrip() {
  const { data: assignments } = useQuery({
    queryKey: ['gates'],
    queryFn: () => import('../services/api').then(m => m.gatesApi.getAll().then(r => r.data)),
  })

  const gates = ['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5','C6','D1','D2','D3','D4']
  const occupied = new Set(
    assignments?.filter(g => g.status === 'ACTIVE').map(g => g.gateNumber) ?? []
  )

  return (
    <div className="flex flex-wrap gap-2">
      {gates.map(gate => (
        <div key={gate} className={`
          flex items-center justify-center w-12 h-10 rounded-lg text-xs font-mono font-semibold
          border transition-all cursor-default
          ${occupied.has(gate)
            ? 'bg-red-900/30 border-red-800/40 text-red-300'
            : 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400'}
        `}>
          {gate}
        </div>
      ))}
      <div className="w-full flex items-center gap-4 mt-2 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-900/40 border border-emerald-800/30 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-900/40 border border-red-800/30 inline-block" />
          Occupied
        </span>
      </div>
    </div>
  )
}
