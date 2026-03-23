'use client'
import { useEffect, useRef } from 'react'
import { Opportunity } from '@prisma/client'
import { daysUntilDeadline } from '@/lib/utils'
import Link from 'next/link'

// Country → approximate lat/lng
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'United Kingdom': [51.5, -0.12],
  'United States': [38.9, -77.0],
  'USA': [38.9, -77.0],
  'Canada': [45.4, -75.7],
  'Australia': [-25.3, 133.7],
  'Germany': [52.5, 13.4],
  'France': [48.85, 2.35],
  'Netherlands': [52.37, 4.9],
  'Sweden': [59.3, 18.07],
  'Norway': [59.9, 10.75],
  'Denmark': [55.67, 12.56],
  'Finland': [60.17, 24.94],
  'Switzerland': [46.95, 7.45],
  'Austria': [48.2, 16.37],
  'Belgium': [50.85, 4.35],
  'Italy': [41.9, 12.5],
  'Spain': [40.42, -3.7],
  'Portugal': [38.72, -9.14],
  'Ireland': [53.33, -6.25],
  'Japan': [35.69, 139.69],
  'South Korea': [37.57, 126.98],
  'China': [39.91, 116.39],
  'India': [28.6, 77.2],
  'Singapore': [1.35, 103.82],
  'Malaysia': [3.15, 101.7],
  'New Zealand': [-41.29, 174.78],
  'South Africa': [-25.74, 28.19],
  'Nigeria': [9.05, 7.49],
  'Ghana': [5.56, -0.2],
  'Kenya': [-1.29, 36.82],
  'Ethiopia': [9.02, 38.75],
  'Tanzania': [-6.79, 39.2],
  'Uganda': [0.32, 32.58],
  'Rwanda': [-1.94, 30.06],
  'Egypt': [30.06, 31.25],
  'Morocco': [34.02, -6.84],
  'Tunisia': [36.82, 10.18],
  'Brazil': [-15.78, -47.93],
  'Mexico': [19.43, -99.13],
  'Argentina': [-34.6, -58.38],
  'Turkey': [39.93, 32.86],
  'Russia': [55.75, 37.62],
  'Global': [20, 0],
  'Multiple Countries': [20, 0],
  'Worldwide': [20, 0],
}

function getCoords(country: string): [number, number] | null {
  if (!country) return null
  // Direct match
  if (COUNTRY_COORDS[country]) return COUNTRY_COORDS[country]
  // Partial match
  const key = Object.keys(COUNTRY_COORDS).find(
    (k) => country.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(country.toLowerCase())
  )
  return key ? COUNTRY_COORDS[key] : null
}

function getDotColor(days: number): string {
  if (days <= 0) return '#9ca3af'   // gray — closed
  if (days <= 7) return '#ef4444'   // red — closing very soon
  if (days <= 30) return '#f97316'  // orange — closing soon
  return '#22c55e'                  // green — open
}

interface Props {
  opportunities: Opportunity[]
}

export default function ScholarshipMap({ opportunities }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<ReturnType<typeof import('leaflet')['map']> | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamically import leaflet (client-only)
    import('leaflet').then((L) => {
      // Fix default icon path for Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [20, 10],
        zoom: 2,
        minZoom: 2,
        maxZoom: 8,
        scrollWheelZoom: true,
        zoomControl: true,
      })

      mapInstanceRef.current = map

      // OpenStreetMap tiles — free, no API key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      // Group opportunities by country to slightly offset overlapping pins
      const countryGroups: Record<string, Opportunity[]> = {}
      opportunities.forEach((opp) => {
        const key = opp.country || 'Global'
        if (!countryGroups[key]) countryGroups[key] = []
        countryGroups[key].push(opp)
      })

      Object.entries(countryGroups).forEach(([country, opps]) => {
        const base = getCoords(country)
        if (!base) return

        opps.forEach((opp, i) => {
          const days = daysUntilDeadline(opp.deadline)
          const color = getDotColor(days)

          // Slightly offset multiple pins in same country
          const offset = opps.length > 1 ? (i - (opps.length - 1) / 2) * 0.8 : 0
          const lat = base[0] + offset * 0.5
          const lng = base[1] + offset

          const dot = L.divIcon({
            className: '',
            html: `<div style="
              width:14px;height:14px;border-radius:50%;
              background:${color};
              border:2px solid white;
              box-shadow:0 1px 4px rgba(0,0,0,0.35);
              cursor:pointer;
            "></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          })

          const deadlineText = days > 0 ? `${days} days left` : 'Closed'
          const urgencyBadge = days <= 0
            ? `<span style="background:#f3f4f6;color:#6b7280;padding:1px 6px;border-radius:999px;font-size:11px;">Closed</span>`
            : days <= 7
            ? `<span style="background:#fee2e2;color:#dc2626;padding:1px 6px;border-radius:999px;font-size:11px;">⚠ ${deadlineText}</span>`
            : days <= 30
            ? `<span style="background:#ffedd5;color:#ea580c;padding:1px 6px;border-radius:999px;font-size:11px;">${deadlineText}</span>`
            : `<span style="background:#dcfce7;color:#16a34a;padding:1px 6px;border-radius:999px;font-size:11px;">${deadlineText}</span>`

          const popup = L.popup({ maxWidth: 260, className: 'scholarship-popup' }).setContent(`
            <div style="font-family:system-ui,sans-serif;padding:4px 2px;">
              <div style="font-size:13px;font-weight:600;color:#111827;line-height:1.3;margin-bottom:4px;">${opp.title}</div>
              <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">${opp.hostOrg} · ${opp.country}</div>
              <div style="margin-bottom:8px;">${urgencyBadge}</div>
              <a href="/opportunities/${opp.id}"
                 style="display:block;text-align:center;background:#1d4ed8;color:white;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">
                View Details →
              </a>
            </div>
          `)

          L.marker([lat, lng], { icon: dot })
            .addTo(map)
            .bindPopup(popup)
        })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [opportunities])

  const stats = {
    total: opportunities.length,
    countries: new Set(opportunities.map((o) => o.country)).size,
    closing: opportunities.filter((o) => {
      const d = daysUntilDeadline(o.deadline)
      return d > 0 && d <= 30
    }).length,
  }

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex flex-wrap gap-6 px-4 mb-4 text-sm">
        <span className="font-semibold text-brand-700">{stats.total} scholarships</span>
        <span className="text-gray-500">{stats.countries} countries</span>
        <span className="text-orange-600 font-medium">{stats.closing} closing this month</span>
        <div className="flex items-center gap-4 ml-auto text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Open</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Closing soon</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Closing imminently</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-400 inline-block" /> Closed</span>
        </div>
      </div>

      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '520px' }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%', background: '#e0f2fe' }} />
      </div>

      {/* Leaflet CSS */}
      <style>{`
        @import url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
        .scholarship-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 0;
        }
        .scholarship-popup .leaflet-popup-content {
          margin: 12px 14px;
        }
        .scholarship-popup .leaflet-popup-tip-container {
          margin-top: -1px;
        }
      `}</style>
    </div>
  )
}
