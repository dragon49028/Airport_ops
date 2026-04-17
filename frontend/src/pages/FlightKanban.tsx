import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flightsApi } from '../services/api'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { FlightSchedule, FlightStatus } from '../types'

import { PageHeader } from '../components/ui'
import { StatusBadge, fmt } from '../utils/helpers'

import { Plane, GripVertical } from 'lucide-react'
import { cn } from '../utils/helpers'
import toast from 'react-hot-toast'

const COLUMNS: { status: FlightStatus; label: string; color: string }[] = [
  { status: 'SCHEDULED', label: 'Scheduled', color: 'border-blue-700/40 bg-blue-900/10' },
  { status: 'BOARDING', label: 'Boarding', color: 'border-purple-700/40 bg-purple-900/10' },
  { status: 'DELAYED', label: 'Delayed', color: 'border-amber-700/40 bg-amber-900/10' },
  { status: 'IN_FLIGHT', label: 'In Flight', color: 'border-sky-700/40 bg-sky-900/10' },
  { status: 'ARRIVED', label: 'Arrived', color: 'border-emerald-700/40 bg-emerald-900/10' },
  { status: 'CANCELLED', label: 'Cancelled', color: 'border-red-700/40 bg-red-900/10' }
]

function FlightCard({
  flight,
  overlay = false
}: {
  flight: FlightSchedule
  overlay?: boolean
}) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: flight.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2 cursor-default',
        overlay && 'shadow-2xl ring-2 ring-indigo-500 rotate-1'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-indigo-300">
          {flight.flightNumber}
        </span>

        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-800 rounded"
        >
          <GripVertical className="w-3.5 h-3.5 text-gray-600" />
        </button>
      </div>

      <div className="text-xs text-gray-400">
        {flight.origin} → {flight.destination}
      </div>

      {flight.airline && (
        <div className="text-xs text-gray-600">
          {flight.airline}
        </div>
      )}

      <div className="flex items-center justify-between text-xs font-mono text-gray-500">
        <span>ARR {fmt.time(flight.scheduledArrival)}</span>
        <span>DEP {fmt.time(flight.scheduledDeparture)}</span>
      </div>

      {flight.delayMinutes > 0 && (
        <div className="text-xs text-amber-400">
          +{flight.delayMinutes}min delay
        </div>
      )}

      {flight.aircraft && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Plane className="w-3 h-3" />
          {flight.aircraft.registrationNumber}
        </div>
      )}
    </div>
  )
}

export default function FlightKanban() {

  const qc = useQueryClient()
  const [activeId, setActiveId] = useState<number | null>(null)

  const { data: flightPage } = useQuery({
    queryKey: ['flights', 'kanban'],
    queryFn: () => flightsApi.getAll({ size: 100 }).then(r => r.data),
    refetchInterval: 30000
  })

  const flights = flightPage?.content ?? []

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: FlightStatus }) =>
      flightsApi.update(id, { status }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['flights'] }),
    onError: () =>
      toast.error('Status update failed')
  })

  const activeFlight =
    activeId ? flights.find(f => f.id === activeId) : null

  const handleDragStart = (e: DragStartEvent) =>
    setActiveId(e.active.id as number)

  const handleDragEnd = (e: DragEndEvent) => {

    const { active, over } = e
    setActiveId(null)

    if (!over) return

    const targetStatus = over.id as FlightStatus

    if (!COLUMNS.find(c => c.status === targetStatus)) return

    const flight = flights.find(f => f.id === active.id)

    if (!flight || flight.status === targetStatus) return

    updateMutation.mutate({
      id: flight.id,
      status: targetStatus
    })

    toast.success(
      `${flight.flightNumber} → ${targetStatus.replace(/_/g,' ')}`
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">

      <PageHeader
        title="Flight Operations Board"
        subtitle="Drag and drop to update flight status"
        actions={<></>}
      />

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">

          {COLUMNS.map(col => {

            const colFlights = flights.filter(
              f => f.status === col.status
            )

            return (
              <div
                key={col.status}
                className={cn(
                  'rounded-xl border p-3 min-h-[200px]',
                  col.color
                )}
              >

                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    {col.label}
                  </h3>

                  <span className="text-xs font-mono bg-gray-800/60 text-gray-400 px-1.5 py-0.5 rounded-full">
                    {colFlights.length}
                  </span>
                </div>

                <SortableContext
                  id={col.status}
                  items={colFlights.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >

                  <div className="space-y-2">
                    {colFlights.map(f => (
                      <FlightCard key={f.id} flight={f} />
                    ))}
                  </div>

                </SortableContext>

              </div>
            )
          })}

        </div>

        <DragOverlay>
          {activeFlight && (
            <FlightCard flight={activeFlight} overlay />
          )}
        </DragOverlay>

      </DndContext>

    </div>
  )
}