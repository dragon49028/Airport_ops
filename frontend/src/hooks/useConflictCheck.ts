import { useState, useCallback } from 'react'
import { conflictApi } from '../services/api'
import type { ConflictResult } from '../types'

interface UseConflictCheckReturn {
  checking: boolean
  result: ConflictResult | null
  checkGate: (gate: string, start: string, end: string, excludeId?: number) => Promise<ConflictResult>
  checkRunway: (runway: string, slotTime: string, duration: number, excludeId?: number) => Promise<ConflictResult>
  clear: () => void
}

export function useConflictCheck(): UseConflictCheckReturn {
  const [checking, setChecking] = useState(false)
  const [result, setResult]     = useState<ConflictResult | null>(null)

  const checkGate = useCallback(async (gate: string, start: string, end: string, excludeId?: number) => {
    if (!gate || !start || !end) return { hasConflict: false }
    setChecking(true)
    try {
      const { data } = await conflictApi.checkGate({
        gate,
        start: new Date(start).toISOString(),
        end:   new Date(end).toISOString(),
        ...(excludeId ? { excludeId } : {}),
      })
      setResult(data)
      return data
    } finally {
      setChecking(false)
    }
  }, [])

  const checkRunway = useCallback(async (runway: string, slotTime: string, duration: number, excludeId?: number) => {
    if (!runway || !slotTime) return { hasConflict: false }
    setChecking(true)
    try {
      const { data } = await conflictApi.checkRunway({
        runway,
        slotTime: new Date(slotTime).toISOString(),
        duration,
        ...(excludeId ? { excludeId } : {}),
      })
      setResult(data)
      return data
    } finally {
      setChecking(false)
    }
  }, [])

  return { checking, result, checkGate, checkRunway, clear: () => setResult(null) }
}
