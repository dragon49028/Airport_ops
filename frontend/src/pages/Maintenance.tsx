import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  PageHeader,
  Card,
  Button,
  Modal,
  FormField,
  Input,
  Select,
  StatCard,
  ErrorMessage
} from '../components/ui'
import { getMaintenance, createMaintenance, updateMaintenance, getAircraft } from '../services/api'

type IssueType =
  | 'ENGINE'
  | 'BRAKE'
  | 'HYDRAULICS'
  | 'AVIONICS'
  | 'FUSELAGE'
  | 'LANDING_GEAR'
  | 'ELECTRICAL'
  | 'PRESSURIZATION'
  | 'OTHER'

type Severity = 'MINOR' | 'MAJOR' | 'CRITICAL'

export default function MaintenancePage() {

  const [maintenance,setMaintenance] = useState<any[]>([])
  const [aircraft,setAircraft] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  const [isModalOpen,setIsModalOpen] = useState(false)
  const [editing,setEditing] = useState<any|null>(null)

  const [formData,setFormData] = useState({
    aircraftId:'',
    issueType:'OTHER' as IssueType,
    issueDescription:'',
    severity:'MINOR' as Severity,
    estimatedHours:'',
    notes:''
  })

  const [errors,setErrors] = useState<Record<string,string>>({})

  useEffect(()=>{
    fetchData()
  },[])

  const fetchData = async ()=>{
    try{
      setLoading(true)

      const [maintenanceData,aircraftData] = await Promise.all([
        getMaintenance(),
        getAircraft()
      ])

      setMaintenance(maintenanceData?.data || [])
      setAircraft(aircraftData?.data || [])

    }catch(e){
      console.error('Error fetching maintenance data',e)
    }finally{
      setLoading(false)
    }
  }

  const resetForm = ()=>{
    setFormData({
      aircraftId:'',
      issueType:'OTHER',
      issueDescription:'',
      severity:'MINOR',
      estimatedHours:'',
      notes:''
    })

    setEditing(null)
    setErrors({})
  }

  const handleSubmit = async (e:React.FormEvent)=>{
    e.preventDefault()

    const newErrors:Record<string,string> = {}

    if(!formData.aircraftId) newErrors.aircraftId = 'Aircraft is required'
    if(!formData.issueType) newErrors.issueType = 'Issue type is required'
    if(!formData.issueDescription) newErrors.issueDescription = 'Description required'
    if(!formData.severity) newErrors.severity = 'Severity required'
    if(!formData.estimatedHours) newErrors.estimatedHours = 'Estimated hours required'

    if(Object.keys(newErrors).length){
      setErrors(newErrors)
      return
    }

    try{

      const dataToSubmit = {
        ...formData,
        aircraftId:Number(formData.aircraftId),
        estimatedHours: formData.estimatedHours === ''
          ? undefined
          : Number(formData.estimatedHours)
      }

      if(editing){
        await updateMaintenance(editing.id,dataToSubmit)
      }else{
        await createMaintenance(dataToSubmit)
      }

      await fetchData()
      setIsModalOpen(false)
      resetForm()

    }catch(e){
      console.error('Error saving maintenance',e)
    }
  }

  return(
    <div className="space-y-6">

      <PageHeader
        title="Maintenance Management"
        subtitle="Track aircraft maintenance and repairs"
        actions={
          <Button onClick={()=>setIsModalOpen(true)}>
            <Plus className="inline mr-2 h-4 w-4" />
            Add Maintenance Task
          </Button>
        }
      />

      <Card>

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-200">

            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Aircraft</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Issue</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Severity</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Status</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">

              {maintenance.map((item)=>(
                <tr key={item.id}>

                  <td className="px-6 py-4">
                    {item.aircraft?.registration}
                  </td>

                  <td className="px-6 py-4">
                    {item.issueDescription}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.severity==='CRITICAL'
                        ? 'bg-red-100 text-red-800'
                        : item.severity==='MAJOR'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.severity}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {item.status}
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
        title={editing ? 'Edit Maintenance Task' : 'Add Maintenance Task'}
      >

        <form onSubmit={handleSubmit} className="space-y-4">

          <FormField label="Aircraft" required={true} error={errors.aircraftId}>
            <Select
              value={formData.aircraftId}
              onChange={(e)=>setFormData({...formData,aircraftId:e.target.value})}
            >
              <option value="">Select Aircraft</option>
              {aircraft.map((ac)=>(
                <option key={ac.id} value={ac.id}>
                  {ac.registration} - {ac.model}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Issue Type" required={true} error={errors.issueType}>
            <Select
              value={formData.issueType}
              onChange={(e)=>setFormData({...formData,issueType:e.target.value as IssueType})}
            >
              <option value="ENGINE">Engine</option>
              <option value="BRAKE">Brake</option>
              <option value="HYDRAULICS">Hydraulics</option>
              <option value="AVIONICS">Avionics</option>
              <option value="FUSELAGE">Fuselage</option>
              <option value="LANDING_GEAR">Landing Gear</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PRESSURIZATION">Pressurization</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>

          <FormField label="Issue Description" required={true} error={errors.issueDescription}>
            <textarea
              className="w-full px-3 py-2 border rounded"
              value={formData.issueDescription}
              onChange={(e)=>setFormData({...formData,issueDescription:e.target.value})}
            />
          </FormField>

          <FormField label="Severity" required={true} error={errors.severity}>
            <Select
              value={formData.severity}
              onChange={(e)=>setFormData({...formData,severity:e.target.value as Severity})}
            >
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </FormField>

          <FormField label="Estimated Hours" required={true} error={errors.estimatedHours}>
            <Input
              type="number"
              value={formData.estimatedHours}
              onChange={(e)=>setFormData({...formData,estimatedHours:e.target.value})}
              placeholder="Hours needed"
            />
          </FormField>

          <FormField label="Notes" required={false} error={undefined}>
            <textarea
              className="w-full px-3 py-2 border rounded"
              value={formData.notes}
              onChange={(e)=>setFormData({...formData,notes:e.target.value})}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" className="border border-gray-300 text-gray-700 hover:bg-gray-50" onClick={()=>{setIsModalOpen(false);resetForm()}}>
              Cancel
            </Button>

            <Button type="submit">
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>

        </form>

      </Modal>

    </div>
  )
}