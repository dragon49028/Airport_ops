import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'OPERATOR']).default('OPERATOR'),
})

export const aircraftSchema = z.object({
  registrationNumber: z.string().min(2).max(20, 'Max 20 characters'),
  model: z.string().min(2).max(100),
  airline: z.string().max(100).optional(),
  capacity: z.coerce.number().int().positive().optional().or(z.literal('')),
  status: z.enum(['AVAILABLE', 'AT_GATE', 'IN_FLIGHT', 'MAINTENANCE', 'OUT_OF_SERVICE', 'GROUNDED']),
  currentGate: z.string().max(10).optional().or(z.literal('')),
  lastMaintenance: z.string().optional().or(z.literal('')),
})

export const flightSchema = z.object({
  flightNumber: z.string().min(2).max(20),
  aircraftId: z.coerce.number().optional().or(z.literal('')),
  origin: z.string().length(3, 'Use 3-letter IATA code').toUpperCase().or(z.string().max(10)),
  destination: z.string().length(3, 'Use 3-letter IATA code').toUpperCase().or(z.string().max(10)),
  airline: z.string().max(100).optional().or(z.literal('')),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'EMERGENCY']).default('NORMAL'),
  scheduledArrival: z.string().optional().or(z.literal('')),
  scheduledDeparture: z.string().optional().or(z.literal('')),
  status: z.enum(['SCHEDULED', 'BOARDING', 'IN_FLIGHT', 'ARRIVED', 'DEPARTED', 'DELAYED', 'CANCELLED']).default('SCHEDULED'),
  remarks: z.string().max(500).optional().or(z.literal('')),
})

export const gateSchema = z.object({
  gateNumber: z.string().min(1, 'Gate is required'),
  flightScheduleId: z.coerce.number().optional().or(z.literal('')),
  assignedTime: z.string().optional().or(z.literal('')),
  releaseTime: z.string().optional().or(z.literal('')),
  expectedDuration: z.coerce.number().int().positive().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
}).refine(data => {
  if (data.assignedTime && data.releaseTime) {
    return new Date(data.releaseTime) > new Date(data.assignedTime)
  }
  return true
}, { message: 'Release time must be after assigned time', path: ['releaseTime'] })

export const runwaySchema = z.object({
  runwayNumber: z.string().min(1, 'Runway is required'),
  flightScheduleId: z.coerce.number().optional().or(z.literal('')),
  slotTime: z.string().min(1, 'Slot time is required'),
  duration: z.coerce.number().int().min(5).max(120).default(30),
  slotType: z.enum(['LANDING', 'TAKEOFF']).default('LANDING'),
  weatherCondition: z.enum(['CLEAR', 'CLOUDY', 'RAIN', 'FOG', 'STORM', 'CROSSWIND']).default('CLEAR'),
})

export const baggageSchema = z.object({
  flightScheduleId: z.coerce.number().min(1, 'Flight is required'),
  baggageCount: z.coerce.number().int().min(0),
  specialHandlingCount: z.coerce.number().int().min(0).default(0),
  specialHandlingNotes: z.string().max(500).optional().or(z.literal('')),
  priorityLevel: z.enum(['NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  handlingTeam: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const refuelSchema = z.object({
  flightScheduleId: z.coerce.number().min(1, 'Flight is required'),
  fuelQuantity: z.coerce.number().positive('Must be > 0'),
  fuelType: z.string().default('JET_A1'),
  requestedTime: z.string().min(1, 'Time is required'),
  assignedCrew: z.string().max(100).optional().or(z.literal('')),
})

export const maintenanceSchema = z.object({
  aircraftId: z.coerce.number().min(1, 'Aircraft is required'),
  issueType: z.enum(['ENGINE','BRAKE','HYDRAULICS','AVIONICS','FUSELAGE','LANDING_GEAR','ELECTRICAL','PRESSURIZATION','OTHER']),
  issueDescription: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  severity: z.enum(['MINOR', 'MODERATE', 'CRITICAL']).default('MINOR'),
  estimatedHours: z.coerce.number().int().positive().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const staffSchema = z.object({
  staffId: z.string().min(2).max(20),
  name: z.string().min(2).max(100),
  role: z.enum(['PILOT_COORDINATOR','GATE_AGENT','FUEL_TECH','BAGGAGE_HANDLER','MAINTENANCE_CREW','RAMP_AGENT','OPERATIONS_SUPERVISOR','SECURITY','CUSTOMS_OFFICER']),
  shift: z.enum(['DAY', 'EVENING', 'NIGHT']).default('DAY'),
  currentAssignment: z.string().max(200).optional().or(z.literal('')),
  status: z.enum(['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY']).default('AVAILABLE'),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  certifications: z.string().max(500).optional().or(z.literal('')),
})

export type LoginInput        = z.infer<typeof loginSchema>
export type RegisterInput     = z.infer<typeof registerSchema>
export type AircraftInput     = z.infer<typeof aircraftSchema>
export type FlightInput       = z.infer<typeof flightSchema>
export type GateInput         = z.infer<typeof gateSchema>
export type RunwayInput       = z.infer<typeof runwaySchema>
export type BaggageInput      = z.infer<typeof baggageSchema>
export type RefuelInput       = z.infer<typeof refuelSchema>
export type MaintenanceInput  = z.infer<typeof maintenanceSchema>
export type StaffInput        = z.infer<typeof staffSchema>
