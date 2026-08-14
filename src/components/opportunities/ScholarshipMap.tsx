'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { daysUntilDeadline } from '@/lib/utils'
import type { OpportunityListItem } from '@/types/opportunity-list'

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'United Kingdom': [51.5, -0.12],
  'UK': [51.5, -0.12],
  'United States': [37.1, -95.7],
  'USA': [37.1, -95.7],
  'Canada': [56.1, -106.3],
  'Australia': [-25.3, 133.7],
  'Germany': [51.2, 10.4],
  'France': [46.2, 2.2],
  'Netherlands': [52.1, 5.3],
  'Sweden': [60.1, 18.6],
  'Norway': [60.5, 8.5],
  'Denmark': [56.3, 9.5],
  'Finland': [61.9, 25.7],
  'Switzerland': [46.8, 8.2],
  'Austria': [47.5, 14.5],
  'Belgium': [50.5, 4.5],
  'Italy': [41.9, 12.5],
  'Spain': [40.4, -3.7],
  'Portugal': [39.4, -8.2],
  'Ireland': [53.1, -8.2],
  'Japan': [36.2, 138.3],
  'South Korea': [35.9, 127.8],
  'China': [35.9, 104.2],
  'India': [20.6, 78.9],
  'Singapore': [1.35, 103.82],
  'Malaysia': [4.2, 108.0],
  'New Zealand': [-40.9, 174.9],
  'South Africa': [-28.5, 24.7],
  'Nigeria': [9.1, 8.7],
  'Ghana': [7.9, -1.0],
  'Kenya': [0.0, 37.9],
  'Ethiopia': [9.1, 40.5],
  'Tanzania': [-6.4, 34.9],
  'Uganda': [1.4, 32.3],
  'Rwanda': [-1.9, 29.9],
  'Egypt': [26.8, 30.8],
  'Morocco': [31.8, -7.1],
  'Tunisia': [33.9, 9.5],
  'Brazil': [-14.2, -51.9],
  'Mexico': [23.6, -102.6],
  'Argentina': [-38.4, -63.6],
  'Turkey': [38.9, 35.2],
  'Russia': [61.5, 105.3],
  'Global': [20, 0],
  'Multiple Countries': [20, 0],
  'Worldwide': [20, 0],
  'International': [20, 0],
}

function getCoords(country: string): [number, number] | null {
  if (!country) return null
  if (COUNTRY_COORDS[country]) return COUNTRY_COORDS[country]
  const key = Object.keys(COUNTRY_COORDS).find(
    (k) => country.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(country.toLowerCase())
  )
  return key ? COUNTRY_COORDS[key] : null
}

function getMinDays(opps: OpportunityListItem[]): number {
  return opps.reduce((min, o) => {
    const d = daysUntilDeadline(o.deadline)
    return d > 0 && d < min ? d : min
  }, Infinity)
}

function getPinColor(minDays: number): string {
  if (minDays === Infinity) return '#9ca3af'
  if (minDays <= 7) return '#ef4444'
  if (minDays <= 30) return '#f97316'
  return '#22c55e'
}

interface Props {
  opportunities: OpportunityListItem[]
}

export default function ScholarshipMap({ opportunities }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const map = L.map(mapRef.current!, {
        center: [20, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 7,
        scrollWheelZoom: true,
        zoomControl: true,
      })

      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        crossOrigin: true,
      }).addTo(map)

      // Group by country
      const groups: Record<string, OpportunityListItem[]> = {}
      opportunities.forEach((opp) => {
        const key = opp.country || 'Global'
        if (!groups[key]) groups[key] = []
        groups[key].push(opp)
      })

      Object.entries(groups).forEach(([country, opps]) => {
        const coords = getCoords(country)
        if (!coords) return

        const minDays = getMinDays(opps)
        const color = getPinColor(minDays)
        const count = opps.length

        // Cluster pin with count badge
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            position:relative;
            width:${count > 1 ? 36 : 18}px;
            height:${count > 1 ? 36 : 18}px;
            background:${color};
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-weight:700;font-size:${count > 9 ? 10 : 12}px;
            font-family:system-ui,sans-serif;
            cursor:pointer;
          ">${count > 1 ? count : ''}</div>`,
          iconSize: count > 1 ? [36, 36] : [18, 18],
          iconAnchor: count > 1 ? [18, 18] : [9, 9],
        })

        // Build popup list (max 6 shown)
        const shown = opps.slice(0, 6)
        const more = opps.length - shown.length
        const listItems = shown.map((opp) => {
          const days = daysUntilDeadline(opp.deadline)
          const badge = days <= 0
            ? `<span style="color:#9ca3af;font-size:10px;">Closed</span>`
            : days <= 7
            ? `<span style="color:#dc2626;font-size:10px;font-weight:600;">${days}d left</span>`
            : days <= 30
            ? `<span style="color:#ea580c;font-size:10px;">${days}d left</span>`
            : `<span style="color:#16a34a;font-size:10px;">${days}d left</span>`
          return `
            <a href="/opportunities/${opp.id}" style="display:block;padding:6px 0;border-bottom:1px solid #f3f4f6;text-decoration:none;">
              <div style="font-size:12px;font-weight:600;color:#111827;line-height:1.3;">${opp.title}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
                <span style="font-size:10px;color:#6b7280;">${opp.hostOrg}</span>
                ${badge}
              </div>
            </a>`
        }).join('')

        const moreText = more > 0 ? `<div style="text-align:center;padding:6px 0;font-size:11px;color:#6b7280;">+${more} more in ${country}</div>` : ''

        const popup = L.popup({ maxWidth: 280, maxHeight: 360 }).setContent(`
          <div style="font-family:system-ui,sans-serif;">
            <div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #dbeafe;">
              ${country}  -  ${count} scholarship${count > 1 ? 's' : ''}
            </div>
            ${listItems}
            ${moreText}
          </div>
        `)

        L.marker(coords, { icon }).addTo(map).bindPopup(popup)
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  }, [opportunities])

  const stats = {
    total: opportunities.length,
    countries: new Set(opportunities.map((o) => o.country)).size,
    closing: opportunities.filter((o) => { const d = daysUntilDeadline(o.deadline); return d > 0 && d <= 30 }).length,
  }

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-6 px-1 mb-3 text-sm">
        <span className="font-semibold text-brand-700">{stats.total} scholarships</span>
        <span className="text-gray-500">{stats.countries} countries</span>
        {stats.closing > 0 && <span className="text-orange-600 font-medium">{stats.closing} closing this month</span>}
        <div className="flex items-center gap-4 ml-auto text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Open</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />Closing soon</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Closing imminently</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '520px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
      </div>

      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .leaflet-popup-content {
          margin: 12px 14px !important;
          max-height: 320px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
