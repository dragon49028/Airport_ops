import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

type SseEventType = 'flight-update' | 'gate-update' | 'alert' | 'maintenance-update' | 'connected'

interface SseMessage {
  type: SseEventType
  data: unknown
}

export function useSse() {
  const qc = useQueryClient()
  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef(0)

  const connect = useCallback(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const es = new EventSource(`/api/sse/subscribe`)
    esRef.current = es

    es.addEventListener('connected', () => {
      retryRef.current = 0
    })

    es.addEventListener('flight-update', (e: MessageEvent) => {
      qc.invalidateQueries({ queryKey: ['flights'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    })

    es.addEventListener('gate-update', () => {
      qc.invalidateQueries({ queryKey: ['gates'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    })

    es.addEventListener('maintenance-update', () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] })
    })

    es.addEventListener('alert', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        toast(data.message || 'New alert received', {
          icon: '⚠️',
          style: { background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' },
          duration: 6000,
        })
      } catch { /* ignore parse errors */ }
    })

    es.onerror = () => {
      es.close()
      esRef.current = null
      const delay = Math.min(1000 * 2 ** retryRef.current, 30000)
      retryRef.current++
      setTimeout(connect, delay)
    }
  }, [qc])

  useEffect(() => {
    connect()
    return () => { esRef.current?.close() }
  }, [connect])
}
