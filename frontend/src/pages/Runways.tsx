import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { runwaysApi, flightsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useConflictCheck } from '../hooks/useConflictCheck'
import { fmt, StatusBadge } from '../utils/helpers'
import { runwaySchema, type RunwayInput } from '../utils/schemas'
import type { RunwaySlot, FlightSchedule } from '../types'
import { DataTable, Modal, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { ConflictAlert } from '../components/ConflictAlert'
import { WeatherWidget } from '../components/WeatherWidget'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const RUNWAYS = ['RWY-09L','RWY-09R','RWY-27L','RWY-27R','RWY-14','RWY-32']
const SLOT_TYPES = ['LANDING','TAKEOFF'] as const
const WEATHER = ['CLEAR','CLOUDY','RAIN','FOG','STORM','CROSSWIND'] as const

export default function Runways() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RunwaySlot | null>(null)
  const [deleting, setDeleting] = useState<RunwaySlot | null>(null)

  const { data: slots = [], isLoading } = useQuery<RunwaySlot[]>({
    queryKey: ['runways'],
    queryFn: () => runwaysApi.getAll().then(r => r.data as RunwaySlot[]),
    refetchInterval: 20000
  })

  const { data: flightPage } = useQuery({
    queryKey: ['flights'],
    queryFn: () => flightsApi.getAll({ size: 100 }).then(r => r.data)
  })

  const flights = flightPage?.content ?? []

  const saveMutation = useMutation({
    mutationFn: (d: RunwayInput) =>
      editing ? runwaysApi.update(editing.id, d) : runwaysApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runways'] })
      toast.success('Slot saved')
      setModalOpen(false)
      setEditing(null)
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Conflict detected')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => runwaysApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['runways'] })
      toast.success('Slot removed')
    }
  })

  const WEATHER_BADGE: Record<string,string> = {
    CLEAR:'text-yellow-400',
    CLOUDY:'text-gray-400',
    RAIN:'text-blue-400',
    FOG:'text-gray-500',
    STORM:'text-red-400',
    CROSSWIND:'text-amber-400'
  }

  const columns = [
    {
      key:'runwayNumber',
      label:'Runway',
      render:(r:RunwaySlot)=>
        <span className="font-mono font-bold text-indigo-300">{r.runwayNumber}</span>
    },
    {
      key:'slotType',
      label:'Type',
      render:(r:RunwaySlot)=>(
        <span className={`badge ${
          r.slotType==='LANDING'
            ? 'bg-sky-900/40 text-sky-300 border border-sky-800/40'
            : 'bg-orange-900/40 text-orange-300 border border-orange-800/40'
        }`}>
          {r.slotType}
        </span>
      )
    },
    {
      key:'flight',
      label:'Flight',
      render:(r:RunwaySlot)=>
        <span className="font-mono text-sm text-gray-300">
          {r.flightSchedule?.flightNumber ?? '—'}
        </span>
    },
    {
      key:'slotTime',
      label:'Slot Time',
      render:(r:RunwaySlot)=>
        <span className="font-mono text-xs">{fmt.datetime(r.slotTime)}</span>
    },
    {
      key:'duration',
      label:'Dur.',
      render:(r:RunwaySlot)=>
        <span className="text-gray-400 text-xs">{r.duration}m</span>
    },
    {
      key:'weatherCondition',
      label:'Weather',
      render:(r:RunwaySlot)=>(
        <span className={`text-xs font-semibold ${
          WEATHER_BADGE[r.weatherCondition] ?? 'text-gray-400'
        }`}>
          {r.weatherCondition}
        </span>
      )
    },
    {
      key:'status',
      label:'Status',
      render:(r:RunwaySlot)=><StatusBadge status={r.status}/>
    }
  ]

  if (canWrite) {
    columns.push({
      key:'actions',
      label:'',
      sortable:false,
      render:(r:RunwaySlot)=>(
        <div className="flex gap-1.5">
          <button
            onClick={()=>{setEditing(r);setModalOpen(true)}}
            className="btn-secondary !py-1 !px-2"
          >
            <Edit2 className="w-3.5 h-3.5"/>
          </button>

          <button
            onClick={()=>setDeleting(r)}
            className="btn-danger !py-1 !px-2"
          >
            <Trash2 className="w-3.5 h-3.5"/>
          </button>
        </div>
      )
    } as any)
  }

  return (
    <div className="space-y-5 animate-fade-in">

      <PageHeader
        title="Runway Slots"
        subtitle="Schedule landing and takeoff slots with weather awareness"
        actions={
          canWrite && (
            <button
              onClick={()=>{setEditing(null);setModalOpen(true)}}
              className="btn-primary"
            >
              <Plus className="w-4 h-4"/> Book Slot
            </button>
          )
        }
      />

      <WeatherWidget/>

      <div className="card">
        <DataTable columns={columns} data={slots} loading={isLoading}/>
      </div>

      <RunwayModal
        isOpen={modalOpen}
        onClose={()=>{setModalOpen(false);setEditing(null)}}
        onSave={(d)=>saveMutation.mutate(d)}
        loading={saveMutation.isPending}
        editing={editing}
        flights={flights}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={()=>setDeleting(null)}
        onConfirm={()=>{
          if(deleting){
            deleteMutation.mutate(deleting.id)
            setDeleting(null)
          }
        }}
        title="Remove Slot"
        message="Remove this runway slot?"
        danger
      />

    </div>
  )
}

function RunwayModal({
  isOpen,
  onClose,
  onSave,
  loading,
  editing,
  flights
}:{
  isOpen:boolean
  onClose:()=>void
  onSave:(d:RunwayInput)=>void
  loading:boolean
  editing:RunwaySlot|null
  flights:FlightSchedule[]
}){

  const { checking,result,checkRunway,clear } = useConflictCheck()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState:{errors}
  } = useForm<RunwayInput>({
    resolver:zodResolver(runwaySchema),
    defaultValues:{
      duration:30,
      slotType:'LANDING',
      weatherCondition:'CLEAR'
    }
  })

  const watchedRunway = watch('runwayNumber')
  const watchedSlotTime = watch('slotTime')
  const watchedDuration = watch('duration')

  const handleConflictCheck = () => {
    if (watchedRunway && watchedSlotTime) {
      checkRunway(
        watchedRunway,
        watchedSlotTime,
        watchedDuration ?? 30,
        editing?.id
      )
    }
  }

  useEffect(()=>{
    clear()

    if(editing){
      reset({
        runwayNumber:editing.runwayNumber,
        flightScheduleId:editing.flightSchedule?.id ?? '',
        slotTime:fmt.iso(editing.slotTime),
        duration:editing.duration,
        slotType:editing.slotType,
        weatherCondition:editing.weatherCondition
      })
    }else{
      reset({
        duration:30,
        slotType:'LANDING',
        weatherCondition:'CLEAR'
      })
    }

  },[editing,isOpen,reset,clear])

  return(
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing?'Edit Runway Slot':'Book Runway Slot'}
      size="lg"
    >

      <form onSubmit={handleSubmit(onSave)} className="space-y-4">

        <div className="grid grid-cols-2 gap-4">

          <FormField label="Runway" required error={errors.runwayNumber?.message}>
            <select
              className="select"
              {...register('runwayNumber')}
              onChange={e=>{
                register('runwayNumber').onChange(e)
                clear()
              }}
            >
              <option value="">Select runway</option>
              {RUNWAYS.map(r=>(
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Slot Type" error={errors.slotType?.message}>
            <select className="select" {...register('slotType')}>
              {SLOT_TYPES.map(t=>(
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Flight">
            <select className="select" {...register('flightScheduleId')}>
              <option value="">— None —</option>
              {flights.map(f=>(
                <option key={f.id} value={f.id}>
                  {f.flightNumber}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Duration (min)" error={errors.duration?.message}>
            <input
              className="input"
              type="number"
              min="5"
              max="120"
              {...register('duration')}
            />
          </FormField>

          <div className="col-span-2">
            <FormField
              label="Slot Time"
              required
              error={errors.slotTime?.message}
            >
              <input
                className="input"
                type="datetime-local"
                {...register('slotTime')}
                onBlur={handleConflictCheck}
              />
            </FormField>
          </div>

          <FormField label="Weather Condition" error={errors.weatherCondition?.message}>
            <select className="select" {...register('weatherCondition')}>
              {WEATHER.map(w=>(
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </FormField>

        </div>

        <ConflictAlert
          result={result}
          checking={checking}
          onSelectResource={(rwy)=>setValue('runwayNumber',rwy)}
          onSelectTime={(t)=>setValue('slotTime',fmt.iso(t))}
        />

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConflictCheck}
            className="btn-secondary"
            disabled={checking}
          >
            Check Conflicts
          </button>

          <button
            type="submit"
            disabled={loading || (result?.hasConflict ?? false)}
            className="btn-primary"
          >
            {loading ? 'Saving…' : 'Book Slot'}
          </button>
        </div>

      </form>
    </Modal>
  )
}