import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flightsApi, aircraftApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge } from '../utils/helpers'
import {
  DataTable, Modal, SearchInput, PageHeader,
  FormField, PageLoader, ErrorMessage, ConfirmDialog
} from '../components/ui'
import { Plus, Edit2, Trash2, Plane } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['SCHEDULED','BOARDING','IN_FLIGHT','ARRIVED','DEPARTED','DELAYED','CANCELLED']

export default function Flights() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()
  const [search, setSearch]         = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [deleting, setDeleting]     = useState(null)

  const { data: flights = [], isLoading, error } = useQuery({
    queryKey: ['flights', search],
    queryFn: () => flightsApi.getAll(search ? { search } : {}).then(r => r.data),
  })
  const { data: aircraft = [] } = useQuery({
    queryKey: ['aircraft'],
    queryFn: () => aircraftApi.getAll().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? flightsApi.update(editing.id, d) : flightsApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flights'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success(editing ? 'Flight updated' : 'Flight created')
      setModalOpen(false); setEditing(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => flightsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flights'] })
      toast.success('Flight deleted')
    },
    onError: () => toast.error('Delete failed'),
  })

  const openEdit = (f) => { setEditing(f); setModalOpen(true) }
  const openNew  = ()  => { setEditing(null); setModalOpen(true) }

  const columns = [
    { key: 'flightNumber', label: 'Flight', render: r => (
      <span className="font-mono text-indigo-300 font-semibold">{r.flightNumber}</span>
    )},
    { key: 'route', label: 'Route', render: r => (
      <span className="text-gray-300">{r.origin} → {r.destination}</span>
    )},
    { key: 'aircraft', label: 'Aircraft', render: r => (
      <span className="font-mono text-xs text-gray-400">{r.aircraft?.registrationNumber ?? '—'}</span>
    )},
    { key: 'scheduledArrival',   label: 'Arrival',    render: r => <span className="font-mono text-xs">{fmt.datetime(r.scheduledArrival)}</span> },
    { key: 'scheduledDeparture', label: 'Departure',  render: r => <span className="font-mono text-xs">{fmt.datetime(r.scheduledDeparture)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    ...(canWrite ? [{
      key: 'actions', label: '', sortable: false,
      render: r => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openEdit(r)} className="btn-secondary !py-1 !px-2">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleting(r)} className="btn-danger !py-1 !px-2">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }] : []),
  ]

  if (error) return <ErrorMessage message="Failed to load flights" />

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Flight Schedules"
        subtitle="Manage all inbound and outbound flights"
        actions={canWrite && (
          <button onClick={openNew} className="btn-primary">
            <Plus className="w-4 h-4" /> New Flight
          </button>
        )}
      />

      <div className="card">
        <div className="card-header">
          <SearchInput value={search} onChange={setSearch} placeholder="Search flight, origin, destination..." className="max-w-sm" />
        </div>
        <DataTable columns={columns} data={flights} loading={isLoading} emptyMessage="No flights found" />
      </div>

      <FlightModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)}
        loading={saveMutation.isPending}
        editing={editing}
        aircraft={aircraft}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Delete Flight"
        message={`Delete flight ${deleting?.flightNumber}? This action cannot be undone.`}
        danger
      />
    </div>
  )
}

function FlightModal({ isOpen, onClose, onSave, loading, editing, aircraft }) {
  const [form, setForm] = useState({})

  useState(() => {
    if (editing) {
      setForm({
        flightNumber:      editing.flightNumber,
        aircraftId:        editing.aircraft?.id ?? '',
        origin:            editing.origin ?? '',
        destination:       editing.destination ?? '',
        scheduledArrival:  fmt.iso(editing.scheduledArrival),
        scheduledDeparture:fmt.iso(editing.scheduledDeparture),
        status:            editing.status,
      })
    } else {
      setForm({ flightNumber:'', aircraftId:'', origin:'', destination:'', scheduledArrival:'', scheduledDeparture:'', status:'SCHEDULED' })
    }
  }, [editing])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      aircraftId: form.aircraftId ? Number(form.aircraftId) : null,
      scheduledArrival:  form.scheduledArrival  || null,
      scheduledDeparture:form.scheduledDeparture || null,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Flight' : 'New Flight'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Flight Number" required>
            <input className="input" value={form.flightNumber ?? ''} onChange={e => set('flightNumber', e.target.value)} placeholder="AI-101" required />
          </FormField>
          <FormField label="Aircraft">
            <select className="select" value={form.aircraftId ?? ''} onChange={e => set('aircraftId', e.target.value)}>
              <option value="">— None —</option>
              {aircraft.map(a => <option key={a.id} value={a.id}>{a.registrationNumber} · {a.model}</option>)}
            </select>
          </FormField>
          <FormField label="Origin" required>
            <input className="input" value={form.origin ?? ''} onChange={e => set('origin', e.target.value)} placeholder="DEL" maxLength={10} required />
          </FormField>
          <FormField label="Destination" required>
            <input className="input" value={form.destination ?? ''} onChange={e => set('destination', e.target.value)} placeholder="BOM" maxLength={10} required />
          </FormField>
          <FormField label="Scheduled Arrival">
            <input className="input" type="datetime-local" value={form.scheduledArrival ?? ''} onChange={e => set('scheduledArrival', e.target.value)} />
          </FormField>
          <FormField label="Scheduled Departure">
            <input className="input" type="datetime-local" value={form.scheduledDeparture ?? ''} onChange={e => set('scheduledDeparture', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Status">
          <select className="select" value={form.status ?? 'SCHEDULED'} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </select>
        </FormField>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : editing ? 'Update Flight' : 'Create Flight'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
