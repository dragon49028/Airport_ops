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
  ErrorMessage
} from '../components/ui'
import { getMaintenance, createMaintenance, updateMaintenance, getAircraft, maintenanceApi } from '../services/api'
import { StatusBadge, cn } from '../utils/helpers'

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

type Severity = 'MINOR' | 'MODERATE' | 'CRITICAL'

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

  const approveClearance = async (id: number, approvedBy: string) => {
    try {
      await maintenanceApi.approve(id, approvedBy)
      await fetchData()
    } catch (e) {
      console.error('Error approving maintenance', e)
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
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Clearance</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase text-left">Action</th>
              </tr>
            </thead>

            <tbody className="bg-gray-900/40 divide-y divide-gray-800/60 text-gray-200">

              {maintenance.map((item)=>(
                <tr key={item.id} className="hover:bg-gray-800/20 transition-colors">

                  <td className="px-6 py-4 font-mono text-indigo-300 font-semibold">
                    {item.aircraft?.registrationNumber || 'N/A'}
                  </td>

                  <td className="px-6 py-4 text-gray-300">
                    {item.issueDescription}
                  </td>

                  <td className="px-6 py-4">
                    <span className={cn('badge',
                      item.severity === 'CRITICAL'
                        ? 'bg-red-900/40 text-red-300 border border-red-800/40'
                        : item.severity === 'MODERATE'
                        ? 'bg-amber-900/40 text-amber-300 border border-amber-800/40'
                        : 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40'
                    )}>
                      {item.severity}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={item.clearanceStatus} />
                  </td>

                  <td className="px-6 py-4">
                    {item.clearanceStatus !== 'CLEARED' ? (
                      <Button type="button" onClick={() => approveClearance(item.id, 'operations')}>
                        Clear
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-500">Cleared</span>
                    )}
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
                  {ac.registrationNumber} - {ac.model}
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
              <option value="MODERATE">Moderate</option>
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