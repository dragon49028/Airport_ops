import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gatesApi, flightsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge } from '../utils/helpers'
import { DataTable, Modal, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2, DoorOpen, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Gates() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const { data: gates = [], isLoading } = useQuery({
    queryKey: ['gates'],
    queryFn: () => gatesApi.getAll().then(r => r.data),
    refetchInterval: 20000,
  })
  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: () => flightsApi.getAll().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? gatesApi.update(editing.id, d) : gatesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gates'] }); toast.success('Gate assignment saved'); setModalOpen(false); setEditing(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Conflict detected'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => gatesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gates'] }); toast.success('Assignment removed') },
  })
  const releaseMutation = useMutation({
    mutationFn: (id) => gatesApi.updateStatus(id, 'RELEASED'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['gates'] }); toast.success('Gate released') },
  })

  const columns = [
    { key: 'gateNumber', label: 'Gate', render: r => (
      <span className="font-mono font-bold text-lg text-indigo-300">{r.gateNumber}</span>
    )},
    { key: 'flight', label: 'Flight', render: r => (
      <span className="font-mono text-sm text-gray-300">{r.flightSchedule?.flightNumber ?? '—'}</span>
    )},
    { key: 'assignedTime',  label: 'Assigned', render: r => <span className="font-mono text-xs">{fmt.datetime(r.assignedTime)}</span> },
    { key: 'releaseTime',   label: 'Release',  render: r => <span className="font-mono text-xs">{fmt.datetime(r.releaseTime)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    ...(canWrite ? [{ key: 'actions', label: '', sortable: false,
      render: r => (
        <div className="flex gap-1.5">
          {r.status === 'ACTIVE' && <button onClick={() => releaseMutation.mutate(r.id)} className="btn-success !py-1 !px-2"><CheckCircle className="w-3.5 h-3.5" /></button>}
          <button onClick={() => { setEditing(r); setModalOpen(true) }} className="btn-secondary !py-1 !px-2"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleting(r)} className="btn-danger !py-1 !px-2"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Gate Assignments" subtitle="Manage gate allocations with conflict detection"
        actions={canWrite && <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Assign Gate</button>} />
      <div className="card">
        <DataTable columns={columns} data={gates} loading={isLoading} />
      </div>
      <GateModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} editing={editing} flights={flights} />
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Remove Gate Assignment" message="Remove this gate assignment?" danger />
    </div>
  )
}

const ALL_GATES = ['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5','C6','D1','D2','D3','D4']

function GateModal({ isOpen, onClose, onSave, loading, editing, flights }) {
  const [form, setForm] = useState({ gateNumber:'', flightScheduleId:'', assignedTime:'', releaseTime:'', notes:'' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  useState(() => {
    setForm(editing ? {
      gateNumber: editing.gateNumber,
      flightScheduleId: editing.flightSchedule?.id ?? '',
      assignedTime: fmt.iso(editing.assignedTime),
      releaseTime: fmt.iso(editing.releaseTime),
      notes: editing.notes ?? '',
    } : { gateNumber:'', flightScheduleId:'', assignedTime:'', releaseTime:'', notes:'' })
  }, [editing])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Gate Assignment' : 'Assign Gate'}>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, flightScheduleId: form.flightScheduleId ? Number(form.flightScheduleId) : null }) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Gate Number" required>
            <select className="select" value={form.gateNumber} onChange={e => set('gateNumber', e.target.value)} required>
              <option value="">Select gate</option>
              {ALL_GATES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Flight">
            <select className="select" value={form.flightScheduleId} onChange={e => set('flightScheduleId', e.target.value)}>
              <option value="">— None —</option>
              {flights.map(f => <option key={f.id} value={f.id}>{f.flightNumber} ({f.origin}→{f.destination})</option>)}
            </select>
          </FormField>
          <FormField label="Assigned Time">
            <input className="input" type="datetime-local" value={form.assignedTime} onChange={e => set('assignedTime', e.target.value)} />
          </FormField>
          <FormField label="Release Time">
            <input className="input" type="datetime-local" value={form.releaseTime} onChange={e => set('releaseTime', e.target.value)} />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
        </FormField>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save Assignment'}</button>
        </div>
      </form>
    </Modal>
  )
}
