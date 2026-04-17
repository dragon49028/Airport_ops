// ── Enums ──────────────────────────────────────────────────────────────────────

export type AircraftStatus = 'AVAILABLE' | 'AT_GATE' | 'IN_FLIGHT' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'GROUNDED'
export type FlightStatus   = 'SCHEDULED' | 'BOARDING' | 'IN_FLIGHT' | 'ARRIVED' | 'DEPARTED' | 'DELAYED' | 'CANCELLED'
export type FlightPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY'
export type GateStatus     = 'SCHEDULED' | 'ACTIVE' | 'RELEASED' | 'CANCELLED' | 'AVAILABLE'
export type GateEntityStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
export type SlotType       = 'LANDING' | 'TAKEOFF'
export type SlotStatus     = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'WEATHER_HOLD'
export type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'FOG' | 'STORM' | 'CROSSWIND'
export type PriorityLevel  = 'NORMAL' | 'HIGH' | 'URGENT'
export type BaggageStatus  = 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'ISSUE'
export type RefuelStatus   = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type IssueType      = 'ENGINE' | 'BRAKE' | 'HYDRAULICS' | 'AVIONICS' | 'FUSELAGE' | 'LANDING_GEAR' | 'ELECTRICAL' | 'PRESSURIZATION' | 'OTHER'
export type Severity       = 'MINOR' | 'MODERATE' | 'CRITICAL'
export type ClearanceStatus = 'PENDING' | 'IN_REVIEW' | 'CLEARED' | 'GROUNDED'
export type StaffRole      = 'PILOT_COORDINATOR' | 'GATE_AGENT' | 'FUEL_TECH' | 'BAGGAGE_HANDLER' | 'MAINTENANCE_CREW' | 'RAMP_AGENT' | 'OPERATIONS_SUPERVISOR' | 'SECURITY' | 'CUSTOMS_OFFICER'
export type StaffShift     = 'DAY' | 'EVENING' | 'NIGHT'
export type StaffStatus    = 'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'OFF_DUTY'
export type UserRole       = 'ADMIN' | 'STAFF' | 'OPERATOR'

// ── Entities ──────────────────────────────────────────────────────────────────

export interface Aircraft {
  id: number
  registrationNumber: string
  model: string
  airline?: string
  capacity?: number
  status: AircraftStatus
  currentGate?: string
  lastMaintenance?: string
  nextMaintenanceDue?: string
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export interface FlightSchedule {
  id: number
  flightNumber: string
  aircraft?: Aircraft
  gate?: Gate
  origin?: string
  destination?: string
  airline?: string
  priority: FlightPriority
  departureTime?: string
  arrivalTime?: string
  scheduledArrival?: string
  scheduledDeparture?: string
  actualArrival?: string
  actualDeparture?: string
  delayMinutes: number
  status: FlightStatus
  remarks?: string
  createdAt?: string
  updatedAt?: string
}

export interface GateAssignment {
  id: number
  gateNumber: string
  flightSchedule?: Pick<FlightSchedule, 'id' | 'flightNumber' | 'origin' | 'destination'>
  assignedTime?: string
  releaseTime?: string
  expectedDuration?: number
  status: GateStatus
  notes?: string
  createdAt?: string
}

export interface RunwaySlot {
  id: number
  runwayNumber: string
  flightSchedule?: Pick<FlightSchedule, 'id' | 'flightNumber'>
  slotTime: string
  duration: number
  slotType: SlotType
  status: SlotStatus
  weatherCondition: WeatherCondition
  weatherNotes?: string
  createdAt?: string
}

export interface BaggageManifest {
  id: number
  flightSchedule?: Pick<FlightSchedule, 'id' | 'flightNumber'>
  baggageCount: number
  specialHandlingCount?: number
  specialHandlingNotes?: string
  priorityLevel: PriorityLevel
  status: BaggageStatus
  handlingTeam?: string
  notes?: string
  completedAt?: string
  updatedAt?: string
}

export interface RefuelRequest {
  id: number
  flightSchedule?: Pick<FlightSchedule, 'id' | 'flightNumber'>
  fuelQuantity: number
  fuelType: string
  requestedTime: string
  approvedTime?: string
  completedTime?: string
  status: RefuelStatus
  assignedCrew?: string
  approvedBy?: string
  rejectionReason?: string
  createdAt?: string
}

export interface MaintenanceClearance {
  id: number
  aircraft?: Pick<Aircraft, 'id' | 'registrationNumber' | 'model'>
  issueType: IssueType
  issueDescription: string
  severity: Severity
  clearanceStatus: ClearanceStatus
  approvedBy?: string
  reportedTime?: string
  clearedTime?: string
  estimatedHours?: number
  notes?: string
}

export interface GroundStaff {
  id: number
  staffId: string
  name: string
  role: StaffRole
  shift: StaffShift
  currentAssignment?: string
  status: StaffStatus
  availability?: boolean
  phone?: string
  email?: string
  certifications?: string
  createdAt?: string
}

// ── Dashboard ──────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalFlights: number
  activeFlights: number
  delayedFlights: number
  totalAircraft: number
  availableAircraft: number
  occupiedGates: number
  pendingRefuels: number
  pendingMaintenance: number
  availableStaff: number
  totalStaff: number
  criticalAlerts: number
  totalRevenue: number
  customerSatisfaction: number
}

// ── API / Pagination ───────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number        // 0-based current page
  size: number
  first: boolean
  last: boolean
}

export interface ConflictResult {
  hasConflict: boolean
  message?: string
  suggestedResources?: string[]
  suggestedTimes?: string[]
}

// ── Weather ────────────────────────────────────────────────────────────────────

export interface WeatherReport {
  condition: WeatherCondition
  description: string
  delayMinutes: number
  operationsHalted: boolean
  capacityFactor: number
  temperature: number
  windSpeedKmh: number
  visibilityKm: number
  timestamp: string
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string
  refreshToken: string
  username: string
  email: string
  role: UserRole
}

export interface User {
  username: string
  email: string
  role: UserRole
}

// ── Gate ───────────────────────────────────────────────────────────────────────

export interface Gate {
  id: number
  gateNumber: string
  terminal: string
  capacity: number
  status: GateEntityStatus
  createdAt?: string
  updatedAt?: string
}

// ── SSE Event ──────────────────────────────────────────────────────────────────

export interface SseEvent<T = unknown> {
  type: string
  data: T
  timestamp: string
}

// Aliases for UI pages

export type Flight = FlightSchedule
export type Baggage = BaggageManifest
export type Refuel = RefuelRequest
export type Maintenance = MaintenanceClearance
export type Staff = GroundStaff
export type DashboardMetrics = DashboardStats 