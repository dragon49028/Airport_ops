import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { aircraftApi } from "../services/api"
import { useAuth } from "../hooks/useAuth"
import { StatusBadge } from "../utils/helpers"
import { DataTable, Modal, SearchInput, PageHeader, FormField, ConfirmDialog } from "../components/ui"
import { Plus, Edit2, Trash2 } from "lucide-react"
import toast from "react-hot-toast"
import type { Aircraft } from "../types"

const STATUSES = ["AVAILABLE","AT_GATE","IN_FLIGHT","MAINTENANCE","OUT_OF_SERVICE"]

export default function AircraftPage() {

  const qc = useQueryClient()
  const { canWrite } = useAuth()

  const [search,setSearch] = useState("")
  const [modalOpen,setModalOpen] = useState(false)
  const [editing,setEditing] = useState<Aircraft | null>(null)
  const [deleting,setDeleting] = useState<Aircraft | null>(null)

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey:["aircraft"],
    queryFn:async ()=>{
      const { data } = await aircraftApi.getAll()
      return data
    }
  })

  const filtered = aircraft.filter((a:Aircraft)=>
    !search ||
    [a.registrationNumber,a.model,a.airline].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const saveMutation = useMutation({

    mutationFn:(d:Partial<Aircraft>) =>
      editing
        ? aircraftApi.update(editing.id,d)
        : aircraftApi.create(d),

    onSuccess:()=>{
      qc.invalidateQueries({queryKey:["aircraft"]})
      toast.success(editing ? "Aircraft updated":"Aircraft added")
      setModalOpen(false)
      setEditing(null)
    },

    onError:(e:any)=>{
      toast.error(e?.response?.data?.message || "Save failed")
    }
  })

  const deleteMutation = useMutation({

    mutationFn:(id:number)=>aircraftApi.delete(id),

    onSuccess:()=>{
      qc.invalidateQueries({queryKey:["aircraft"]})
      toast.success("Aircraft removed")
    },

    onError:()=>{
      toast.error("Delete failed")
    }
  })

  const columns = [

    {
      key:"registrationNumber",
      label:"Reg No.",
      render:(r:Aircraft)=>(
        <span className="font-mono font-semibold text-indigo-300">
          {r.registrationNumber}
        </span>
      )
    },

    { key:"model",label:"Model" },

    {
      key:"airline",
      label:"Airline",
      render:(r:Aircraft)=>r.airline ?? "—"
    },

    {
      key:"capacity",
      label:"Cap.",
      render:(r:Aircraft)=>r.capacity ? `${r.capacity} pax`:"—"
    },

    {
      key:"currentGate",
      label:"Gate",
      render:(r:Aircraft)=>r.currentGate
        ? <span className="font-mono text-sm bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded">{r.currentGate}</span>
        : <span className="text-gray-600">—</span>
    },

    {
      key:"status",
      label:"Status",
      render:(r:Aircraft)=><StatusBadge status={r.status}/>
    },

    ...(canWrite ? [{
      key:"actions",
      label:"",
      sortable:false,

      render:(r:Aircraft)=>(
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
    }] : [])
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      <PageHeader
        title="Aircraft Fleet"
        subtitle="Track and manage all registered aircraft"
        actions={
          canWrite &&
          <button
            onClick={()=>{setEditing(null);setModalOpen(true)}}
            className="btn-primary"
          >
            <Plus className="w-4 h-4"/> Add Aircraft
          </button>
        }
      />

      <div className="card">

        <div className="card-header">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search registration, model, airline..."
            className="max-w-sm"
          />
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={isLoading}
        />

      </div>

      <AircraftModal
        isOpen={modalOpen}
        onClose={()=>{setModalOpen(false);setEditing(null)}}
        onSave={(d)=>saveMutation.mutate(d)}
        loading={saveMutation.isPending}
        editing={editing}
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
        title="Remove Aircraft"
        message={`Remove ${deleting?.registrationNumber}?`}
        danger
      />

    </div>
  )
}

type AircraftModalProps = {
  isOpen:boolean
  onClose:()=>void
  onSave:(data:any)=>void
  loading:boolean
  editing:Aircraft | null
}

function AircraftModal({
  isOpen,
  onClose,
  onSave,
  loading,
  editing
}:AircraftModalProps){

  const init = {
    registrationNumber:"",
    model:"",
    airline:"",
    capacity:"",
    status:"AVAILABLE",
    currentGate:""
  }

  const [form,setForm] = useState(init)

  const set = (k:string,v:any)=>
    setForm(p=>({...p,[k]:v}))

  useEffect(()=>{

    if(editing){
      setForm({
        registrationNumber:editing.registrationNumber,
        model:editing.model,
        airline:editing.airline ?? "",
        capacity:editing.capacity?.toString() ?? "",
        status:editing.status,
        currentGate:editing.currentGate ?? ""
      })
    }else{
      setForm(init)
    }

  },[editing])

  return (

    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit Aircraft":"Add Aircraft"}
    >

      <form
        onSubmit={e=>{
          e.preventDefault()
          onSave({
            ...form,
            capacity:form.capacity ? Number(form.capacity):null
          })
        }}
        className="space-y-4"
      >

        <div className="grid grid-cols-2 gap-4">

          <FormField label="Registration No." required error={undefined}>
            <input
              className="input"
              value={form.registrationNumber}
              onChange={e=>set("registrationNumber",e.target.value)}
              placeholder="VT-ANA"
              required
            />
          </FormField>

          <FormField label="Model" required error={undefined}>
            <input
              className="input"
              value={form.model}
              onChange={e=>set("model",e.target.value)}
              placeholder="Boeing 737-800"
              required
            />
          </FormField>

          <FormField label="Airline" error={undefined} required={false}>
            <input
              className="input"
              value={form.airline}
              onChange={e=>set("airline",e.target.value)}
              placeholder="Air India"
            />
          </FormField>

          <FormField label="Capacity (pax)" error={undefined} required={false}>
            <input
              className="input"
              type="number"
              min="1"
              value={form.capacity}
              onChange={e=>set("capacity",e.target.value)}
              placeholder="189"
            />
          </FormField>

          <FormField label="Status" error={undefined} required={false}>
            <select
              className="select"
              value={form.status}
              onChange={e=>set("status",e.target.value)}
            >
              {STATUSES.map(s =>
                <option key={s} value={s}>
                  {s.replace(/_/g," ")}
                </option>
              )}
            </select>
          </FormField>

          <FormField label="Current Gate" error={undefined} required={false}>
            <input
              className="input"
              value={form.currentGate}
              onChange={e=>set("currentGate",e.target.value)}
              placeholder="A1"
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
            {loading ? "Saving…" : editing ? "Update":"Add Aircraft"}
          </button>

        </div>

      </form>

    </Modal>
  )
}