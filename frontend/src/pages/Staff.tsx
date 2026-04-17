import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { staffApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { StatusBadge } from '../utils/helpers'
import { staffSchema, type StaffInput } from '../utils/schemas'
import type { GroundStaff, StaffRole, StaffShift, StaffStatus } from '../types'
import { DataTable, Modal, PageHeader, FormField, SearchInput, ConfirmDialog } from '../components/ui'
import { Plus, Edit2, Trash2, Phone, Mail } from 'lucide-react'
import { cn } from '../utils/helpers'
import toast from 'react-hot-toast'

const ROLES: StaffRole[] = [
  'PILOT_COORDINATOR',
  'GATE_AGENT',
  'FUEL_TECH',
  'BAGGAGE_HANDLER',
  'MAINTENANCE_CREW',
  'RAMP_AGENT',
  'OPERATIONS_SUPERVISOR',
  'SECURITY',
  'CUSTOMS_OFFICER'
]

const SHIFTS: StaffShift[] = ['DAY', 'EVENING', 'NIGHT']
const STATUSES: StaffStatus[] = ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY']

const SHIFT_COLORS: Record<StaffShift, string> = {
  DAY: 'bg-amber-900/30 text-amber-300 border border-amber-800/30',
  EVENING: 'bg-purple-900/30 text-purple-300 border border-purple-800/30',
  NIGHT: 'bg-blue-900/30 text-blue-300 border border-blue-800/30'
}

export default function Staff() {
  const qc = useQueryClient()
  const { canWrite } = useAuth()

  const [search, setSearch] = useState('')
  const [shiftFilter, setShiftFilter] = useState<StaffShift | ''>('')
  const [statusFilter, setStatusFilter] = useState<StaffStatus | ''>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GroundStaff | null>(null)
  const [deleting, setDeleting] = useState<GroundStaff | null>(null)
  const [scheduleView, setScheduleView] = useState(false)

  const { data: staff = [], isLoading } = useQuery<GroundStaff[]>({
    queryKey: ['staff', search],
    queryFn: () =>
      staffApi.getAll(search ? { search } : {}).then(r => r.data as GroundStaff[])
  })

  const filtered = staff.filter(
    s =>
      (!shiftFilter || s.shift === shiftFilter) &&
      (!statusFilter || s.status === statusFilter)
  )

  const saveMutation = useMutation({
    mutationFn: (d: StaffInput) =>
      editing ? staffApi.update(editing.id, d) : staffApi.create(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success(editing ? 'Staff updated' : 'Staff added')
      setModalOpen(false)
      setEditing(null)
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.message || 'Save failed')
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => staffApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Staff removed')
    }
  })

  const shiftCounts = SHIFTS.reduce((acc, s) => {
    acc[s] = staff.filter(x => x.shift === s).length
    return acc
  }, {} as Record<StaffShift, number>)

  const availableCount = staff.filter(s => s.status === 'AVAILABLE').length

  const columns = [
    {
      key: 'staffId',
      label: 'Staff ID',
      render: (r: GroundStaff) => (
        <span className="font-mono text-indigo-300 font-semibold">{r.staffId}</span>
      )
    },
    {
      key: 'name',
      label: 'Name',
      render: (r: GroundStaff) => (
        <span className="font-medium text-white">{r.name}</span>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (r: GroundStaff) => (
        <span className="text-xs text-gray-400">{r.role?.replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'shift',
      label: 'Shift',
      render: (r: GroundStaff) => (
        <span className={`badge ${SHIFT_COLORS[r.shift]}`}>{r.shift}</span>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (r: GroundStaff) => (
        <div className="flex flex-col gap-0.5">
          {r.phone && (
            <span className="font-mono text-xs text-gray-400 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {r.phone}
            </span>
          )}
          {r.email && (
            <span className="font-mono text-xs text-gray-500 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {r.email}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: GroundStaff) => <StatusBadge status={r.status} />
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            label: '',
            sortable: false,
            render: (r: GroundStaff) => (
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setEditing(r)
                    setModalOpen(true)
                  }}
                  className="btn-secondary !py-1 !px-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleting(r)}
                  className="btn-danger !py-1 !px-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          }
        ]
      : [])
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Ground Staff"
        subtitle="Manage personnel, shifts, and assignments"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setScheduleView(!scheduleView)}
              className="btn-secondary"
            >
              {scheduleView ? 'Table View' : 'Shift View'}
            </button>

            {canWrite && (
              <button
                onClick={() => {
                  setEditing(null)
                  setModalOpen(true)
                }}
                className="btn-primary"
              >
                <Plus className="w-4 h-4" /> Add Staff
              </button>
            )}
          </div>
        }
      />

      <div className="card">
        <div className="card-header flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search name, ID..."
            className="max-w-xs"
          />
        </div>

        <DataTable columns={columns} data={filtered} loading={isLoading} />
      </div>

      <StaffModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={d => saveMutation.mutate(d)}
        loading={saveMutation.isPending}
        editing={editing}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id)
            setDeleting(null)
          }
        }}
        title="Remove Staff"
        message={`Remove ${deleting?.name}?`}
        danger
      />
    </div>
  )
}

function StaffModal({
  isOpen,
  onClose,
  onSave,
  loading,
  editing
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (d: StaffInput) => void
  loading: boolean
  editing: GroundStaff | null
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<StaffInput>({
    resolver: zodResolver(staffSchema),
    defaultValues: { role: 'GATE_AGENT', shift: 'DAY', status: 'AVAILABLE' }
  })

  useEffect(() => {
    if (editing) {
      reset({
        staffId: editing.staffId,
        name: editing.name,
        role: editing.role,
        shift: editing.shift,
        status: editing.status,
        phone: editing.phone ?? '',
        email: editing.email ?? ''
      })
    }
  }, [editing, reset])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Edit Staff Member' : 'Add Staff Member'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <FormField label="Staff ID" required error={errors.staffId?.message}>
          <input className="input" {...register('staffId')} />
        </FormField>

        <FormField label="Full Name" required error={errors.name?.message}>
          <input className="input" {...register('name')} />
        </FormField>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : editing ? 'Update' : 'Add Staff'}
          </button>
        </div>
      </form>
    </Modal>
  )
}