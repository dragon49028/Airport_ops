import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aircraftApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge } from '../utils/helpers'
import { DataTable, Modal, SearchInput, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2, GitBranch } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['AVAILABLE','AT_GATE','IN_FLIGHT','MAINTENANCE','OUT_OF_SERVICE']

export default function Aircraft() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()
  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['aircraft'],
    queryFn: () => aircraftApi.getAll().then(r => r.data),
  })

  const filtered = aircraft.filter(a =>
    !search || [a.registrationNumber, a.model, a.airline].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? aircraftApi.update(editing.id, d) : aircraftApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aircraft'] })
      toast.success(editing ? 'Aircraft updated' : 'Aircraft added')
      setModalOpen(false); setEditing(null)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => aircraftApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['aircraft'] }); toast.success('Aircraft removed') },
    onError: () => toast.error('Delete failed'),
  })

  const columns = [
    { key: 'registrationNumber', label: 'Reg No.', render: r => (
      <span className="font-mono font-semibold text-indigo-300">{r.registrationNumber}</span>
    )},
    { key: 'model', label: 'Model' },
    { key: 'airline', label: 'Airline', render: r => r.airline ?? '—' },
    { key: 'capacity', label: 'Cap.', render: r => r.capacity ? `${r.capacity} pax` : '—' },
    { key: 'currentGate', label: 'Gate', render: r => r.currentGate
      ? <span className="font-mono text-sm bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded">{r.currentGate}</span>
      : <span className="text-gray-600">—</span>
    },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    ...(canWrite ? [{
      key: 'actions', label: '', sortable: false,
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
      <PageHeader
        title="Aircraft Fleet"
        subtitle="Track and manage all registered aircraft"
        actions={canWrite && (
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Aircraft
          </button>
        )}
      />
      <div className="card">
        <div className="card-header">
          <SearchInput value={search} onChange={setSearch} placeholder="Search registration, model, airline..." className="max-w-sm" />
        </div>
        <DataTable columns={columns} data={filtered} loading={isLoading} />
      </div>

      <AircraftModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)}
        loading={saveMutation.isPending}
        editing={editing}
      />
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Remove Aircraft" message={`Remove ${deleting?.registrationNumber}?`} danger />
    </div>
  )
}

function AircraftModal({ isOpen, onClose, onSave, loading, editing }) {
  const init = { registrationNumber:'', model:'', airline:'', capacity:'', status:'AVAILABLE', currentGate:'' }
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useState(() => {
    setForm(editing ? {
      registrationNumber: editing.registrationNumber,
      model: editing.model,
      airline: editing.airline ?? '',
      capacity: editing.capacity ?? '',
      status: editing.status,
      currentGate: editing.currentGate ?? '',
    } : init)
  }, [editing])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Aircraft' : 'Add Aircraft'}>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, capacity: form.capacity ? Number(form.capacity) : null }) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Registration No." required>
            <input className="input" value={form.registrationNumber} onChange={e => set('registrationNumber', e.target.value)} placeholder="VT-ANA" required />
          </FormField>
          <FormField label="Model" required>
            <input className="input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Boeing 737-800" required />
          </FormField>
          <FormField label="Airline">
            <input className="input" value={form.airline} onChange={e => set('airline', e.target.value)} placeholder="Air India" />
          </FormField>
          <FormField label="Capacity (pax)">
            <input className="input" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="189" />
          </FormField>
          <FormField label="Status">
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Current Gate">
            <input className="input" value={form.currentGate} onChange={e => set('currentGate', e.target.value)} placeholder="A1" />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : editing ? 'Update' : 'Add Aircraft'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
