import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/map')({
  component: MapPage,
})

const mockPotholes = [
  { id: 1,  street: 'Carrer de Mallorca',        severity: 'high', bike: 'Sensor 01', time: '2 min ago',  reviewed: false, lng: 2.1534, lat: 41.3951 },
  { id: 2,  street: 'Carrer de Provença',         severity: 'high', bike: 'Sensor 01', time: '8 min ago',  reviewed: false, lng: 2.1634, lat: 41.3921 },
  { id: 3,  street: 'Av. Diagonal',               severity: 'med',  bike: 'Sensor 02', time: '15 min ago', reviewed: true,  lng: 2.1734, lat: 41.3951 },
  { id: 4,  street: 'Via Laietana',               severity: 'med',  bike: 'Sensor 02', time: '22 min ago', reviewed: false, lng: 2.1834, lat: 41.3831 },
  { id: 5,  street: 'Passeig de Gràcia',          severity: 'low',  bike: 'Sensor 03', time: '41 min ago', reviewed: true,  lng: 2.1634, lat: 41.3911 },
  { id: 6,  street: 'Carrer de Balmes',           severity: 'low',  bike: 'Sensor 03', time: '1 hr ago',   reviewed: false, lng: 2.1534, lat: 41.3871 },
  { id: 7,  street: 'Rambla del Poblenou',        severity: 'high', bike: 'Sensor 01', time: '1 hr ago',   reviewed: false, lng: 2.1934, lat: 41.3981 },
  { id: 8,  street: 'Carrer de Muntaner',         severity: 'med',  bike: 'Sensor 02', time: '2 hrs ago',  reviewed: true,  lng: 2.1484, lat: 41.3891 },
  { id: 9,  street: 'Gran Via de les Corts',      severity: 'high', bike: 'Sensor 01', time: '2 hrs ago',  reviewed: false, lng: 2.1684, lat: 41.3801 },
  { id: 10, street: 'Av. Paral·lel',              severity: 'low',  bike: 'Sensor 03', time: '3 hrs ago',  reviewed: true,  lng: 2.1584, lat: 41.3761 },
  { id: 11, street: 'Carrer de la Marina',        severity: 'med',  bike: 'Sensor 02', time: '3 hrs ago',  reviewed: false, lng: 2.2034, lat: 41.3921 },
  { id: 12, street: 'Carrer de Consell de Cent',  severity: 'high', bike: 'Sensor 01', time: '4 hrs ago',  reviewed: false, lng: 2.1734, lat: 41.3881 },
]

const sevColors = { high: '#E24B4A', med: '#EF9F27', low: '#639922' } as const
type Severity = keyof typeof sevColors

const sevConfig = {
  high: { label: 'Critical', badge: 'bg-red-950 text-red-400 border border-red-900'       },
  med:  { label: 'Medium',   badge: 'bg-amber-950 text-amber-400 border border-amber-900' },
  low:  { label: 'Low',      badge: 'bg-green-950 text-green-400 border border-green-900' },
} as const

declare global { interface Window { L: any } }

function MapPage() {
  const mapContainer = React.useRef<HTMLDivElement>(null)
  const mapRef       = React.useRef<any>(null)
  const markersRef   = React.useRef<any[]>([])
  const tileRef      = React.useRef<any>(null)

  const [filters,     setFilters]     = React.useState({ high: true, med: true, low: true })
  const [selectedPin, setSelectedPin] = React.useState<typeof mockPotholes[0] | null>(null)
  const [ready,       setReady]       = React.useState(false)
  const [isDark,      setIsDark]      = React.useState(
    () => document.documentElement.classList.contains('dark')
  )

  const criticalCount   = mockPotholes.filter(p => p.severity === 'high').length
  const unreviewedCount = mockPotholes.filter(p => !p.reviewed).length

  // Load Leaflet from CDN
  React.useEffect(() => {
    if (window.L) { setReady(true); return }
    const link   = document.createElement('link')
    link.rel     = 'stylesheet'
    link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script  = document.createElement('script')
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setReady(true)
    document.head.appendChild(script)
  }, [])

  // Watch dark mode changes via MutationObserver
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark')
      setIsDark(dark)
      if (mapRef.current && window.L) swapTiles(dark)
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  function swapTiles(dark: boolean) {
    const L   = window.L
    const map = mapRef.current
    if (!L || !map) return
    if (tileRef.current) map.removeLayer(tileRef.current)
    tileRef.current = L.tileLayer(
      dark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 20 }
    ).addTo(map)
  }

  // Init map
  React.useEffect(() => {
    if (!ready || !mapContainer.current || mapRef.current) return
    const L   = window.L
    const dark = document.documentElement.classList.contains('dark')

    const map = L.map(mapContainer.current, {
      center: [41.3851, 2.1734],
      zoom: 14,
      zoomControl: false,
    })

    tileRef.current = L.tileLayer(
      dark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap contributors © CARTO', subdomains: 'abcd', maxZoom: 20 }
    ).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapRef.current = map
    addMarkers(map, L)
    setTimeout(() => map.invalidateSize(), 200)
    setTimeout(() => map.invalidateSize(), 600)

    return () => { map.remove(); mapRef.current = null; tileRef.current = null }
  }, [ready])

  React.useEffect(() => {
    if (mapRef.current && window.L) addMarkers(mapRef.current, window.L)
  }, [filters])

  function addMarkers(map: any, L: any) {
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    mockPotholes
      .filter(p => filters[p.severity as Severity])
      .forEach(p => {
        const circle = L.circleMarker([p.lat, p.lng], {
          radius: 10,
          fillColor: sevColors[p.severity as Severity],
          color: '#000',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        })
        circle.on('click', () => {
          setSelectedPin(p)
          map.flyTo([p.lat, p.lng], 16)
        })
        circle.bindTooltip(
          `<b>${p.street}</b><br/>${sevConfig[p.severity as Severity].label} · ${p.time}`,
          { direction: 'top', offset: [0, -8] }
        )
        circle.addTo(map)
        markersRef.current.push(circle)
      })
  }

  return (
    <>
      <style>{`
        .map-fullscreen {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }
        @media (min-width: 768px) {
          .map-fullscreen { left: 192px; }
        }
        .map-fullscreen > div {
          height: 100% !important;
        }
        .leaflet-container {
          height: 100% !important;
          width: 100% !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #d1d5db !important;
          border-radius: 8px !important;
          overflow: hidden;
          margin: 0 8px 8px 0 !important;
        }
        .dark .leaflet-control-zoom {
          border-color: #374151 !important;
        }
        .leaflet-control-zoom a {
          background: #ffffff !important;
          color: #6b7280 !important;
          border: none !important;
        }
        .dark .leaflet-control-zoom a {
          background: #111827 !important;
          color: #9ca3af !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f3f4f6 !important;
          color: #111827 !important;
        }
        .dark .leaflet-control-zoom a:hover {
          background: #1f2937 !important;
          color: #f9fafb !important;
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          color: #6b7280 !important;
          font-size: 10px !important;
        }
        .dark .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: #4b5563 !important;
        }
        .leaflet-tooltip {
          background: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          color: #111827 !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          padding: 5px 9px !important;
        }
        .dark .leaflet-tooltip {
          background: #111827 !important;
          border-color: #374151 !important;
          color: #f9fafb !important;
        }
        .leaflet-tooltip-top::before { border-top-color: #e5e7eb !important; }
        .dark .leaflet-tooltip-top::before { border-top-color: #374151 !important; }
      `}</style>

      <div className="map-fullscreen p-6 pl-4 sm:pl-14 bg-gray-100 dark:bg-gray-950">
        <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '100%' }}>

          {/* Map */}
          <div
            ref={mapContainer}
            className="w-full"
            style={{ height: '100%', minHeight: '100%' }}
          />

          {/* Loading */}
          {!ready && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100 dark:bg-gray-950 rounded-xl">
              <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-2">
                <i className="ti ti-loader-2 animate-spin" /> Loading map...
              </p>
            </div>
          )}

          {/* Stats + Filters */}
          <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col gap-2 md:flex-row md:items-start md:justify-between">

            {/* Stats */}
            <div className="bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 flex items-center gap-3 self-start shadow-sm">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                <span className="text-gray-900 dark:text-gray-200 font-medium">{mockPotholes.length}</span> potholes
              </span>
              <span className="text-xs text-red-500 dark:text-red-400">
                <span className="font-medium">{criticalCount}</span> critical
              </span>
              <span className="text-xs text-amber-500 dark:text-amber-400">
                <span className="font-medium">{unreviewedCount}</span> unreviewed
              </span>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(sevColors) as Severity[]).map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilters(f => ({ ...f, [sev]: !f[sev] }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters[sev]
                      ? sevConfig[sev].badge
                      : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-white/80 dark:bg-gray-900/80'
                  }`}
                >
                  {sevConfig[sev].label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-10 left-3 z-[1000] bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 flex flex-col gap-1.5 shadow-sm">
            {(Object.keys(sevColors) as Severity[]).map(sev => (
              <div key={sev} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sevColors[sev] }} />
                <span className="text-xs text-gray-600 dark:text-gray-300">{sevConfig[sev].label}</span>
              </div>
            ))}
          </div>

          {/* Selected pin */}
          {selectedPin && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-3 md:translate-x-0 md:bottom-auto md:top-14 z-[1000] w-56">
              <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div
                  className="px-4 py-3 border-b border-gray-200 dark:border-gray-800"
                  style={{ borderLeft: `3px solid ${sevColors[selectedPin.severity as Severity]}` }}
                >
                  <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{selectedPin.street}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedPin.time}</p>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sevConfig[selectedPin.severity as Severity].badge}`}>
                      {sevConfig[selectedPin.severity as Severity].label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      !selectedPin.reviewed
                        ? 'bg-amber-950 text-amber-400 border border-amber-900'
                        : 'bg-green-950 text-green-400 border border-green-900'
                    }`}>
                      {selectedPin.reviewed ? 'Reviewed' : 'Unreviewed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <i className="ti ti-bike text-xs" /> {selectedPin.bike}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <i className="ti ti-map-pin text-xs" />
                    {selectedPin.lat.toFixed(4)}, {selectedPin.lng.toFixed(4)}
                  </p>
                  <button
                    onClick={() => setSelectedPin(null)}
                    className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors text-left"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}