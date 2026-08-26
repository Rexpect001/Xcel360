'use client'

/**
 * User growth chart — isolated so recharts (~100KB gz) is code-split and only
 * downloaded when an admin opens the Users page chart, via next/dynamic.
 */
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null
  const displayLabel = mode === 'monthly'
    ? new Date(label + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : new Date(label).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2.5 text-sm">
      <p className="text-gray-500 text-xs mb-1">{displayLabel}</p>
      <p className="font-semibold text-brand-700">{payload[0].value} new user{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default function GrowthChart({
  data,
  mode,
}: {
  data: Array<{ label: string; users: number }>
  mode: 'daily' | 'monthly'
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false}
          interval={mode === 'daily' ? 4 : 0} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip mode={mode} />} />
        <Area type="monotone" dataKey="users" stroke="#0284c7" strokeWidth={2}
          fill="url(#userGradient)" dot={false} activeDot={{ r: 4, fill: '#0284c7' }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
