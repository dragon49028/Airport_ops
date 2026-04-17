import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError
} from "axios"

import type {
  Page,
  AuthResponse,
  Aircraft,
  FlightSchedule,
  Gate,
  GateAssignment,
  RunwaySlot,
  BaggageManifest,
  RefuelRequest,
  MaintenanceClearance,
  GroundStaff,
  DashboardStats,
  WeatherReport,
  ConflictResult,
  FlightStatus,
  GateStatus,
  RefuelStatus,
  BaggageStatus
} from "../types"

/* ───────────────── Axios Instance ───────────────── */

const api: AxiosInstance = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" }
})

/* ───────────────── Request Interceptor ───────────────── */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token")

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ───────────────── Refresh Token Logic ───────────────── */

let isRefreshing = false

type QueueItem = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(p => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
  })

  failedQueue = []
}

/* ───────────────── Response Interceptor ───────────────── */

api.interceptors.response.use(
  res => res,

  async (err: AxiosError) => {

    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const url = original?.url ?? ""
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh")

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {

      const refreshToken = localStorage.getItem("refreshToken")

      if (!refreshToken) {
        window.location.href = "/login"
        return Promise.reject(err)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {

          if (original.headers) {
            original.headers.Authorization = `Bearer ${token}`
          }

          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {

        const { data } = await axios.post<AuthResponse>(
          "/api/auth/refresh",
          { refreshToken }
        )

        localStorage.setItem("token", data.token)
        localStorage.setItem("refreshToken", data.refreshToken)

        api.defaults.headers.common.Authorization = `Bearer ${data.token}`

        processQueue(null, data.token)

        if (original.headers) {
          original.headers.Authorization = `Bearer ${data.token}`
        }

        return api(original)

      } catch (refreshErr) {

        processQueue(refreshErr, null)

        localStorage.clear()
        window.location.href = "/login"

        return Promise.reject(refreshErr)

      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

export default api

/* ───────────────── Aircraft API ───────────────── */

export const aircraftApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<Aircraft[]>("/aircraft", { params }),

  getById: (id: number) =>
    api.get<Aircraft>(`/aircraft/${id}`),

  getAvailable: () =>
    api.get<Aircraft[]>("/aircraft/available"),

  create: (data: unknown) =>
    api.post<Aircraft>("/aircraft", data),

  update: (id: number, data: unknown) =>
    api.put<Aircraft>(`/aircraft/${id}`, data),

  delete: (id: number) =>
    api.delete(`/aircraft/${id}`)
}

/* ───────────────── Flights API ───────────────── */

export const flightsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<Page<FlightSchedule>>("/flights", { params }),

  getActive: () =>
    api.get<FlightSchedule[]>("/flights/active"),

  getById: (id: number) =>
    api.get<FlightSchedule>(`/flights/${id}`),

  create: (data: unknown) =>
    api.post<FlightSchedule>("/flights", data),

  update: (id: number, data: unknown) =>
    api.put<FlightSchedule>(`/flights/${id}`, data),

  bulkStatus: (ids: number[], status: FlightStatus) =>
    api.post<FlightSchedule[]>("/flights/bulk-status", { ids, status }),

  delete: (id: number) =>
    api.delete(`/flights/${id}`)
}

/* ───────────────── Gates API ───────────────── */

export const gatesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<Gate[]>("/gates", { params }),

  getById: (id: number) =>
    api.get<Gate>(`/gates/${id}`),

  getAvailable: (time?: string) =>
    api.get<string[]>("/gates/available", { params: { time } }),

  create: (data: unknown) =>
    api.post<Gate>("/gates", data),

  update: (id: number, data: unknown) =>
    api.put<Gate>(`/gates/${id}`, data),

  updateStatus: (id: number, status: GateStatus) =>
    api.patch<Gate>(`/gates/${id}/status`, { status }),

  delete: (id: number) =>
    api.delete(`/gates/${id}`)
}

/* ───────────────── Runways API ───────────────── */

export const runwaysApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<RunwaySlot[]>("/runways", { params }),

  getById: (id: number) =>
    api.get<RunwaySlot>(`/runways/${id}`),

  create: (data: unknown) =>
    api.post<RunwaySlot>("/runways", data),

  update: (id: number, data: unknown) =>
    api.put<RunwaySlot>(`/runways/${id}`, data),

  delete: (id: number) =>
    api.delete(`/runways/${id}`)
}

/* ───────────────── Baggage API ───────────────── */

export const baggageApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<BaggageManifest[]>("/baggage", { params }),

  getById: (id: number) =>
    api.get<BaggageManifest>(`/baggage/${id}`),

  create: (data: unknown) =>
    api.post<BaggageManifest>("/baggage", data),

  update: (id: number, data: unknown) =>
    api.put<BaggageManifest>(`/baggage/${id}`, data),

  updateStatus: (id: number, status: BaggageStatus) =>
    api.patch<BaggageManifest>(`/baggage/${id}/status`, { status }),

  delete: (id: number) =>
    api.delete(`/baggage/${id}`)
}

/* ───────────────── Refuel API ───────────────── */

export const refuelApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<RefuelRequest[]>("/refuel", { params }),

  getById: (id: number) =>
    api.get<RefuelRequest>(`/refuel/${id}`),

  create: (data: unknown) =>
    api.post<RefuelRequest>("/refuel", data),

  update: (id: number, data: unknown) =>
    api.put<RefuelRequest>(`/refuel/${id}`, data),

  updateStatus: (id: number, status: RefuelStatus) =>
    api.patch<RefuelRequest>(`/refuel/${id}/status`, { status }),

  delete: (id: number) =>
    api.delete(`/refuel/${id}`)
}

/* ───────────────── Maintenance API ───────────────── */

export const maintenanceApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<MaintenanceClearance[]>("/maintenance", { params }),

  getById: (id: number) =>
    api.get<MaintenanceClearance>(`/maintenance/${id}`),

  create: (data: unknown) =>
    api.post<MaintenanceClearance>("/maintenance", data),

  update: (id: number, data: unknown) =>
    api.put<MaintenanceClearance>(`/maintenance/${id}`, data),

  approve: (id: number, approvedBy: string) =>
    api.post<MaintenanceClearance>(`/maintenance/${id}/approve`, { approvedBy }),

  delete: (id: number) =>
    api.delete(`/maintenance/${id}`)
}

/* ───────────────── Staff API ───────────────── */

export const staffApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<GroundStaff[]>("/staff", { params }),

  getById: (id: number) =>
    api.get<GroundStaff>(`/staff/${id}`),

  create: (data: unknown) =>
    api.post<GroundStaff>("/staff", data),

  update: (id: number, data: unknown) =>
    api.put<GroundStaff>(`/staff/${id}`, data),

  delete: (id: number) =>
    api.delete(`/staff/${id}`)
}

/* ───────────────── Other APIs ───────────────── */

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/dashboard/stats")
}

export const weatherApi = {
  getCurrent: () => api.get<WeatherReport>("/weather/current")
}

export const conflictApi = {
  checkGate: (params: Record<string, unknown>) =>
    api.get<ConflictResult>("/conflicts/gate", { params }),

  checkRunway: (params: Record<string, unknown>) =>
    api.get<ConflictResult>("/conflicts/runway", { params })
}

export const exportApi = {
  flightsCsv: () =>
    api.get<Blob>("/export/flights/csv", { responseType: "blob" }),

  staffCsv: () =>
    api.get<Blob>("/export/staff/csv", { responseType: "blob" })
}

export const getFlights = flightsApi.getAll
export const getAircraft = aircraftApi.getAll
export const getGates = gatesApi.getAll
export const getRunways = runwaysApi.getAll
export const getMetrics = dashboardApi.getStats
export const getMaintenance = maintenanceApi.getAll
export const createMaintenance = maintenanceApi.create
export const updateMaintenance = maintenanceApi.update

export const createGate = gatesApi.create
export const updateGate = gatesApi.update
export const deleteGate = gatesApi.delete

export const createFlight = flightsApi.create
export const updateFlight = flightsApi.update
export const deleteFlight = flightsApi.delete

