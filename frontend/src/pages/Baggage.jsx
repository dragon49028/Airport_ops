import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { baggageApi, flightsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge, PRIORITY_COLORS } from '../utils/helpers'
import { DataTable, Modal, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const PRIORITIES = ['NORMAL','HIGH','URGENT']
const STATUSES   = ['PENDING','IN_PROGRESS','DELIVERED','ISSUE']

export default function Baggage() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)

  const { data: manifests = [], isLoading } = useQuery({
    queryKey: ['baggage'],
    queryFn: () => baggageApi.getAll().then(r => r.data),
  })
  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: () => flightsApi.getAll().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? baggageApi.update(editing.id, d) : baggageApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['baggage'] }); toast.success('Manifest saved'); setModalOpen(false); setEditing(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => baggageApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['baggage'] }); toast.success('Status updated') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => baggageApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['baggage'] }); toast.success('Manifest removed') },
  })

  const columns = [
    { key: 'flight', label: 'Flight', render: r => <span className="font-mono text-indigo-300 font-semibold">{r.flightSchedule?.flightNumber ?? '—'}</span> },
    { key: 'baggageCount', label: 'Bags', render: r => <span className="text-white font-semibold">{r.baggageCount}</span> },
    { key: 'priorityLevel', label: 'Priority', render: r => (
      <span className={`font-semibold text-sm ${PRIORITY_COLORS[r.priorityLevel]}`}>{r.priorityLevel}</span>
    )},
    { key: 'handlingTeam', label: 'Team', render: r => r.handlingTeam ?? <span className="text-gray-600">Unassigned</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'updatedAt', label: 'Updated', render: r => <span className="text-xs text-gray-500 font-mono">{fmt.relative(r.updatedAt)}</span> },
    ...(canWrite ? [{ key: 'actions', label: '', sortable: false,
      render: r => (
        <div className="flex gap-1.5 flex-wrap">
          {r.status === 'PENDING'      && <button onClick={() => statusMutation.mutate({ id: r.id, status:'IN_PROGRESS' })} className="btn-secondary !py-1 !px-2 text-xs">Start</button>}
          {r.status === 'IN_PROGRESS'  && <button onClick={() => statusMutation.mutate({ id: r.id, status:'DELIVERED' })}   className="btn-success !py-1 !px-2 text-xs">Deliver</button>}
          <button onClick={() => { setEditing(r); setModalOpen(true) }} className="btn-secondary !py-1 !px-2"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleting(r)} className="btn-danger !py-1 !px-2"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Baggage Handling" subtitle="Track baggage manifests and handling status"
        actions={canWrite && <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> New Manifest</button>} />
      <div className="card">
        <DataTable columns={columns} data={manifests} loading={isLoading} />
      </div>
      <BaggageModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} editing={editing} flights={flights} />
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Remove Manifest" message="Remove this baggage manifest?" danger />
    </div>
  )
}

function BaggageModal({ isOpen, onClose, onSave, loading, editing, flights }) {
  const init = { flightScheduleId:'', baggageCount:'', priorityLevel:'NORMAL', handlingTeam:'', notes:'' }
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  useState(() => {
    setForm(editing ? {
      flightScheduleId: editing.flightSchedule?.id ?? '',
      baggageCount: editing.baggageCount ?? '',
      priorityLevel: editing.priorityLevel,
      handlingTeam: editing.handlingTeam ?? '',
      notes: editing.notes ?? '',
    } : init)
  }, [editing])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Baggage Manifest' : 'New Baggage Manifest'}>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, flightScheduleId: form.flightScheduleId ? Number(form.flightScheduleId) : null, baggageCount: Number(form.baggageCount) }) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Flight" required>
            <select className="select" value={form.flightScheduleId} onChange={e => set('flightScheduleId', e.target.value)} required>
              <option value="">Select flight</option>
              {flights.map(f => <option key={f.id} value={f.id}>{f.flightNumber}</option>)}
            </select>
          </FormField>
          <FormField label="Bag Count" required>
            <input className="input" type="number" min="0" value={form.baggageCount} onChange={e => set('baggageCount', e.target.value)} placeholder="150" required />
          </FormField>
          <FormField label="Priority Level">
            <select className="select" value={form.priorityLevel} onChange={e => set('priorityLevel', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label="Handling Team">
            <input className="input" value={form.handlingTeam} onChange={e => set('handlingTeam', e.target.value)} placeholder="Team Alpha" />
          </FormField>
        </div>
        <FormField label="Notes">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Special handling instructions..." />
        </FormField>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save Manifest'}</button>
        </div>
      </form>
    </Modal>
  )
}
