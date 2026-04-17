import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { maintenanceApi, aircraftApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { fmt, StatusBadge, SEVERITY_COLORS } from '../utils/helpers'
import { DataTable, Modal, PageHeader, FormField, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const SEVERITIES = ['MINOR','MODERATE','CRITICAL']
const STATUSES   = ['PENDING','IN_REVIEW','CLEARED','GROUNDED']

export default function Maintenance() {
  const qc = useQueryClient()
  const { canWrite, isAdmin } = useAuth()
  const [modalOpen, setModalOpen]       = useState(false)
  const [approveModal, setApproveModal] = useState(null)
  const [editing, setEditing]           = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [approvedBy, setApprovedBy]     = useState('')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceApi.getAll().then(r => r.data),
  })
  const { data: aircraft = [] } = useQuery({
    queryKey: ['aircraft'],
    queryFn: () => aircraftApi.getAll().then(r => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (d) => editing ? maintenanceApi.update(editing.id, d) : maintenanceApi.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); qc.invalidateQueries({ queryKey: ['aircraft'] }); toast.success('Record saved'); setModalOpen(false); setEditing(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })
  const approveMutation = useMutation({
    mutationFn: ({ id, by }) => maintenanceApi.approve(id, by),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); qc.invalidateQueries({ queryKey: ['aircraft'] }); toast.success('Clearance approved'); setApproveModal(null) },
    onError: () => toast.error('Approval failed'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => maintenanceApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance'] }); toast.success('Record removed') },
  })

  const columns = [
    { key: 'aircraft', label: 'Aircraft', render: r => (
      <span className="font-mono font-semibold text-indigo-300">{r.aircraft?.registrationNumber ?? '—'}</span>
    )},
    { key: 'severity', label: 'Severity', render: r => (
      <span className={`font-semibold text-sm ${SEVERITY_COLORS[r.severity]}`}>
        {r.severity === 'CRITICAL' && <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />}
        {r.severity}
      </span>
    )},
    { key: 'issueDescription', label: 'Issue', render: r => (
      <span className="text-gray-300 text-sm line-clamp-1 max-w-xs">{r.issueDescription}</span>
    )},
    { key: 'clearanceStatus', label: 'Status', render: r => <StatusBadge status={r.clearanceStatus} /> },
    { key: 'approvedBy', label: 'Approved By', render: r => r.approvedBy ?? <span className="text-gray-600">—</span> },
    { key: 'reportedTime', label: 'Reported', render: r => <span className="font-mono text-xs text-gray-500">{fmt.relative(r.reportedTime)}</span> },
    ...(canWrite ? [{ key: 'actions', label: '', sortable: false,
      render: r => (
        <div className="flex gap-1.5">
          {(isAdmin || canWrite) && r.clearanceStatus !== 'CLEARED' && (
            <button onClick={() => { setApproveModal(r); setApprovedBy('') }} className="btn-success !py-1 !px-2 text-xs">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => { setEditing(r); setModalOpen(true) }} className="btn-secondary !py-1 !px-2"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleting(r)} className="btn-danger !py-1 !px-2"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="Maintenance Clearances" subtitle="Track aircraft issues and manage clearance approvals"
        actions={canWrite && <button onClick={() => { setEditing(null); setModalOpen(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Report Issue</button>} />
      <div className="card">
        <DataTable columns={columns} data={records} loading={isLoading} />
      </div>

      <MaintenanceModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(d) => saveMutation.mutate(d)} loading={saveMutation.isPending} editing={editing} aircraft={aircraft} />

      {/* Approve modal */}
      <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Clearance" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Approving clearance for <span className="text-white font-semibold">{approveModal?.aircraft?.registrationNumber}</span>.
            Aircraft will be set to AVAILABLE.
          </p>
          <FormField label="Approved By" required>
            <input className="input" value={approvedBy} onChange={e => setApprovedBy(e.target.value)} placeholder="Engineer name / ID" required />
          </FormField>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setApproveModal(null)} className="btn-secondary">Cancel</button>
            <button
              disabled={!approvedBy || approveMutation.isPending}
              onClick={() => approveMutation.mutate({ id: approveModal.id, by: approvedBy })}
              className="btn-success">
              {approveMutation.isPending ? 'Approving…' : 'Approve Clearance'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { deleteMutation.mutate(deleting.id); setDeleting(null) }}
        title="Remove Record" message="Remove this maintenance record?" danger />
    </div>
  )
}

function MaintenanceModal({ isOpen, onClose, onSave, loading, editing, aircraft }) {
  const init = { aircraftId:'', issueDescription:'', severity:'MINOR', notes:'' }
  const [form, setForm] = useState(init)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  useState(() => {
    setForm(editing ? {
      aircraftId: editing.aircraft?.id ?? '',
      issueDescription: editing.issueDescription,
      severity: editing.severity,
      notes: editing.notes ?? '',
    } : init)
  }, [editing])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Maintenance Record' : 'Report Maintenance Issue'}>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, aircraftId: form.aircraftId ? Number(form.aircraftId) : null }) }} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Aircraft" required>
            <select className="select" value={form.aircraftId} onChange={e => set('aircraftId', e.target.value)} required>
              <option value="">Select aircraft</option>
              {aircraft.map(a => <option key={a.id} value={a.id}>{a.registrationNumber} · {a.model}</option>)}
            </select>
          </FormField>
          <FormField label="Severity">
            <select className="select" value={form.severity} onChange={e => set('severity', e.target.value)}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Issue Description" required>
          <textarea className="input resize-none" rows={3} value={form.issueDescription} onChange={e => set('issueDescription', e.target.value)} placeholder="Describe the issue in detail..." required />
        </FormField>
        <FormField label="Additional Notes">
          <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional context..." />
        </FormField>
        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Saving…' : 'Save Record'}</button>
        </div>
      </form>
    </Modal>
  )
}
