import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { refuelApi, flightsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge } from '../utils/helpers'
import { DataTable, Modal, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FUEL_TYPES = ['JET_A1','AVGAS_100LL','JET_B']

export default function Refuel() {

  const qc = useQueryClient()
  const { canWrite } = useAuth()

  const [modalOpen,setModalOpen] = useState(false)
  const [editing,setEditing] = useState<any>(null)
  const [deleting,setDeleting] = useState<any>(null)

  const { data: requestsData, isLoading } = useQuery({
    queryKey:['refuel'],
    queryFn:() => refuelApi.getAll().then(r=>r.data)
  })

  const { data: flightsData } = useQuery({
    queryKey:['flights'],
    queryFn:() => flightsApi.getAll().then(r=>r.data)
  })

  const requests = Array.isArray(requestsData)
    ? requestsData
    : (Array.isArray((requestsData as any)?.content) ? (requestsData as any).content : [])

  const flights = Array.isArray(flightsData)
    ? flightsData
    : (Array.isArray((flightsData as any)?.content) ? (flightsData as any).content : [])

  const saveMutation = useMutation({
    mutationFn:(d:any)=> editing ? refuelApi.update(editing.id,d) : refuelApi.create(d),
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['refuel']})
      toast.success('Refuel request saved')
      setModalOpen(false)
      setEditing(null)
    },
    onError:(e:any)=>toast.error(e?.response?.data?.message || 'Save failed')
  })

const statusMutation = useMutation({
  mutationFn:({id,status}:{id:number,status:'PENDING'|'IN_PROGRESS'|'COMPLETED'}) => refuelApi.updateStatus(id,status),
  onSuccess:()=>{
    qc.invalidateQueries({queryKey:['refuel']})
    toast.success('Status updated')
  }
})

  const deleteMutation = useMutation({
    mutationFn:(id:number)=>refuelApi.delete(id),
    onSuccess:()=>{
      qc.invalidateQueries({queryKey:['refuel']})
      toast.success('Request removed')
    }
  })

  const columns = [
    {
      key:'flight',
      label:'Flight',
      render:(r:any)=>(
        <span className="font-mono text-indigo-300 font-semibold">
          {r.flightSchedule?.flightNumber ?? '—'}
        </span>
      )
    },
    {
      key:'fuelQuantity',
      label:'Quantity',
      render:(r:any)=>(
        <span className="font-semibold text-white">
          {Number(r.fuelQuantity).toLocaleString()} L
        </span>
      )
    },
    {
      key:'fuelType',
      label:'Fuel Type',
      render:(r:any)=>(
        <span className="font-mono text-xs text-amber-300">
          {r.fuelType}
        </span>
      )
    },
    {
      key:'requestedTime',
      label:'Requested',
      render:(r:any)=>(
        <span className="font-mono text-xs">
          {fmt.datetime(r.requestedTime)}
        </span>
      )
    },
    {
      key:'assignedCrew',
      label:'Crew',
      render:(r:any)=>(
        r.assignedCrew ?? <span className="text-gray-600">Unassigned</span>
      )
    },
    {
      key:'status',
      label:'Status',
      render:(r:any)=><StatusBadge status={r.status}/>
    },
    ...(canWrite ? [{
      key:'actions',
      label:'',
      sortable:false,
      render:(r:any)=>(
        <div className="flex gap-1.5">

          {r.status==='PENDING' && (
            <button
              onClick={()=>statusMutation.mutate({id:r.id,status:'IN_PROGRESS'})}
              className="btn-secondary !py-1 !px-2 text-xs"
            >
              Start
            </button>
          )}

          {r.status==='IN_PROGRESS' && (
            <button
              onClick={()=>statusMutation.mutate({id:r.id,status:'COMPLETED'})}
              className="btn-success !py-1 !px-2 text-xs"
            >
              Complete
            </button>
          )}

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
    }] : [])
  ]

  return(
    <div className="space-y-5 animate-fade-in">

      <PageHeader
        title="Refueling Operations"
        subtitle="Manage aircraft refueling requests and crew assignments"
        actions={
          canWrite && (
            <button
              onClick={()=>{setEditing(null);setModalOpen(true)}}
              className="btn-primary"
            >
              <Plus className="w-4 h-4"/> New Request
            </button>
          )
        }
      />

      <div className="card">
        <DataTable columns={columns} data={requests} loading={isLoading}/>
      </div>

      <RefuelModal
        isOpen={modalOpen}
        onClose={()=>{setModalOpen(false);setEditing(null)}}
        onSave={(d:any)=>saveMutation.mutate(d)}
        loading={saveMutation.isPending}
        editing={editing}
        flights={flights}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={()=>setDeleting(null)}
        onConfirm={()=>{
          deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        title="Remove Request"
        message="Remove this refuel request?"
        danger
      />

    </div>
  )
}

function RefuelModal({
  isOpen,
  onClose,
  onSave,
  loading,
  editing,
  flights
}:any){

  const now = new Date()
  now.setSeconds(0,0)

  const isoNow = now.toISOString().slice(0,16)

  const init = {
    flightScheduleId:'',
    fuelQuantity:'',
    fuelType:'JET_A1',
    requestedTime:isoNow,
    assignedCrew:''
  }

  const [form,setForm] = useState<any>(init)

  const set=(k:string,v:any)=>setForm((p:any)=>({...p,[k]:v}))

  useEffect(()=>{
    if(editing){
      setForm({
        flightScheduleId: editing.flightSchedule?.id ?? '',
        fuelQuantity: editing.fuelQuantity ?? '',
        fuelType: editing.fuelType ?? 'JET_A1',
        requestedTime: fmt.iso(editing.requestedTime),
        assignedCrew: editing.assignedCrew ?? ''
      })
    }else{
      setForm(init)
    }
  },[editing])

  return(
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing?'Edit Refuel Request':'New Refuel Request'}
    >

      <form
        onSubmit={(e)=>{
          e.preventDefault()
          onSave({
            ...form,
            flightScheduleId: form.flightScheduleId
              ? Number(form.flightScheduleId)
              : null
          })
        }}
        className="space-y-4"
      >

        <div className="grid grid-cols-2 gap-4">

          <FormField label="Flight" required>
            <select
              className="select"
              value={form.flightScheduleId}
              onChange={e=>set('flightScheduleId',e.target.value)}
              required
            >
              <option value="">Select flight</option>
              {flights.map((f:any)=>(
                <option key={f.id} value={f.id}>
                  {f.flightNumber}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fuel Quantity (L)" required>
            <input
              className="input"
              type="number"
              min="1"
              value={form.fuelQuantity}
              onChange={e=>set('fuelQuantity',e.target.value)}
              placeholder="15000"
              required
            />
          </FormField>

          <FormField label="Fuel Type">
            <select
              className="select"
              value={form.fuelType}
              onChange={e=>set('fuelType',e.target.value)}
            >
              {FUEL_TYPES.map(t=>(
                <option key={t} value={t}>
                  {t.replace(/_/g,' ')}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Requested Time">
            <input
              className="input"
              type="datetime-local"
              value={form.requestedTime}
              onChange={e=>set('requestedTime',e.target.value)}
            />
          </FormField>

          <FormField label="Assigned Crew">
            <input
              className="input"
              value={form.assignedCrew}
              onChange={e=>set('assignedCrew',e.target.value)}
              placeholder="Crew R1"
            />
          </FormField>

        </div>

        <div className="flex gap-3 justify-end pt-2">

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving…' : 'Save Request'}
          </button>

        </div>

      </form>

    </Modal>
  )
}