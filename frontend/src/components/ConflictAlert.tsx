import type { ConflictResult } from '../types'
import { AlertTriangle, CheckCircle, Clock, MapPin, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ConflictAlertProps {
  result: ConflictResult | null
  checking: boolean
  onSelectResource?: (resource: string) => void
  onSelectTime?: (time: string) => void
}

export function ConflictAlert({ result, checking, onSelectResource, onSelectTime }: ConflictAlertProps) {
  if (checking) {
    return (
      <div className="flex items-center gap-2 text-xs text-indigo-400 mt-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Checking for conflicts…
      </div>
    )
  }

  if (!result) return null

  if (!result.hasConflict) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400 mt-2">
        <CheckCircle className="w-3.5 h-3.5" />
        No conflicts detected
      </div>
    )
  }

  return (
    <div className="mt-3 p-3 bg-red-900/20 border border-red-700/40 rounded-xl space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-300">{result.message}</p>
      </div>

      {result.suggestedResources && result.suggestedResources.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Suggested alternatives:
          </p>
          <div className="flex flex-wrap gap-2">
            {result.suggestedResources.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => onSelectResource?.(r)}
                className="px-2.5 py-1 text-xs font-mono bg-indigo-900/40 hover:bg-indigo-800/50
                           border border-indigo-700/40 rounded-lg text-indigo-300 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {result.suggestedTimes && result.suggestedTimes.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Alternative time slots:
          </p>
          <div className="flex flex-wrap gap-2">
            {result.suggestedTimes.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => onSelectTime?.(t)}
                className="px-2.5 py-1 text-xs font-mono bg-amber-900/30 hover:bg-amber-800/40
                           border border-amber-700/40 rounded-lg text-amber-300 transition-colors"
              >
                {format(new Date(t), 'MMM dd HH:mm')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
