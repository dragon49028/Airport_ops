import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { runwaysApi, flightsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge } from '../utils/helpers'
import { DataTable, Modal, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const RUNWAYS   = ['RWY-09L','RWY-09R','RWY-27L','RWY-27R','RWY-14','RWY-32']
const SLOT_TYPES = ['LANDING','TAKEOFF']
const STATUSES   = ['SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED']

export default function Runways() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['runways'],
    queryFn: () => runwaysApi.getAll().then(r => r.data),
    refetchInterval: 20000,
  })
  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: () => flightsApi.getAll().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? runwaysApi.update(editing.id, d) : runwaysApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['runways'] }); toast.success('Runway slot saved'); setModalOpen(false); setEditing(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Conflict detected — runway already booked'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => runwaysApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['runways'] }); toast.success('Slot removed') },
  })

  const columns = [
    { key: 'runwayNumber', label: 'Runway', render: r => <span className="font-mono font-bold text-indigo-300">{r.runwayNumber}</span> },
    { key: 'slotType', label: 'Type', render: r => (
      <span className={`badge ${r.slotType === 'LANDING' ? 'bg-sky-900/40 text-sky-300 border border-sky-800/40' : 'bg-orange-900/40 text-orange-300 border border-orange-800/40'}`}>
        {r.slotType}
      </span>
    )},
    { key: 'flight', label: 'Flight', render: r => <span className="font-mono text-sm text-gray-300">{r.flightSchedule?.flightNumber ?? '—'}</span> },
    { key: 'slotTime', label: 'Slot Time', render: r => <span className="font-mono text-xs">{fmt.datetime(r.slotTime)}</span> },
    { key: 'duration', label: 'Duration', render: r => <span className="text-gray-400">{r.duration} min</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    ...(canWrite ? [{ key: 'actions', label: '', sortable: false,
      render: r => (
        <div className="flex gap-1.5">
          <button onClick={() => { setEditing(r); setModalOpen(true) }} className="btn-secondary !py-1 !px-2"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleting(r)} className="btn-danger !py-1 !px-2"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Runway Slots" subtitle="Schedule landing and takeoff slots with conflict prevention"
        actions={canWrite && <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Book Slot</button>} />
      <div className="card">
        <DataTable columns={columns} data={slots} loading={isLoading} />
      </div>
      <RunwayModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} editing={editing} flights={flights} />
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Remove Slot" message="Remove this runway slot?" danger />
    </div>
  )
}

function RunwayModal({ isOpen, onClose, onSave, loading, editing, flights }) {
  const init = { runwayNumber:'', flightScheduleId:'', slotTime:'', duration:30, slotType:'LANDING' }
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  useState(() => {
    setForm(editing ? {
      runwayNumber: editing.runwayNumber,
      flightScheduleId: editing.flightSchedule?.id ?? '',
      slotTime: fmt.iso(editing.slotTime),
      duration: editing.duration ?? 30,
      slotType: editing.slotType,
    } : init)
  }, [editing])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Runway Slot' : 'Book Runway Slot'}>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, flightScheduleId: form.flightScheduleId ? Number(form.flightScheduleId) : null, duration: Number(form.duration) }) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Runway" required>
            <select className="select" value={form.runwayNumber} onChange={e => set('runwayNumber', e.target.value)} required>
              <option value="">Select runway</option>
              {RUNWAYS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormField>
          <FormField label="Slot Type">
            <select className="select" value={form.slotType} onChange={e => set('slotType', e.target.value)}>
              {SLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Flight">
            <select className="select" value={form.flightScheduleId} onChange={e => set('flightScheduleId', e.target.value)}>
              <option value="">— None —</option>
              {flights.map(f => <option key={f.id} value={f.id}>{f.flightNumber}</option>)}
            </select>
          </FormField>
          <FormField label="Duration (min)">
            <input className="input" type="number" min="5" max="120" value={form.duration} onChange={e => set('duration', e.target.value)} />
          </FormField>
          <FormField label="Slot Time" required className="col-span-2">
            <input className="input" type="datetime-local" value={form.slotTime} onChange={e => set('slotTime', e.target.value)} required />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Book Slot'}</button>
        </div>
      </form>
    </Modal>
  )
}
