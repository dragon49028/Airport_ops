import React,{useState,useEffect} from "react"
import {Plus,Edit2,Trash2,Plane,Filter} from "lucide-react"
import { StatusBadge, fmt } from "../utils/helpers"

import{
  PageHeader,
  Card,
  Button,
  Modal,
  FormField,
  Input,
  Select,
  ErrorMessage
}from "../components/ui"

import{
  getFlights,
  createFlight,
  updateFlight,
  deleteFlight,
  getAircraft,
  gatesApi
}from "../services/api"

import type{
  FlightSchedule,
  Aircraft,
  FlightStatus,
  GateAssignment
}from "../types"

export default function FlightsPage(){

  const[flights,setFlights]=useState<FlightSchedule[]>([])
  const[aircraft,setAircraft]=useState<Aircraft[]>([])
  const[gates,setGates]=useState<GateAssignment[]>([])
  const[availableGates,setAvailableGates]=useState<string[]>([])

  const[loading,setLoading]=useState(true)
  const[error,setError]=useState<string | null>(null)

  const[isModalOpen,setIsModalOpen]=useState(false)
  const[editing,setEditing]=useState<FlightSchedule | null>(null)

  const[statusFilter,setStatusFilter]=useState("ALL")

  const[formData,setFormData]=useState({
    flightNumber:"",
    origin:"",
    destination:"",
    departureTime:"",
    arrivalTime:"",
    status:"SCHEDULED" as FlightStatus,
    aircraftId:"",
    gateNumber:""
  })

  const[errors,setErrors]=useState<Record<string,string>>({})

  useEffect(()=>{
    fetchData()
  },[])

  const fetchData=async()=>{

    try{

      setLoading(true)
      setError(null)

      const[
        flightsRes,
        aircraftRes,
        gatesRes,
        availableRes
      ]=await Promise.all([
        getFlights({page:0,size:100}),
        getAircraft(),
        gatesApi.getAll(),
        gatesApi.getAvailable()
      ])

      setFlights(flightsRes?.data?.content || [])
      setAircraft(aircraftRes?.data || [])
      setGates(gatesRes?.data || [])
      setAvailableGates(availableRes?.data || [])

    }catch(err:any){

      setError(err.message || "Failed to load data")

    }finally{

      setLoading(false)

    }

  }

  const resetForm=()=>{

    setFormData({
      flightNumber:"",
      origin:"",
      destination:"",
      departureTime:"",
      arrivalTime:"",
      status:"SCHEDULED",
      aircraftId:"",
      gateNumber:""
    })

    setEditing(null)
    setErrors({})

  }

  const handleSubmit=async(e:React.FormEvent)=>{

    e.preventDefault()

    const newErrors:Record<string,string>={}

    if(!formData.flightNumber)newErrors.flightNumber="Flight number required"
    if(!formData.origin)newErrors.origin="Origin required"
    if(!formData.destination)newErrors.destination="Destination required"
    if(!formData.aircraftId)newErrors.aircraftId="Aircraft required"
    if(!formData.departureTime)newErrors.departureTime="Departure time required"
    if(!formData.arrivalTime)newErrors.arrivalTime="Arrival time required"

    if(Object.keys(newErrors).length){
      setErrors(newErrors)
      return
    }

    try{

      const payload={
        flightNumber:formData.flightNumber,
        origin:formData.origin,
        destination:formData.destination,
        scheduledDeparture:formData.departureTime || undefined,
        scheduledArrival:formData.arrivalTime || undefined,
        status:formData.status,
        aircraftId:Number(formData.aircraftId)
      }

      const savedFlight = editing
        ? (await updateFlight(editing.id,payload)).data
        : (await createFlight(payload)).data

      const existingAssignment = gates.find(g =>
        g.flightSchedule?.id === savedFlight.id &&
        g.status !== 'CANCELLED' &&
        g.status !== 'RELEASED'
      )

      if (formData.gateNumber) {
        const gatePayload = {
          gateNumber: formData.gateNumber,
          flightScheduleId: savedFlight.id,
          assignedTime: formData.departureTime || undefined,
          releaseTime: formData.arrivalTime || undefined,
          notes: `Flight ${savedFlight.flightNumber}`
        }

        if (existingAssignment) {
          await gatesApi.update(existingAssignment.id, gatePayload)
        } else {
          await gatesApi.create(gatePayload)
        }
      }

      fetchData()
      setIsModalOpen(false)
      resetForm()

    }catch(err){
      console.error("Error saving flight",err)
    }

  }

  const handleEdit=(flight:FlightSchedule)=>{

    setEditing(flight)

    setFormData({
      flightNumber:flight.flightNumber || "",
      origin:flight.origin || "",
      destination:flight.destination || "",
      departureTime:flight.scheduledDeparture || "",
      arrivalTime:flight.scheduledArrival || "",
      status:flight.status,
      aircraftId:flight.aircraft?.id?.toString() || "",
      gateNumber:flight.gateAssignments?.find(g => g.status === 'ACTIVE' || g.status === 'SCHEDULED')?.gateNumber || ""
    })

    setIsModalOpen(true)

  }

  const handleDelete=async(id:number)=>{

    if(!window.confirm("Delete this flight?"))return

    try{
      await deleteFlight(id)
      fetchData()
    }catch(err){
      console.error("Error deleting flight",err)
    }

  }

  const filteredFlights=
    statusFilter==="ALL"
      ? flights
      : flights.filter(f=>f.status===statusFilter)

  useEffect(() => {
    if (!isModalOpen) return

    const loadAvailable = async () => {
      try {
        const res = await gatesApi.getAvailable(formData.departureTime || undefined)
        setAvailableGates(res?.data || [])
      } catch {
        setAvailableGates([])
      }
    }

    loadAvailable()
  }, [isModalOpen, formData.departureTime])

  if(loading){
    return(
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"/>
      </div>
    )
  }

  if(error){
    return(
      <ErrorMessage
        message={error}
        onRetry={()=>window.location.reload()}
      />
    )
  }

  return(

    <div className="space-y-6">

      <PageHeader
        title="Flight Schedules"
        subtitle="Manage flight schedules and operations"
        actions={
          <Button onClick={()=>setIsModalOpen(true)}>
            <div className="flex items-center gap-2">
              <Plus size={16}/>
              Add Flight
            </div>
          </Button>
        }
      />

      <Card>

        <div className="mb-4 flex items-center gap-4">

          <Filter className="h-5 w-5 text-gray-400"/>

          <Select
            value={statusFilter}
            onChange={(e)=>setStatusFilter(e.target.value)}
          >

            <option value="ALL">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="BOARDING">Boarding</option>
            <option value="DEPARTED">Departed</option>
            <option value="ARRIVED">Arrived</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>

          </Select>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-800 text-sm">

            <thead className="bg-gray-900/80">

              <tr>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Flight</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Route</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Departure</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Arrival</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Aircraft</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Gate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>

              </tr>

            </thead>

            <tbody className="bg-gray-900/40 divide-y divide-gray-800/60 text-gray-200">

              {filteredFlights.map(flight=>(

                <tr key={flight.id}>

                  <td className="px-4 py-3 align-middle">

                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-indigo-400"/>
                      <span className="font-mono font-semibold text-indigo-300">
                        {flight.flightNumber}
                      </span>
                    </div>

                  </td>

                  <td className="px-4 py-3 align-middle text-gray-200">
                    {flight.origin} → {flight.destination}
                  </td>

                  <td className="px-4 py-3 align-middle font-mono text-gray-300">
                    {flight.scheduledDeparture
                      ? fmt.datetime(flight.scheduledDeparture)
                      : "—"}
                  </td>

                  <td className="px-4 py-3 align-middle font-mono text-gray-300">
                    {flight.scheduledArrival
                      ? fmt.datetime(flight.scheduledArrival)
                      : "—"}
                  </td>

                  <td className="px-4 py-3 align-middle text-gray-300">
                    {flight.aircraft?.model || "N/A"}
                  </td>

                  <td className="px-4 py-3 align-middle text-gray-300">
                    {flight.gateAssignments?.find(g=>g.status==='ACTIVE' || g.status==='SCHEDULED')?.gateNumber || flight.gate?.gateNumber || "N/A"}
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <StatusBadge status={flight.status} />
                  </td>

                  <td className="px-4 py-3 align-middle text-right">

                    <button
                      onClick={()=>handleEdit(flight)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit2 className="h-5 w-5"/>
                    </button>

                    <button
                      onClick={()=>handleDelete(flight.id)}
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

      {/* Modal */}

      <Modal
        isOpen={isModalOpen}
        onClose={()=>{setIsModalOpen(false);resetForm()}}
        title={editing ? "Edit Flight":"Add Flight"}
      >

        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label="Flight Number" error={errors.flightNumber} required>

            <Input
              value={formData.flightNumber}
              onChange={e=>setFormData({...formData,flightNumber:e.target.value})}
            />

          </FormField>

          {/* Origin Destination */}

          <div className="grid grid-cols-2 gap-4">

            <FormField label="Origin" error={errors.origin} required>

              <Input
                value={formData.origin}
                onChange={e=>setFormData({...formData,origin:e.target.value})}
              />

            </FormField>

            <FormField label="Destination" error={errors.destination} required>

              <Input
                value={formData.destination}
                onChange={e=>setFormData({...formData,destination:e.target.value})}
              />

            </FormField>

          </div>

          {/* Aircraft */}

          <FormField label="Aircraft" error={errors.aircraftId} required>

            <Select
              value={formData.aircraftId}
              onChange={e=>setFormData({...formData,aircraftId:e.target.value})}
            >

              <option value="">Select Aircraft</option>

              {aircraft.map(ac=>(
                <option key={ac.id} value={ac.id}>
                  {ac.registrationNumber} - {ac.model}
                </option>
              ))}

            </Select>

          </FormField>

          {/* Gate */}

          <FormField label="Gate" error={undefined} required={false}>

            <Select
              value={formData.gateNumber}
              onChange={e=>setFormData({...formData,gateNumber:e.target.value})}
            >

              <option value="">Select Gate</option>

              {Array.from(new Set([
                ...availableGates,
                ...(formData.gateNumber ? [formData.gateNumber] : [])
              ])).map(gateNumber => (
                <option key={gateNumber} value={gateNumber}>
                  {gateNumber}
                </option>
              ))}

            </Select>

          </FormField>

          {/* Departure and Arrival Times */}

          <div className="grid grid-cols-2 gap-4">

            <FormField label="Departure Time" error={errors.departureTime} required>

              <Input
                type="datetime-local"
                value={formData.departureTime}
                onChange={e=>setFormData({...formData,departureTime:e.target.value})}
              />

            </FormField>

            <FormField label="Arrival Time" error={errors.arrivalTime} required>

              <Input
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={e=>setFormData({...formData,arrivalTime:e.target.value})}
              />

            </FormField>

          </div>

          <div className="flex justify-end gap-3 pt-4">

            <Button type="button" onClick={()=>{setIsModalOpen(false);resetForm()}}>
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