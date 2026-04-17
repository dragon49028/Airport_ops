import React,{useState,useEffect} from "react"
import {Plus,Edit2,Trash2,DoorOpen} from "lucide-react"

import{
  PageHeader,
  Card,
  Button,
  Modal,
  FormField,
  Input,
  Select
}from "../components/ui"
import { StatusBadge } from "../utils/helpers"

import{
  getGates,
  createGate,
  updateGate,
  deleteGate
}from "../services/api"

import type{Gate}from "../types"

export default function GatesPage(){

  const[gates,setGates]=useState<Gate[]>([])
  const[loading,setLoading]=useState(true)

  const[isModalOpen,setIsModalOpen]=useState(false)
  const[editing,setEditing]=useState<Gate | null>(null)

  const[formData,setFormData]=useState<{
    gateNumber:string
    terminal:string
    status:Gate['status']
    capacity:string
  }>({
    gateNumber:"",
    terminal:"",
    status:"AVAILABLE",
    capacity:""
  })

  const[errors,setErrors]=useState<Record<string,string>>({})

  useEffect(()=>{
    fetchGates()
  },[])

  const fetchGates=async()=>{

    try{

      setLoading(true)

      const res=await getGates()

      setGates(res?.data || [])

    }catch(err){

      console.error("Error fetching gates:",err)

    }finally{

      setLoading(false)

    }

  }

  const resetForm=()=>{

    setFormData({
      gateNumber:"",
      terminal:"",
      status:"AVAILABLE",
      capacity:""
    })

    setEditing(null)
    setErrors({})

  }

  const handleSubmit=async(e:React.FormEvent)=>{

    e.preventDefault()

    const newErrors:Record<string,string>={}

    if(!formData.gateNumber)newErrors.gateNumber="Gate number required"
    if(!formData.terminal)newErrors.terminal="Terminal required"
    if(!formData.capacity)newErrors.capacity="Capacity required"

    if(Object.keys(newErrors).length){
      setErrors(newErrors)
      return
    }

    try{

      const payload={
        ...formData,
        capacity:Number(formData.capacity)
      }

      if(editing){
        await updateGate(editing.id,payload)
      }else{
        await createGate(payload)
      }

      await fetchGates()

      setIsModalOpen(false)
      resetForm()

    }catch(err){

      console.error("Error saving gate:",err)

    }

  }

  const handleEdit=(gate:Gate)=>{

    setEditing(gate)

    setFormData({
      gateNumber:gate.gateNumber || "",
      terminal:gate.terminal || "",
      status:gate.status,
      capacity:gate.capacity?.toString() || ""
    })

    setIsModalOpen(true)

  }

  const handleDelete=async(id:number)=>{

    if(!window.confirm("Delete this gate?"))return

    try{

      await deleteGate(id)

      fetchGates()

    }catch(err){

      console.error("Error deleting gate:",err)

    }

  }

  if(loading){

    return(
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/>
      </div>
    )

  }

  return(

    <div className="space-y-6">

      <PageHeader
        title="Gate Management"
        subtitle="Manage airport gates and terminals"
        actions={
          <Button onClick={()=>setIsModalOpen(true)}>
            <div className="flex items-center gap-2">
              <Plus size={16}/>
              Add Gate
            </div>
          </Button>
        }
      />

      <Card>

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-800 text-sm">

            <thead className="bg-gray-900/80">

              <tr>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Gate Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Terminal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>

              </tr>

            </thead>

            <tbody className="bg-gray-900/40 divide-y divide-gray-800/60 text-gray-200">

              {gates.map(gate=>(

                <tr key={gate.id}>

                  <td className="px-4 py-3 align-middle">

                    <div className="flex items-center gap-2">
                      <DoorOpen className="h-5 w-5 text-indigo-400"/>
                      <span className="font-mono font-semibold text-indigo-300">
                        {gate.gateNumber}
                      </span>
                    </div>

                  </td>

                  <td className="px-4 py-3 align-middle text-gray-200">
                    {gate.terminal}
                  </td>

                  <td className="px-4 py-3 align-middle text-gray-300">
                    {gate.capacity}
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={gate.status} />

                  </td>

                  <td className="px-4 py-3 align-middle text-right">

                    <button
                      onClick={()=>handleEdit(gate)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="h-5 w-5"/>
                    </button>

                    <button
                      onClick={()=>handleDelete(gate.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5"/>
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={()=>{setIsModalOpen(false);resetForm()}}
        title={editing ? "Edit Gate":"Add Gate"}
      >

        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label="Gate Number" error={errors.gateNumber} required>

            <Input
              value={formData.gateNumber}
              onChange={(e)=>setFormData({...formData,gateNumber:e.target.value})}
            />

          </FormField>

          <FormField label="Terminal" error={errors.terminal} required>

            <Select
              value={formData.terminal}
              onChange={(e)=>setFormData({...formData,terminal:e.target.value})}
            >
              <option value="">Select Terminal</option>
              <option value="Terminal A">Terminal A</option>
              <option value="Terminal B">Terminal B</option>
              <option value="Terminal C">Terminal C</option>
              <option value="Terminal D">Terminal D</option>
            </Select>

          </FormField>

          <FormField label="Status" error={errors.status} required>

            <Select
              value={formData.status}
              onChange={(e)=>setFormData({...formData,status:e.target.value as Gate['status']})}
            >

              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>

            </Select>

          </FormField>

          <FormField label="Capacity" error={errors.capacity} required>

            <Input
              type="number"
              value={formData.capacity}
              onChange={(e)=>setFormData({...formData,capacity:e.target.value})}
            />

          </FormField>

          <div className="flex justify-end gap-3 pt-4">

            <Button
              type="button"
              onClick={()=>{setIsModalOpen(false);resetForm()}}
            >
              Cancel
            </Button>

            <Button type="submit">
              {editing ? "Update":"Create"}
            </Button>

          </div>

        </form>

      </Modal>

    </div>

  )

}