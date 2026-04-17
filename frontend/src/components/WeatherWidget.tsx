import { useQuery } from '@tanstack/react-query'
import { weatherApi } from '../services/api'
import type { WeatherCondition } from '../types'
import { Cloud, Sun, CloudRain, Eye, Wind, Thermometer, AlertTriangle } from 'lucide-react'
import { cn } from '../utils/helpers'

const WEATHER_ICONS: Record<WeatherCondition, React.ReactNode> = {
  CLEAR:     <Sun className="w-5 h-5 text-yellow-400" />,
  CLOUDY:    <Cloud className="w-5 h-5 text-gray-400" />,
  RAIN:      <CloudRain className="w-5 h-5 text-blue-400" />,
  FOG:       <Cloud className="w-5 h-5 text-gray-500" />,
  STORM:     <AlertTriangle className="w-5 h-5 text-red-400" />,
  CROSSWIND: <Wind className="w-5 h-5 text-amber-400" />,
}

const WEATHER_COLORS: Record<WeatherCondition, string> = {
  CLEAR:     'border-yellow-800/30 bg-yellow-900/10',
  CLOUDY:    'border-gray-700/30 bg-gray-800/20',
  RAIN:      'border-blue-800/30 bg-blue-900/10',
  FOG:       'border-gray-600/30 bg-gray-800/30',
  STORM:     'border-red-800/40 bg-red-900/20',
  CROSSWIND: 'border-amber-800/30 bg-amber-900/10',
}

export function WeatherWidget() {
  const { data: weather } = useQuery({
    queryKey: ['weather'],
    queryFn: () => weatherApi.getCurrent().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (!weather) return null

  return (
    <div className={cn('card border px-4 py-3 flex items-center gap-4 text-sm', WEATHER_COLORS[weather.condition])}>
      <div className="flex items-center gap-2">
        {WEATHER_ICONS[weather.condition]}
        <div>
          <div className="font-medium text-white text-xs">{weather.description}</div>
          {weather.operationsHalted && (
            <div className="text-xs text-red-400 font-semibold">⛔ Ops Halted</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 border-l border-gray-700 pl-4">
        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{weather.temperature}°C</span>
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{weather.windSpeedKmh} km/h</span>
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{weather.visibilityKm} km</span>
        {weather.delayMinutes > 0 && (
          <span className="text-amber-400">+{weather.delayMinutes}min delay</span>
        )}
      </div>
    </div>
  )
}
