import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plane, Clock, PlaneTakeoff, Users, DoorOpen, Fuel, Wrench, AlertTriangle, Activity, Radio } from 'lucide-react'
import { PageHeader, Card, StatCard, ErrorMessage, PageLoader } from '../components/ui'
import { WeatherWidget } from '../components/WeatherWidget'
import { dashboardApi, flightsApi, maintenanceApi, gatesApi } from '../services/api'
import { StatusBadge, fmt, cn } from '../utils/helpers'
import type { FlightSchedule, DashboardStats, GateAssignment, MaintenanceClearance } from '../types'

function LiveClock() {
  const [time, setTime] = React.useState(new Date())

  React.useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
      <span className="font-mono text-gray-400">{time.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
      <span className="text-gray-700">IST</span>
    </div>
  )
}

function getFlightGateNumber(flight: FlightSchedule): string {
  const activeAssignment = flight.gateAssignments?.find(g => g.status === 'ACTIVE' || g.status === 'SCHEDULED')
  return activeAssignment?.gateNumber ?? flight.gate?.gateNumber ?? '—'
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats().then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: flightPage } = useQuery({
    queryKey: ['dashboard-flights'],
    queryFn: () => flightsApi.getAll({ size: 20 }).then(r => r.data),
    refetchInterval: 30_000,
  })

  const { data: maintenance } = useQuery({
    queryKey: ['dashboard-maintenance'],
    queryFn: () => maintenanceApi.getAll().then(r => r.data),
  })

  const { data: gates } = useQuery<GateAssignment[]>({
    queryKey: ['dashboard-gates'],
    queryFn: () => gatesApi.getAll().then(r => r.data),
  })

  if (isLoading) return <PageLoader />
  if (error) return <ErrorMessage message="Failed to load dashboard" />

  const flights = Array.isArray(flightPage)
    ? flightPage
    : Array.isArray((flightPage as any)?.content)
      ? (flightPage as any).content
      : []

  const maintenanceList = Array.isArray(maintenance)
    ? maintenance
    : Array.isArray((maintenance as any)?.content)
      ? (maintenance as any).content
      : []

  const activeFlights = flights.filter((f: FlightSchedule) => ['SCHEDULED', 'BOARDING', 'IN_FLIGHT', 'ARRIVED', 'DELAYED'].includes(f.status))
  const criticalAlerts = maintenanceList.filter((m: MaintenanceClearance) => m.severity === 'CRITICAL' && m.clearanceStatus !== 'CLEARED')
  const activeGateNumbers = new Set<string>((gates ?? []).filter(g => g.status === 'ACTIVE' || g.status === 'SCHEDULED').map(g => g.gateNumber))

  const statCards = [
    { label: 'Total Flights', value: stats?.totalFlights, icon: Plane, color: 'indigo' as const, sub: 'all schedules' },
    { label: 'Active Flights', value: stats?.activeFlights, icon: Activity, color: 'sky' as const, sub: 'in motion' },
    { label: 'Delayed', value: stats?.delayedFlights, icon: Clock, color: 'amber' as const, sub: 'needs attention' },
    { label: 'Total Aircraft', value: stats?.totalAircraft, icon: PlaneTakeoff, color: 'purple' as const, sub: 'fleet size' },
    { label: 'Available Aircraft', value: stats?.availableAircraft, icon: PlaneTakeoff, color: 'emerald' as const, sub: 'ready to deploy' },
    { label: 'Occupied Gates', value: stats?.occupiedGates, icon: DoorOpen, color: 'rose' as const, sub: 'current assignments' },
    { label: 'Pending Refuels', value: stats?.pendingRefuels, icon: Fuel, color: 'teal' as const, sub: 'fuel queue' },
    { label: 'Maintenance Open', value: stats?.pendingMaintenance, icon: Wrench, color: 'rose' as const, sub: 'needs clearance' },
    { label: 'Staff Available', value: stats?.availableStaff, icon: Users, color: 'emerald' as const, sub: `of ${stats?.totalStaff ?? 0} total` },
    { label: 'Critical Alerts', value: stats?.criticalAlerts, icon: AlertTriangle, color: 'red' as const, sub: 'blockers' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Operations Center</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time airport ground operations overview</p>
        </div>
        <LiveClock />
      </div>

      <WeatherWidget />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-indigo-400" />
              <h2 className="font-display font-semibold text-white text-sm">Active Flights</h2>
            </div>
            <span className="text-xs text-gray-600">{activeFlights.length} operations</span>
          </div>

          <div className="divide-y divide-gray-800/60">
            {activeFlights.length === 0 ? (
              <p className="text-center text-gray-600 py-10 text-sm">No active flights</p>
            ) : (
              activeFlights.slice(0, 8).map((f: FlightSchedule) => (
                <div key={f.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-800/20 transition-colors">
                  <div className="w-16 font-mono text-xs font-semibold text-indigo-300">{f.flightNumber}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 font-medium truncate">
                      {f.origin} → {f.destination}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                      {f.aircraft?.registrationNumber ?? '—'} · {f.aircraft?.model ?? ''} · Gate {getFlightGateNumber(f)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 hidden sm:block">
                    <div>ARR {fmt.time(f.scheduledArrival)}</div>
                    <div>DEP {fmt.time(f.scheduledDeparture)}</div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              ))
            )}
          </div>
        </div>

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
              criticalAlerts.map((a: MaintenanceClearance) => (
                <div key={a.id} className="p-3 bg-red-900/20 border border-red-800/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs font-mono text-red-300">{a.aircraft?.registrationNumber ?? 'N/A'}</div>
                      <div className="text-xs text-gray-400 line-clamp-2">{a.issueDescription}</div>
                      <StatusBadge status={a.clearanceStatus} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Card>
        <div className="card-header">
          <h2 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-purple-400" />
            Gate Overview
          </h2>
        </div>
        <div className="p-5">
          <GateAvailabilityStrip occupied={activeGateNumbers} />
        </div>
      </Card>
    </div>
  )
}

function GateAvailabilityStrip({ occupied }: { occupied: Set<string> }) {
  const gates = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1', 'D2', 'D3', 'D4']

  return (
    <div className="flex flex-wrap gap-2">
      {gates.map(gate => (
        <div
          key={gate}
          className={cn(
            'flex items-center justify-center w-12 h-10 rounded-lg text-xs font-mono font-semibold border transition-all cursor-default',
            occupied.has(gate)
              ? 'bg-red-900/30 border-red-800/40 text-red-300'
              : 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400'
          )}
        >
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