import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Resource helpers ─────────────────────────────────────────────────────────
export const aircraftApi = {
  getAll:      (params) => api.get('/aircraft', { params }),
  getById:     (id)     => api.get(`/aircraft/${id}`),
  getAvailable:()       => api.get('/aircraft/available'),
  create:      (data)   => api.post('/aircraft', data),
  update:      (id, d)  => api.put(`/aircraft/${id}`, d),
  delete:      (id)     => api.delete(`/aircraft/${id}`),
}

export const flightsApi = {
  getAll:   (params) => api.get('/flights', { params }),
  getById:  (id)     => api.get(`/flights/${id}`),
  create:   (data)   => api.post('/flights', data),
  update:   (id, d)  => api.put(`/flights/${id}`, d),
  delete:   (id)     => api.delete(`/flights/${id}`),
}

export const gatesApi = {
  getAll:       (params) => api.get('/gates', { params }),
  getById:      (id)     => api.get(`/gates/${id}`),
  getAvailable: (time)   => api.get('/gates/available', { params: { time } }),
  create:       (data)   => api.post('/gates', data),
  update:       (id, d)  => api.put(`/gates/${id}`, d),
  updateStatus: (id, s)  => api.patch(`/gates/${id}/status`, { status: s }),
  delete:       (id)     => api.delete(`/gates/${id}`),
}

export const runwaysApi = {
  getAll:  (params) => api.get('/runways', { params }),
  getById: (id)     => api.get(`/runways/${id}`),
  create:  (data)   => api.post('/runways', data),
  update:  (id, d)  => api.put(`/runways/${id}`, d),
  delete:  (id)     => api.delete(`/runways/${id}`),
}

export const baggageApi = {
  getAll:       (params) => api.get('/baggage', { params }),
  getById:      (id)     => api.get(`/baggage/${id}`),
  create:       (data)   => api.post('/baggage', data),
  update:       (id, d)  => api.put(`/baggage/${id}`, d),
  updateStatus: (id, s)  => api.patch(`/baggage/${id}/status`, { status: s }),
  delete:       (id)     => api.delete(`/baggage/${id}`),
}

export const refuelApi = {
  getAll:       (params) => api.get('/refuel', { params }),
  getById:      (id)     => api.get(`/refuel/${id}`),
  create:       (data)   => api.post('/refuel', data),
  update:       (id, d)  => api.put(`/refuel/${id}`, d),
  updateStatus: (id, s)  => api.patch(`/refuel/${id}/status`, { status: s }),
  delete:       (id)     => api.delete(`/refuel/${id}`),
}

export const maintenanceApi = {
  getAll:   (params) => api.get('/maintenance', { params }),
  getById:  (id)     => api.get(`/maintenance/${id}`),
  create:   (data)   => api.post('/maintenance', data),
  update:   (id, d)  => api.put(`/maintenance/${id}`, d),
  approve:  (id, by) => api.post(`/maintenance/${id}/approve`, { approvedBy: by }),
  delete:   (id)     => api.delete(`/maintenance/${id}`),
}

export const staffApi = {
  getAll:   (params) => api.get('/staff', { params }),
  getById:  (id)     => api.get(`/staff/${id}`),
  create:   (data)   => api.post('/staff', data),
  update:   (id, d)  => api.put(`/staff/${id}`, d),
  delete:   (id)     => api.delete(`/staff/${id}`),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
}
