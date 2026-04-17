import { format, formatDistanceToNow } from 'date-fns'
import React from 'react'

export const fmt = {
  date:     (d?: string | null) => d ? format(new Date(d), 'dd MMM yyyy') : '—',
  time:     (d?: string | null) => d ? format(new Date(d), 'HH:mm') : '—',
  datetime: (d?: string | null) => d ? format(new Date(d), 'dd MMM HH:mm') : '—',
  full:     (d?: string | null) => d ? format(new Date(d), 'dd MMM yyyy HH:mm') : '—',
  relative: (d?: string | null) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—',
  iso:      (d?: string | null) => d ? format(new Date(d), "yyyy-MM-dd'T'HH:mm") : '',
}

export const STATUS_COLORS: Record<string, string> = {
  SCHEDULED:    'bg-blue-900/40 text-blue-300 border border-blue-800/40',
  BOARDING:     'bg-purple-900/40 text-purple-300 border border-purple-800/40',
  IN_FLIGHT:    'bg-sky-900/40 text-sky-300 border border-sky-800/40',
  ARRIVED:      'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40',
  DEPARTED:     'bg-teal-900/40 text-teal-300 border border-teal-800/40',
  DELAYED:      'bg-amber-900/40 text-amber-300 border border-amber-800/40',
  CANCELLED:    'bg-red-900/40 text-red-300 border border-red-800/40',
  AVAILABLE:    'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40',
  AT_GATE:      'bg-blue-900/40 text-blue-300 border border-blue-800/40',
  MAINTENANCE:  'bg-amber-900/40 text-amber-300 border border-amber-800/40',
  GROUNDED:     'bg-red-900/40 text-red-300 border border-red-800/40',
  OUT_OF_SERVICE:'bg-gray-800/60 text-gray-500 border border-gray-700/40',
  ACTIVE:       'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40',
  RELEASED:     'bg-gray-800/60 text-gray-400 border border-gray-700/40',
  COMPLETED:    'bg-gray-800/60 text-gray-400 border border-gray-700/40',
  IN_PROGRESS:  'bg-indigo-900/40 text-indigo-300 border border-indigo-800/40',
  PENDING:      'bg-amber-900/40 text-amber-300 border border-amber-800/40',
  APPROVED:     'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40',
  REJECTED:     'bg-red-900/40 text-red-300 border border-red-800/40',
  DELIVERED:    'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40',
  ISSUE:        'bg-red-900/40 text-red-300 border border-red-800/40',
  IN_REVIEW:    'bg-purple-900/40 text-purple-300 border border-purple-800/40',
  CLEARED:      'bg-emerald-900/40 text-emerald-300 border border-emerald-800/40',
  BUSY:         'bg-orange-900/40 text-orange-300 border border-orange-800/40',
  ON_BREAK:     'bg-yellow-900/40 text-yellow-300 border border-yellow-800/40',
  OFF_DUTY:     'bg-gray-800/60 text-gray-400 border border-gray-700/40',
  WEATHER_HOLD: 'bg-blue-900/40 text-blue-300 border border-blue-800/40',
}

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || 'bg-gray-800 text-gray-400'
  return <span className={`badge ${cls}`}>{status?.replace(/_/g, ' ')}</span>
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const SEVERITY_COLORS: Record<string, string> = {
  MINOR: 'text-blue-400', MODERATE: 'text-amber-400', CRITICAL: 'text-red-400',
}
export const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-500', NORMAL: 'text-gray-400', HIGH: 'text-amber-400', EMERGENCY: 'text-red-400',
}
