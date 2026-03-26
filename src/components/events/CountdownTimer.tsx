'use client'
import { useState, useEffect } from 'react'

interface Props {
  targetDate: string | Date
  className?: string
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calc(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export default function CountdownTimer({ targetDate, className = '' }: Props) {
  const target = new Date(targetDate)
  const [time, setTime] = useState<TimeLeft>(calc(target))

  useEffect(() => {
    const id = setInterval(() => setTime(calc(target)), 1000)
    return () => clearInterval(id)
  }, [target.getTime()])

  const units = [
    { label: 'Days', value: time.days },
    { label: 'Hrs', value: time.hours },
    { label: 'Min', value: time.minutes },
    { label: 'Sec', value: time.seconds },
  ]

  const allZero = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0

  if (allZero) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[44px] text-center">
            <span className="text-xl font-bold text-white tabular-nums leading-none">
              {String(value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] font-medium text-white/70 mt-1 uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  )
}

// Compact version for cards
export function CountdownBadge({ targetDate }: { targetDate: string | Date }) {
  const target = new Date(targetDate)
  const [time, setTime] = useState<TimeLeft>(calc(target))

  useEffect(() => {
    const id = setInterval(() => setTime(calc(target)), 1000)
    return () => clearInterval(id)
  }, [target.getTime()])

  const allZero = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0
  if (allZero) return null

  const text = time.days > 0
    ? `${time.days}d ${time.hours}h left`
    : time.hours > 0
    ? `${time.hours}h ${time.minutes}m left`
    : `${time.minutes}m ${time.seconds}s left`

  const urgent = time.days === 0 && time.hours < 24

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${urgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-50 text-amber-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${urgent ? 'bg-red-500' : 'bg-amber-500'}`} />
      {text}
    </span>
  )
}
