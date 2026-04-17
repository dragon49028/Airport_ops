import React, { useState, useEffect } from "react"
import {
  Plane,
  Clock,
  PlaneTakeoff,
  Users,
  Package,
  UserCheck,
  DoorOpen,
  DollarSign,
  Fuel,
  Wrench
} from "lucide-react"

import {
  PageHeader,
  Card,
  StatCard,
  ErrorMessage
} from "../components/ui"

import { getFlights, getMetrics } from "../services/api"

import type {
  FlightSchedule,
  DashboardStats
} from "../types"

export default function Dashboard() {

  const [metrics, setMetrics] = useState<DashboardStats | null>(null)
  const [flights, setFlights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {

    try {

      setLoading(true)
      setError(null)

      const [metricsRes, flightsRes] = await Promise.all([
        getMetrics(),
        getFlights({ page: 0, size: 10 })
      ])

      setMetrics(metricsRes?.data || metricsRes)
      setFlights(flightsRes?.data || flightsRes)

    } catch (err: any) {

      setError(err.message || "Failed to load dashboard data")

    } finally {

      setLoading(false)

    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  const stats: React.ComponentProps<typeof StatCard>[] = [

    {
      label: "Total Flights",
      value: metrics?.totalFlights,
      icon: Plane,
      color: "sky",
      trend: 5,
      sub: "vs last month"
    },

    {
      label: "On-Time Performance",
      value: (metrics as any)?.onTimePerformance,
      icon: Clock,
      color: "emerald",
      trend: 2,
      sub: "improvement"
    },

    {
      label: "Active Aircraft",
      value: (metrics as any)?.activeAircraft,
      icon: PlaneTakeoff,
      color: "purple",
      trend: 0,
      sub: "stable"
    },

    {
      label: "Total Passengers",
      value: (metrics as any)?.totalPassengers,
      icon: Users,
      color: "indigo",
      trend: 12,
      sub: "vs last month"
    },

    {
      label: "Baggage Handled",
      value: (metrics as any)?.baggageHandled,
      icon: Package,
      color: "rose",
      trend: 8,
      sub: "efficiency up"
    },

    {
      label: "Staff On Duty",
      value: (metrics as any)?.staffOnDuty,
      icon: UserCheck,
      color: "teal",
      trend: 3,
      sub: "current shift"
    },

    {
      label: "Gate Utilization",
      value: (metrics as any)?.gateUtilization,
      icon: DoorOpen,
      color: "amber",
      trend: 15,
      sub: "peak hours"
    },

    {
      label: "Revenue Today",
      value: (metrics as any)?.revenueToday,
      icon: DollarSign,
      color: "emerald",
      trend: 10,
      sub: "USD"
    },

    {
      label: "Fuel Consumption",
      value: (metrics as any)?.fuelConsumption,
      icon: Fuel,
      color: "amber",
      trend: -3,
      sub: "optimization"
    },

    {
      label: "Maintenance Tasks",
      value: (metrics as any)?.maintenanceTasks,
      icon: Wrench,
      color: "purple",
      trend: 5,
      sub: "scheduled"
    }

  ]

  const recentFlights: FlightSchedule[] =
    flights?.content?.length > 0 ? flights.content : []

  return (

    <div className="space-y-6">

      <PageHeader
        title="Dashboard"
        subtitle="Overview of airport operations"
        actions={<></>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}

      </div>

      <Card>

        <h3 className="text-lg font-semibold mb-4">
          Recent Flights
        </h3>

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-200">

            <thead className="bg-gray-50">

              <tr>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Flight
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Route
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Departure
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>

              </tr>

            </thead>

            <tbody className="bg-white divide-y divide-gray-200">

              {recentFlights.length === 0 ? (

                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No recent flights
                  </td>
                </tr>

              ) : (

                recentFlights.slice(0, 5).map((f: any) => (

                  <tr key={f.id}>

                    <td className="px-6 py-4 whitespace-nowrap">

                      <div className="flex items-center">
                        <Plane className="h-5 w-5 text-gray-400 mr-2" />
                        {f.flightNumber}
                      </div>

                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {f.origin} → {f.destination}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(f.departureTime).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">

                      <span
                        className={`px-2 inline-flex text-xs font-semibold rounded-full
                        ${
                          f.status === "ON_TIME"
                            ? "bg-green-100 text-green-800"
                            : f.status === "DELAYED"
                            ? "bg-yellow-100 text-yellow-800"
                            : f.status === "CANCELLED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {f.status}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </Card>

    </div>

  )

}