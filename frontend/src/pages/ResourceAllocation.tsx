import { useQuery } from '@tanstack/react-query'
import { gatesApi, runwaysApi, flightsApi } from '../services/api'
import type { GateAssignment, RunwaySlot, FlightSchedule } from '../types'
import { PageHeader } from '../components/ui'
import { WeatherWidget } from '../components/WeatherWidget'
import { format, addHours, startOfHour } from 'date-fns'
import { cn } from '../utils/helpers'

const ALL_GATES = ['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5','C6','D1','D2','D3','D4']
const ALL_RUNWAYS = ['RWY-09L','RWY-09R','RWY-27L','RWY-27R','RWY-14','RWY-32']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getOccupancy(assignments: GateAssignment[], gate: string, hour: number): 'occupied' | 'scheduled' | 'free' {
  const slotStart = new Date(); slotStart.setHours(hour, 0, 0, 0)
  const slotEnd   = new Date(); slotEnd.setHours(hour + 1, 0, 0, 0)

  const match = assignments.find(a => {
    if (a.gateNumber !== gate) return false
    const start = a.assignedTime ? new Date(a.assignedTime) : null
    const end   = a.releaseTime  ? new Date(a.releaseTime)  : null
    if (!start || !end) return false
    return start < slotEnd && end > slotStart
  })
  if (!match) return 'free'
  return match.status === 'ACTIVE' ? 'occupied' : 'scheduled'
}

function getRunwayOccupancy(slots: RunwaySlot[], runway: string, hour: number): 'in_progress' | 'scheduled' | 'free' {
  const slotStart = new Date(); slotStart.setHours(hour, 0, 0, 0)
  const slotEnd   = new Date(); slotEnd.setHours(hour + 1, 0, 0, 0)

  const match = slots.find(s => {
    if (s.runwayNumber !== runway) return false
    const t = new Date(s.slotTime)
    const e = new Date(t.getTime() + s.duration * 60000)
    return t < slotEnd && e > slotStart
  })
  if (!match) return 'free'
  return match.status === 'IN_PROGRESS' ? 'in_progress' : 'scheduled'
}

export default function ResourceAllocation() {
  const { data: gates    = [] } = useQuery({ queryKey: ['gates'],   queryFn: () => gatesApi.getAll().then(r => r.data) })
  const { data: runways  = [] } = useQuery({ queryKey: ['runways'], queryFn: () => runwaysApi.getAll().then(r => r.data) })
  const { data: flightPage }    = useQuery({ queryKey: ['flights'], queryFn: () => flightsApi.getAll({ size: 100 }).then(r => r.data) })
  const flights = flightPage?.content ?? []

  const currentHour = new Date().getHours()
  const gateSummary = ALL_GATES.reduce(
    (acc, gate) => {
      const occupancy = getOccupancy(gates as GateAssignment[], gate, currentHour)
      acc[occupancy] += 1
      return acc
    },
    { occupied: 0, scheduled: 0, free: 0 }
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Resource Allocation"
        subtitle="Visual gate & runway utilization heatmap for today"
        actions={<></>}
      />

      <WeatherWidget />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Occupied Now</div>
          <div className="mt-1 text-2xl font-display font-bold text-red-300">{gateSummary.occupied}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Scheduled</div>
          <div className="mt-1 text-2xl font-display font-bold text-emerald-300">{gateSummary.scheduled}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Free</div>
          <div className="mt-1 text-2xl font-display font-bold text-gray-200">{gateSummary.free}</div>
        </div>
      </div>

      {/* Gate Heatmap */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-display font-semibold text-white text-sm">Gate Utilization — Today</h2>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-700/60 inline-block"/><span>Scheduled</span></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-700/60 inline-block"/><span>Occupied</span></span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-800 inline-block"/><span>Free</span></span>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left text-gray-600 font-mono w-16 pb-2">Gate</th>
                {HOURS.map(h => (
                  <th key={h} className={cn(
                    'text-center font-mono pb-2 w-8',
                    h === currentHour ? 'text-indigo-400 font-bold' : 'text-gray-700'
                  )}>
                    {String(h).padStart(2,'0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_GATES.map(gate => (
                <tr key={gate}>
                  <td className="font-mono font-semibold text-gray-400 py-0.5 pr-2">{gate}</td>
                  {HOURS.map(h => {
                    const occ = getOccupancy(gates as GateAssignment[], gate, h)
                    const isCurrent = h === currentHour
                    return (
                      <td key={h} className="py-0.5 px-0.5">
                        <div className={cn(
                          'w-7 h-5 rounded-sm transition-all',
                          occ === 'occupied'  && 'bg-red-700/70',
                          occ === 'scheduled' && 'bg-emerald-700/50',
                          occ === 'free'      && 'bg-gray-800/40',
                          isCurrent           && 'ring-1 ring-indigo-500/60'
                        )} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Runway Heatmap */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-display font-semibold text-white text-sm">Runway Slot Utilization — Today</h2>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-sky-700/60 inline-block"/>Scheduled</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-600/60 inline-block"/>In Progress</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-800 inline-block"/>Free</span>
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className="text-left text-gray-600 font-mono w-24 pb-2">Runway</th>
                {HOURS.map(h => (
                  <th key={h} className={cn(
                    'text-center font-mono pb-2 w-8',
                    h === currentHour ? 'text-indigo-400 font-bold' : 'text-gray-700'
                  )}>
                    {String(h).padStart(2,'0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_RUNWAYS.map(runway => (
                <tr key={runway}>
                  <td className="font-mono font-semibold text-gray-400 py-0.5 pr-2 text-[10px]">{runway}</td>
                  {HOURS.map(h => {
                    const occ = getRunwayOccupancy(runways as RunwaySlot[], runway, h)
                    const isCurrent = h === currentHour
                    return (
                      <td key={h} className="py-0.5 px-0.5">
                        <div className={cn(
                          'w-7 h-5 rounded-sm transition-all',
                          occ === 'in_progress' && 'bg-orange-600/70',
                          occ === 'scheduled'   && 'bg-sky-700/50',
                          occ === 'free'        && 'bg-gray-800/40',
                          isCurrent             && 'ring-1 ring-indigo-500/60'
                        )} />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active flights timeline */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-display font-semibold text-white text-sm">Flight Timeline — Active</h2>
        </div>
        <div className="p-4 space-y-2">
          {flights.filter(f => ['SCHEDULED','BOARDING','ARRIVED','DELAYED'].includes(f.status)).map(f => (
            <FlightTimelineRow key={f.id} flight={f} />
          ))}
          {flights.filter(f => ['SCHEDULED','BOARDING','ARRIVED','DELAYED'].includes(f.status)).length === 0 && (
            <p className="text-center text-gray-600 py-8 text-sm">No active flights</p>
          )}
        </div>
      </div>
    </div>
  )
}

function FlightTimelineRow({ flight }: { flight: FlightSchedule }) {
  const now = new Date()
  const arr = flight.scheduledArrival ? new Date(flight.scheduledArrival) : null
  const dep = flight.scheduledDeparture ? new Date(flight.scheduledDeparture) : null

  const STATUS_COLORS: Record<string, string> = {
    SCHEDULED: 'bg-blue-600/50', BOARDING: 'bg-purple-600/50',
    ARRIVED: 'bg-emerald-600/50', DELAYED: 'bg-amber-600/50',
  }

  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-800/40 last:border-0">
      <div className="w-20 font-mono text-xs font-semibold text-indigo-300">{flight.flightNumber}</div>
      <div className="text-xs text-gray-400 w-24">{flight.origin} → {flight.destination}</div>
      <div className="flex-1 relative h-5 bg-gray-800/50 rounded overflow-hidden">
        {arr && dep && (
          <div
            className={cn('absolute inset-y-0 rounded', STATUS_COLORS[flight.status] || 'bg-gray-600/50')}
            style={{
              left:  `${Math.max(0, (arr.getHours() * 60 + arr.getMinutes()) / (24 * 60) * 100)}%`,
              right: `${Math.max(0, 100 - (dep.getHours() * 60 + dep.getMinutes()) / (24 * 60) * 100)}%`,
            }}
          />
        )}
        {/* Current time marker */}
        <div className="absolute inset-y-0 w-px bg-indigo-500"
          style={{ left: `${(now.getHours() * 60 + now.getMinutes()) / (24*60) * 100}%` }} />
      </div>
      <div className="text-xs text-gray-500 font-mono w-24">
        {arr ? format(arr, 'HH:mm') : '—'} – {dep ? format(dep, 'HH:mm') : '—'}
      </div>
    </div>
  )
}
