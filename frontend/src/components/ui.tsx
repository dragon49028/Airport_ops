import { useState, useEffect, ReactNode } from 'react'
import { Search, X, ChevronUp, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '../utils/helpers'

/* ───────────────── Spinner ───────────────── */

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={cn('animate-spin text-indigo-400', sizes[size], className)} />
  )
}

/* ───────────────── PageLoader ───────────────── */

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner size="lg" className="animate-spin" />
    </div>
  )
}

/* ───────────────── ErrorMessage ───────────────── */

type ErrorMessageProps = {
  message?: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-red-400">
      <AlertCircle className="w-8 h-8" />
      <p className="text-sm">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Retry
        </button>
      )}
    </div>
  )
}

/* ───────────────── Modal ───────────────── */

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {

  const sizes: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl'
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) document.addEventListener('keydown', handler)

    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl',
          'animate-slide-in overflow-hidden',
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-display font-semibold text-lg text-white">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>

      </div>
    </div>
  )
}

/* ───────────────── ConfirmDialog ───────────────── */

type ConfirmDialogProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  danger
}: ConfirmDialogProps) {

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">

      <p className="text-gray-400 text-sm mb-6">
        {message}
      </p>

      <div className="flex gap-3 justify-end">

        <button onClick={onClose} className="btn-secondary">
          Cancel
        </button>

        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          Confirm
        </button>

      </div>

    </Modal>
  )
}

/* ───────────────── SearchInput ───────────────── */

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className
}: SearchInputProps) {

  return (
    <div className={cn('relative', className)}>

      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

      <input
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-9"
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
        </button>
      )}

    </div>
  )
}

/* ───────────────── DataTable ───────────────── */

type Column = {
  key: string
  label: string
  sortable?: boolean
  className?: string
  cellClass?: string
  render?: (row: any) => ReactNode
}

type DataTableProps = {
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyMessage?: string
}

export function DataTable({
  columns,
  data,
  loading,
  emptyMessage = 'No records found'
}: DataTableProps) {

  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey] ?? ''
        const bv = b[sortKey] ?? ''
        const cmp = String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  return (
    <div className="overflow-x-auto">

      <table className="w-full text-sm">

        <thead>
          <tr className="border-b border-gray-800">

            {columns.map(col => (

              <th
                key={col.key}
                onClick={() =>
                  col.sortable !== false && handleSort(col.key)
                }
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  col.sortable !== false &&
                    'cursor-pointer hover:text-gray-300 select-none',
                  col.className
                )}
              >

                <span className="inline-flex items-center gap-1">
                  {col.label}

                  {col.sortable !== false && sortKey === col.key && (
                    sortDir === 'asc'
                      ? <ChevronUp className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />
                  )}

                </span>

              </th>

            ))}

          </tr>
        </thead>

        <tbody>

          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <Spinner className="mx-auto" />
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-gray-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={row.id ?? i} className="table-row">

                {columns.map(col => (
                  <td key={col.key} className={cn('px-4 py-3', col.cellClass)}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}

              </tr>
            ))
          )}

        </tbody>

      </table>

    </div>
  )
}

/* ───────────────── FormField ───────────────── */

type FormFieldProps = {
  label: string
  error?: string
  children: ReactNode
  required?: boolean
}

export function FormField({
  label,
  error,
  children,
  required
}: FormFieldProps) {

  return (
    <div>

      <label className="label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {children}

      {error && (
        <p className="text-xs text-red-400 mt-1">
          {error}
        </p>
      )}

    </div>
  )
}

/* ───────────────── StatCard ───────────────── */

type StatCardProps = {
  label: string
  value?: string | number
  icon: any
  color?: keyof typeof colors
  trend?: number
  sub?: string
}

const colors = {
  indigo: 'bg-indigo-500/10 text-indigo-400',
  emerald: 'bg-emerald-500/10 text-emerald-400',
  amber: 'bg-amber-500/10 text-amber-400',
  red: 'bg-red-500/10 text-red-400',
  sky: 'bg-sky-500/10 text-sky-400',
  purple: 'bg-purple-500/10 text-purple-400',
  rose: 'bg-rose-500/10 text-rose-400',
  teal: 'bg-teal-500/10 text-teal-400'
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'indigo',
  trend,
  sub
}: StatCardProps) {

  return (
    <div className="stat-card">

      <div className="flex items-start justify-between">

        <div className={cn('p-2.5 rounded-xl', colors[color])}>
          <Icon className="w-5 h-5" />
        </div>

        {trend !== undefined && (
          <span
            className={cn(
              'text-xs font-medium',
              trend >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}

      </div>

      <div>

        <div className="text-2xl font-display font-bold text-white">
          {value ?? '—'}
        </div>

        <div className="text-xs text-gray-500 mt-0.5">
          {label}
        </div>

        {sub && (
          <div className="text-xs text-gray-600 mt-0.5">
            {sub}
          </div>
        )}

      </div>

    </div>
  )
}

/* ───────────────── PageHeader ───────────────── */

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({
  title,
  subtitle,
  actions
}: PageHeaderProps) {

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

      <div>
        <h1 className="text-2xl font-display font-bold text-white">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}

    </div>
  )
}

/* ───────────────── EmptyState ───────────────── */

type EmptyStateProps = {
  icon?: any
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">

      {Icon && <Icon className="w-10 h-10 text-gray-700 mb-3" />}

      <p className="text-gray-400 font-medium">
        {title}
      </p>

      {description && (
        <p className="text-gray-600 text-sm mt-1">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}

    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)}>
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  type = "button",
  className
}: {
  children: React.ReactNode
  onClick?: () => void
  type?: "button" | "submit"
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn("btn-primary", className)}
    >
      {children}
    </button>
  )
}

export function Input({
  value,
  onChange,
  type = "text",
  placeholder
}: {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input"
    />
  )
}

export function Select({
  value,
  onChange,
  children
}: {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  children: React.ReactNode
}) {
  return (
    <select value={value} onChange={onChange} className="input">
      {children}
    </select>
  )
}

