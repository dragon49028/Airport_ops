import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  dashboardApi,
  exportApi,
  flightsApi,
  maintenanceApi
} from "../services/api"

import { PageHeader, StatCard } from "../components/ui"
import { WeatherWidget } from "../components/WeatherWidget"
import { StatusBadge, fmt } from "../utils/helpers"

import {
  Download,
  BarChart2,
  Plane,
  Wrench,
  DollarSign,
  Clock,
  Users
} from "lucide-react"

import toast from "react-hot-toast"
import type { FlightSchedule } from "../types"

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {

  const [exporting, setExporting] = useState<string | null>(null)

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats().then(r => r.data)
  })

  const { data: flightPage } = useQuery({
    queryKey: ["flights-report"],
    queryFn: () => flightsApi.getAll({ size: 200 }).then(r => r.data)
  })

  const { data: maintenance = [] } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => maintenanceApi.getAll().then(r => r.data)
  })

  const flights: FlightSchedule[] = flightPage?.content ?? []

  const handleExport = async (type: "flights" | "staff") => {

    setExporting(type)

    try {

      const { data } =
        type === "flights"
          ? await exportApi.flightsCsv()
          : await exportApi.staffCsv()

      downloadBlob(
        data as unknown as Blob,
        `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`
      )

      toast.success(`${type} exported successfully`)

    } catch {

      toast.error("Export failed")

    } finally {

      setExporting(null)

    }

  }

  const statusBreakdown = flights.reduce(
    (acc: Record<string, number>, f: FlightSchedule) => {
      acc[f.status] = (acc[f.status] || 0) + 1
      return acc
    },
    {}
  )

  const delayed = flights.filter(
    (f: FlightSchedule) => (f.delayMinutes ?? 0) > 0
  )

  const avgDelay =
    delayed.length > 0
      ? Math.round(
          delayed.reduce(
            (s: number, f: FlightSchedule) => s + (f.delayMinutes ?? 0),
            0
          ) / delayed.length
        )
      : 0

  const criticalMaint = maintenance.filter(
    (m: any) =>
      m.severity === "CRITICAL" &&
      m.clearanceStatus !== "CLEARED"
  ).length

  const pendingMaint = maintenance.filter(
    (m: any) =>
      m.clearanceStatus === "PENDING" ||
      m.clearanceStatus === "IN_REVIEW"
  ).length

  const reportStats: React.ComponentProps<typeof StatCard>[] = [

    {
      label: "Total Revenue",
      value: stats?.totalRevenue ? `$${stats.totalRevenue.toLocaleString()}` : '$0',
      icon: DollarSign,
      color: "emerald",
      trend: 15,
      sub: "this period"
    },

    {
      label: "Average Delay",
      value: avgDelay ? `${avgDelay} min` : 0,
      icon: Clock,
      color: "amber",
      trend: -5,
      sub: "improved"
    },

    {
      label: "Completed Flights",
      value: flights.filter(f => f.status === "ARRIVED").length,
      icon: Plane,
      color: "sky",
      trend: 8,
      sub: "vs last period"
    },

    {
      label: "Customer Satisfaction",
      value: stats?.customerSatisfaction ? `${stats.customerSatisfaction.toFixed(1)}/5` : '0/5',
      icon: Users,
      color: "purple",
      trend: 3,
      sub: "rating improved"
    }

  ]

  return (

    <div className="space-y-6">

      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational insights and data export"
        actions={
          <div className="flex gap-2">

            <button
              onClick={() => handleExport("flights")}
              disabled={!!exporting}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              {exporting === "flights" ? "Exporting…" : "Flights CSV"}
            </button>

            <button
              onClick={() => handleExport("staff")}
              disabled={!!exporting}
              className="btn-secondary"
            >
              <Download className="w-4 h-4" />
              {exporting === "staff" ? "Exporting…" : "Staff CSV"}
            </button>

          </div>
        }
      />

      <WeatherWidget />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {reportStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}

      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="card">

          <div className="card-header flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-white">
              Flight Status Breakdown
            </h2>
          </div>

          <div className="p-5 space-y-3">

            {Object.entries(statusBreakdown).map(([status, count]) => {

              const pct = Math.round(
                (count / Math.max(flights.length, 1)) * 100
              )

              return (

                <div key={status}>

                  <div className="flex justify-between text-xs mb-1">

                    <StatusBadge status={status} />

                    <span className="text-gray-400 font-mono">
                      {count} ({pct}%)
                    </span>

                  </div>

                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">

                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />

                  </div>

                </div>

              )

            })}

          </div>

        </div>

        <div className="card">

          <div className="card-header flex items-center gap-2">
            <Wrench className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-semibold text-white">
              Maintenance Summary
            </h2>
          </div>

          <div className="p-5 space-y-3">

            {[
              { label: "Critical (uncleared)", value: criticalMaint },
              { label: "Pending / In Review", value: pendingMaint },
              { label: "Total Records", value: maintenance.length },
              {
                label: "Cleared",
                value: maintenance.filter((m: any) =>
                  m.clearanceStatus === "CLEARED"
                ).length
              }
            ].map(row => (

              <div
                key={row.label}
                className="flex justify-between border-b border-gray-800 pb-2"
              >

                <span className="text-sm text-gray-400">
                  {row.label}
                </span>

                <span className="font-mono font-bold text-lg text-white">
                  {row.value}
                </span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  )

}