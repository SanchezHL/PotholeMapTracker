import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

const mockPotholes = [
  { id: 1, street: 'Carrer de Mallorca',  severity: 'high', bike: 'Sensor 01', time: '2 min ago',  reviewed: false, lng: 2.1534, lat: 41.3951 },
  { id: 2, street: 'Carrer de Provença',  severity: 'high', bike: 'Sensor 01', time: '8 min ago',  reviewed: false, lng: 2.1634, lat: 41.3921 },
  { id: 3, street: 'Av. Diagonal',        severity: 'med',  bike: 'Sensor 02', time: '15 min ago', reviewed: true,  lng: 2.1734, lat: 41.3951 },
  { id: 4, street: 'Via Laietana',        severity: 'med',  bike: 'Sensor 02', time: '22 min ago', reviewed: false, lng: 2.1834, lat: 41.3831 },
  { id: 5, street: 'Passeig de Gràcia',   severity: 'low',  bike: 'Sensor 03', time: '41 min ago', reviewed: true,  lng: 2.1634, lat: 41.3911 },
  { id: 6, street: 'Carrer de Balmes',    severity: 'low',  bike: 'Sensor 03', time: '1 hr ago',   reviewed: false, lng: 2.1534, lat: 41.3871 },
  { id: 7, street: 'Rambla del Poblenou', severity: 'high', bike: 'Sensor 01', time: '1 hr ago',   reviewed: false, lng: 2.1934, lat: 41.3981 },
  { id: 8, street: 'Carrer de Muntaner',  severity: 'med',  bike: 'Sensor 02', time: '2 hrs ago',  reviewed: true,  lng: 2.1484, lat: 41.3891 },
]

const sevConfig = {
  high: { label: 'Critical', color: '#E24B4A', badge: 'bg-red-950 text-red-400 border border-red-900',       dot: 'bg-red-500'   },
  med:  { label: 'Medium',   color: '#EF9F27', badge: 'bg-amber-950 text-amber-400 border border-amber-900', dot: 'bg-amber-500' },
  low:  { label: 'Low',      color: '#639922', badge: 'bg-green-950 text-green-400 border border-green-900', dot: 'bg-green-500' },
} as const

type Severity = keyof typeof sevConfig

declare global { interface Window { L: any } }

const extraStreets = [
  'Carrer de Consell de Cent',
  'Av. Paral·lel',
  'Carrer de la Marina',
  'Gran Via de les Corts',
]

function Home() {
  const mapContainer = React.useRef<HTMLDivElement>(null)
  const mapRef       = React.useRef<any>(null)
  const markersRef   = React.useRef<any[]>([])
  const tileRef      = React.useRef<any>(null)

  const [potholes,  setPotholes]  = React.useState(mockPotholes)
  const [filters,   setFilters]   = React.useState({ high: true, med: true, low: true })
  const [simCount,  setSimCount]  = React.useState(0)
  const [mapReady,  setMapReady]  = React.useState(false)

  const criticalCount   = potholes.filter(p => p.severity === 'high').length
  const unreviewedCount = potholes.filter(p => !p.reviewed).length
  const alertsSent      = Math.floor(potholes.length * 0.6)

  // Load Leaflet from CDN
  React.useEffect(() => {
    if (window.L) { setMapReady(true); return }
    const link   = document.createElement('link')
    link.rel     = 'stylesheet'
    link.href    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
    const script  = document.createElement('script')
    script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapReady(true)
    document.head.appendChild(script)
  }, [])

  // Watch dark mode toggle and swap tiles
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark')
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
      { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 }
    ).addTo(map)
  }

  // Init map
  React.useEffect(() => {
    if (!mapReady || !mapContainer.current || mapRef.current) return
    const L    = window.L
    const dark = document.documentElement.classList.contains('dark')

    const map = L.map(mapContainer.current, {
      center: [41.3851, 2.1734],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: false,
    })

    tileRef.current = L.tileLayer(
      dark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '© OpenStreetMap © CARTO', subdomains: 'abcd', maxZoom: 20 }
    ).addTo(map)

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 100)

    return () => { map.remove(); mapRef.current = null; tileRef.current = null }
  }, [mapReady])

  // Refresh markers
  React.useEffect(() => {
    if (!mapRef.current || !window.L) return
    addMarkers(mapRef.current, window.L)
  }, [potholes, filters, mapReady])

  function addMarkers(map: any, L: any) {
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    potholes
      .filter(p => filters[p.severity as Severity])
      .forEach(p => {
        const color  = sevConfig[p.severity as Severity].color
        const circle = L.circleMarker([p.lat, p.lng], {
          radius: 9, fillColor: color, color: '#000',
          weight: 2, opacity: 1, fillOpacity: 0.9,
        })
        circle.bindTooltip(`
          <b>${p.street}</b><br/>
          ${sevConfig[p.severity as Severity].label} · ${p.time}<br/>
          ${p.reviewed ? '✓ Reviewed' : '⏳ Awaiting review'}
        `, { direction: 'top', offset: [0, -8] })
        circle.addTo(map)
        markersRef.current.push(circle)
      })
  }

  function simulate() {
    const street   = extraStreets[simCount % extraStreets.length]
    const sevs: Severity[] = ['high', 'med', 'low']
    const severity = sevs[Math.floor(Math.random() * 3)]
    setPotholes(prev => [{
      id: Date.now(), street, severity,
      bike: `Sensor 0${Math.ceil(Math.random() * 3)}`,
      time: 'just now', reviewed: false,
      lng: 2.1534 + (Math.random() * 0.06 - 0.03),
      lat: 41.3851 + (Math.random() * 0.04 - 0.02),
    }, ...prev])
    setSimCount(c => c + 1)
  }

  const toggleFilter = (sev: Severity) =>
    setFilters(f => ({ ...f, [sev]: !f[sev] }))

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">

      <style>{`
        .leaflet-control-zoom { border: 1px solid #e5e7eb !important; border-radius: 8px !important; overflow: hidden; }
        .dark .leaflet-control-zoom { border-color: #374151 !important; }
        .leaflet-control-zoom a { background: #ffffff !important; color: #6b7280 !important; border: none !important; }
        .dark .leaflet-control-zoom a { background: #111827 !important; color: #9ca3af !important; }
        .leaflet-control-zoom a:hover { background: #f3f4f6 !important; color: #111827 !important; }
        .dark .leaflet-control-zoom a:hover { background: #1f2937 !important; color: #f9fafb !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.7) !important; color: #6b7280 !important; font-size: 10px !important; }
        .dark .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: #6b7280 !important; }
        .leaflet-tooltip { background: #ffffff !important; border: 1px solid #e5e7eb !important; color: #111827 !important; border-radius: 8px !important; font-size: 11px !important; }
        .dark .leaflet-tooltip { background: #111827 !important; border-color: #374151 !important; color: #f9fafb !important; }
        .leaflet-tooltip-top::before { border-top-color: #e5e7eb !important; }
        .dark .leaflet-tooltip-top::before { border-top-color: #374151 !important; }
      `}</style>

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Potholes detected</p>
          <p className="text-2xl font-medium text-gray-900 dark:text-gray-100">{potholes.length}</p>
          <p className="text-xs mt-1 text-green-600 dark:text-green-500">+{simCount} simulated</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Critical zones</p>
          <p className="text-2xl font-medium text-gray-900 dark:text-gray-100">{criticalCount}</p>
          <p className="text-xs mt-1 text-red-500 dark:text-red-400">Action needed</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 relative overflow-hidden">
          {unreviewedCount > 0 && (
            <div className="absolute inset-0 border border-amber-300 dark:border-amber-900/60 rounded-xl pointer-events-none" />
          )}
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs text-gray-500">Potholes to review</p>
            {unreviewedCount > 0 && (
              <span className="text-xs bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900 px-1.5 py-0.5 rounded-full leading-none">
                pending
              </span>
            )}
          </div>
          <p className="text-2xl font-medium text-gray-900 dark:text-gray-100">{unreviewedCount}</p>
          <p className="text-xs mt-1 text-amber-600 dark:text-amber-500 flex items-center gap-1">
            <i className="ti ti-clock text-xs" /> Awaiting tech review
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Alerts sent</p>
          <p className="text-2xl font-medium text-gray-900 dark:text-gray-100">{alertsSent}</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">To ayuntamiento</p>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

        {/* ── MAP CARD ── */}
        <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col min-h-[400px] lg:min-h-0">

          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-2 shrink-0">
            <i className="ti ti-map-pin text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Barcelona heatmap</span>
            <div className="flex gap-2 ml-auto flex-wrap">
              {(Object.keys(sevConfig) as Severity[]).map(sev => (
                <button
                  key={sev}
                  onClick={() => toggleFilter(sev)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    filters[sev]
                      ? sevConfig[sev].badge
                      : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 bg-transparent'
                  }`}
                >
                  {sevConfig[sev].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 relative m-3 rounded-xl overflow-hidden min-h-[300px]">
            <div ref={mapContainer} style={{ width: '100%', height: '100%', minHeight: '300px' }} />

            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[999] bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 flex flex-col gap-1.5">
              {(Object.keys(sevConfig) as Severity[]).map(sev => (
                <div key={sev} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sevConfig[sev].dot}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{sevConfig[sev].label}</span>
                </div>
              ))}
            </div>

            {/* Barcelona label */}
            <div className="absolute top-3 right-3 z-[999] bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <i className="ti ti-map text-xs" /> Barcelona, ES
              </p>
            </div>

            {/* Full map link */}
            <Link
              to="/map"
              className="absolute top-3 left-3 z-[999] bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1.5 transition-colors"
            >
              <i className="ti ti-maximize text-xs" /> Full map
            </Link>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-3 lg:w-64 xl:w-72">

          {/* Alert list */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-col flex-1 min-h-[280px] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 shrink-0">
              <i className="ti ti-alert-triangle text-sm text-gray-400" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Live alerts</span>
              <span className="ml-auto text-xs bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded-full">
                {criticalCount} critical
              </span>
            </div>
            <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto">
              {potholes.slice(0, 10).map(p => {
                const c = sevConfig[p.severity as Severity]
                return (
                  <Link
                    key={p.id}
                    to="/alert/$alertId"
                    params={{ alertId: String(p.id) }}
                    className="block"
                  >
                    <div
                      className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer"
                      style={{ borderLeft: `2px solid ${c.color}` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[110px]">
                          {p.street}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${c.badge}`}>
                          {c.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400 dark:text-gray-500">{p.time}</p>
                        {!p.reviewed ? (
                          <span className="text-xs text-amber-500 dark:text-amber-400 flex items-center gap-1">
                            <i className="ti ti-eye text-xs" /> review
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <i className="ti ti-check text-xs" /> done
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Simulate card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <i className="ti ti-player-play text-sm text-gray-400" /> Simulate detection
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Fire a fake Arduino detection to test the live flow.
            </p>
            <button
              onClick={simulate}
              className="w-full py-2 rounded-xl bg-green-950 border border-green-900 text-green-400 text-xs font-medium hover:bg-green-900 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ti ti-plus text-sm" /> Detect new pothole
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}