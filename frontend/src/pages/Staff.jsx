import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { staffApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge } from '../utils/helpers'
import { DataTable, Modal, PageHeader, FormField, SearchInput, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2, Users, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

const ROLES = ['GATE_AGENT','BAGGAGE_HANDLER','REFUELING_TECH','MAINTENANCE_CREW','RAMP_AGENT','OPERATIONS_SUPERVISOR','SECURITY','CUSTOMS_OFFICER']
const SHIFTS = ['DAY','EVENING','NIGHT']
const STATUSES = ['AVAILABLE','BUSY','ON_BREAK','OFF_DUTY']

const SHIFT_COLORS = {
  DAY: 'bg-amber-900/30 text-amber-300 border border-amber-800/30',
  EVENING: 'bg-purple-900/30 text-purple-300 border border-purple-800/30',
  NIGHT: 'bg-blue-900/30 text-blue-300 border border-blue-800/30',
}

export default function Staff() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()
  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [deleting, setDeleting]   = useState(null)

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff', search],
    queryFn: () => staffApi.getAll(search ? { search } : {}).then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? staffApi.update(editing.id, d) : staffApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success(editing ? 'Staff updated' : 'Staff added'); setModalOpen(false); setEditing(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => staffApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff removed') },
  })

  const columns = [
    { key: 'staffId', label: 'Staff ID', render: r => <span className="font-mono text-indigo-300 font-semibold">{r.staffId}</span> },
    { key: 'name', label: 'Name', render: r => <span className="font-medium text-white">{r.name}</span> },
    { key: 'role', label: 'Role', render: r => <span className="text-xs text-gray-400">{r.role?.replace(/_/g,' ')}</span> },
    { key: 'shift', label: 'Shift', render: r => <span className={`badge ${SHIFT_COLORS[r.shift]}`}>{r.shift}</span> },
    { key: 'currentAssignment', label: 'Assignment', render: r => r.currentAssignment
      ? <span className="text-sm text-gray-300 truncate max-w-[160px] block">{r.currentAssignment}</span>
      : <span className="text-gray-600">—</span>
    },
    { key: 'phone', label: 'Phone', render: r => r.phone
      ? <span className="font-mono text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</span>
      : <span className="text-gray-600">—</span>
    },
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
      <PageHeader title="Ground Staff" subtitle="Manage ground operations personnel and assignments"
        actions={canWrite && <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Staff</button>} />
      <div className="card">
        <div className="card-header">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, role..." className="max-w-sm" />
        </div>
        <DataTable columns={columns} data={staff} loading={isLoading} />
      </div>
      <StaffModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} editing={editing} />
      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Remove Staff" message={`Remove ${deleting?.name} from the system?`} danger />
    </div>
  )
}

function StaffModal({ isOpen, onClose, onSave, loading, editing }) {
  const init = { staffId:'', name:'', role:'GATE_AGENT', shift:'DAY', currentAssignment:'', status:'AVAILABLE', phone:'' }
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  useState(() => {
    setForm(editing ? {
      staffId: editing.staffId,
      name: editing.name,
      role: editing.role,
      shift: editing.shift,
      currentAssignment: editing.currentAssignment ?? '',
      status: editing.status,
      phone: editing.phone ?? '',
    } : init)
  }, [editing])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Staff Member' : 'Add Staff Member'} size="lg">
      <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Staff ID" required>
            <input className="input" value={form.staffId} onChange={e => set('staffId', e.target.value)} placeholder="GS011" required />
          </FormField>
          <FormField label="Full Name" required>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rahul Sharma" required />
          </FormField>
          <FormField label="Role">
            <select className="select" value={form.role} onChange={e => set('role', e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Shift">
            <select className="select" value={form.shift} onChange={e => set('shift', e.target.value)}>
              {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91-9876543210" />
          </FormField>
          <FormField label="Current Assignment" className="col-span-2">
            <input className="input" value={form.currentAssignment} onChange={e => set('currentAssignment', e.target.value)} placeholder="Gate A1 - Flight AI-101" />
          </FormField>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : editing ? 'Update Staff' : 'Add Staff'}</button>
        </div>
      </form>
    </Modal>
  )
}
