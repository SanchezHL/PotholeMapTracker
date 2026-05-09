import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

const mockPotholes = [
  { id: 1, street: 'Carrer de Mallorca',  severity: 'high', bike: 'Sensor 01', time: '2 min ago',  reviewed: false, coords: { x: '22%', y: '28%' } },
  { id: 2, street: 'Carrer de Provença',  severity: 'high', bike: 'Sensor 01', time: '8 min ago',  reviewed: false, coords: { x: '38%', y: '52%' } },
  { id: 3, street: 'Av. Diagonal',        severity: 'med',  bike: 'Sensor 02', time: '15 min ago', reviewed: true,  coords: { x: '65%', y: '38%' } },
  { id: 4, street: 'Via Laietana',        severity: 'med',  bike: 'Sensor 02', time: '22 min ago', reviewed: false, coords: { x: '55%', y: '68%' } },
  { id: 5, street: 'Passeig de Gràcia',   severity: 'low',  bike: 'Sensor 03', time: '41 min ago', reviewed: true,  coords: { x: '30%', y: '78%' } },
  { id: 6, street: 'Carrer de Balmes',    severity: 'low',  bike: 'Sensor 03', time: '1 hr ago',   reviewed: false, coords: { x: '72%', y: '55%' } },
  { id: 7, street: 'Rambla del Poblenou', severity: 'high', bike: 'Sensor 01', time: '1 hr ago',   reviewed: false, coords: { x: '48%', y: '20%' } },
  { id: 8, street: 'Carrer de Muntaner',  severity: 'med',  bike: 'Sensor 02', time: '2 hrs ago',  reviewed: true,  coords: { x: '18%', y: '62%' } },
]

const sevConfig = {
  high: { label: 'Critical', color: '#E24B4A', badge: 'bg-red-950 text-red-400 border border-red-900',       dot: 'bg-red-500'   },
  med:  { label: 'Medium',   color: '#EF9F27', badge: 'bg-amber-950 text-amber-400 border border-amber-900', dot: 'bg-amber-500' },
  low:  { label: 'Low',      color: '#639922', badge: 'bg-green-950 text-green-400 border border-green-900', dot: 'bg-green-500' },
} as const

type Severity = keyof typeof sevConfig

const extraStreets = [
  'Carrer de Consell de Cent',
  'Av. Paral·lel',
  'Carrer de la Marina',
  'Gran Via de les Corts',
]

function Home() {
  const [potholes, setPotholes] = React.useState(mockPotholes)
  const [filters, setFilters]   = React.useState({ high: true, med: true, low: true })
  const [tooltip, setTooltip]   = React.useState<number | null>(null)
  const [simCount, setSimCount] = React.useState(0)

  function simulate() {
    const street   = extraStreets[simCount % extraStreets.length]
    const sevs: Severity[] = ['high', 'med', 'low']
    const severity = sevs[Math.floor(Math.random() * 3)]
    setPotholes(prev => [
      {
        id: Date.now(),
        street,
        severity,
        bike: `Sensor 0${Math.ceil(Math.random() * 3)}`,
        time: 'just now',
        reviewed: false,
        coords: {
          x: `${Math.floor(Math.random() * 75 + 10)}%`,
          y: `${Math.floor(Math.random() * 75 + 10)}%`,
        },
      },
      ...prev,
    ])
    setSimCount(c => c + 1)
  }

  function markReviewed(id: number) {
    setPotholes(prev =>
      prev.map(p => p.id === id ? { ...p, reviewed: true } : p)
    )
  }

  const toggleFilter = (sev: Severity) =>
    setFilters(f => ({ ...f, [sev]: !f[sev] }))

  const visiblePotholes = potholes.filter(p => filters[p.severity as Severity])
  const criticalCount   = potholes.filter(p => p.severity === 'high').length
  const unreviewedCount = potholes.filter(p => !p.reviewed).length
  const alertsSent      = Math.floor(potholes.length * 0.6)

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">

      {/* ── METRIC CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Potholes detected</p>
          <p className="text-2xl font-medium text-gray-100">{potholes.length}</p>
          <p className="text-xs mt-1 text-green-500">+{simCount} simulated</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Critical zones</p>
          <p className="text-2xl font-medium text-gray-100">{criticalCount}</p>
          <p className="text-xs mt-1 text-red-400">Action needed</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 relative overflow-hidden">
          {unreviewedCount > 0 && (
            <div className="absolute inset-0 border border-amber-900/60 rounded-xl pointer-events-none" />
          )}
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs text-gray-500">Potholes to review</p>
            {unreviewedCount > 0 && (
              <span className="text-xs bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.5 rounded-full leading-none">
                pending
              </span>
            )}
          </div>
          <p className="text-2xl font-medium text-gray-100">{unreviewedCount}</p>
          <p className="text-xs mt-1 text-amber-500 flex items-center gap-1">
            <i className="ti ti-clock text-xs" />
            Awaiting tech review
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Alerts sent</p>
          <p className="text-2xl font-medium text-gray-100">{alertsSent}</p>
          <p className="text-xs mt-1 text-gray-500">To ayuntamiento</p>
        </div>

      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">

        {/* ── MAP CARD ── */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex flex-col min-h-[400px] lg:min-h-0">

          <div className="px-4 py-3 border-b border-gray-800 flex flex-wrap items-center gap-2">
            <i className="ti ti-map-pin text-gray-400 text-sm" />
            <span className="text-sm font-medium text-gray-200">Barcelona heatmap</span>
            <div className="flex gap-2 ml-auto flex-wrap">
              {(Object.keys(sevConfig) as Severity[]).map(sev => (
                <button
                  key={sev}
                  onClick={() => toggleFilter(sev)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    filters[sev]
                      ? sevConfig[sev].badge
                      : 'border-gray-700 text-gray-600 bg-transparent'
                  }`}
                >
                  {sevConfig[sev].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 relative bg-gray-950 m-3 rounded-xl overflow-hidden">

            {[25, 50, 75].map(p => (
              <React.Fragment key={p}>
                <div className="absolute left-0 right-0 border-t border-gray-800/60" style={{ top: `${p}%` }} />
                <div className="absolute top-0 bottom-0 border-l border-gray-800/60" style={{ left: `${p}%` }} />
              </React.Fragment>
            ))}
            {[12.5, 37.5, 62.5, 87.5].map(p => (
              <div key={p} className="absolute left-0 right-0 border-t border-gray-800/30" style={{ top: `${p}%` }} />
            ))}

            {[
              { t: '5%',  l: '5%',  w: '17%', h: '15%' },
              { t: '5%',  l: '27%', w: '20%', h: '15%' },
              { t: '5%',  l: '53%', w: '18%', h: '15%' },
              { t: '5%',  l: '76%', w: '18%', h: '15%' },
              { t: '28%', l: '5%',  w: '17%', h: '18%' },
              { t: '28%', l: '27%', w: '20%', h: '18%' },
              { t: '28%', l: '76%', w: '18%', h: '18%' },
              { t: '55%', l: '5%',  w: '17%', h: '15%' },
              { t: '55%', l: '53%', w: '18%', h: '15%' },
              { t: '55%', l: '76%', w: '18%', h: '15%' },
              { t: '78%', l: '27%', w: '20%', h: '17%' },
              { t: '78%', l: '53%', w: '40%', h: '17%' },
            ].map((b, i) => (
              <div key={i} className="absolute bg-gray-800/40 rounded"
                style={{ top: b.t, left: b.l, width: b.w, height: b.h }} />
            ))}

            {visiblePotholes.filter(p => p.severity === 'high').slice(0, 3).map(p => (
              <div
                key={`glow-${p.id}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.coords.x, top: p.coords.y,
                  width: 72, height: 72,
                  background: `radial-gradient(circle, ${sevConfig.high.color}44 0%, transparent 70%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

            {visiblePotholes.map(p => (
              <Link
                key={p.id}
                to="/alert/$alertId"
                params={{ alertId: String(p.id) }}
                className="absolute"
                style={{ left: p.coords.x, top: p.coords.y, transform: 'translate(-50%, -50%)' }}
                onMouseEnter={() => setTooltip(p.id)}
                onMouseLeave={() => setTooltip(null)}
              >
                <div className="relative group cursor-pointer">
                  {p.severity === 'high' && (
                    <div
                      className="absolute rounded-full animate-ping opacity-40"
                      style={{
                        width: 20, height: 20,
                        background: sevConfig.high.color,
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}

                  {!p.reviewed && (
                    <div
                      className="absolute rounded-full border border-amber-500/60"
                      style={{
                        width: 20, height: 20,
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  )}

                  <div
                    className="w-3 h-3 rounded-full border-2 border-gray-950 relative z-10 transition-transform group-hover:scale-150"
                    style={{ background: sevConfig[p.severity as Severity].color }}
                  />

                  {tooltip === p.id && (
                    <div className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                      <p className="text-xs font-medium text-gray-100">{p.street}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sevConfig[p.severity as Severity].label} · {p.time}
                      </p>
                      <p className={`text-xs mt-0.5 ${p.reviewed ? 'text-green-500' : 'text-amber-400'}`}>
                        {p.reviewed ? '✓ Reviewed' : '⏳ Awaiting review'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">Click to open →</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}

            <div className="absolute bottom-3 left-3 bg-gray-900/90 border border-gray-800 rounded-lg px-3 py-2 flex flex-col gap-1.5">
              {(Object.keys(sevConfig) as Severity[]).map(sev => (
                <div key={sev} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${sevConfig[sev].dot}`} />
                  <span className="text-xs text-gray-400">{sevConfig[sev].label}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-800">
                <div className="w-2 h-2 rounded-full border border-amber-500/60" />
                <span className="text-xs text-gray-500">Unreviewed</span>
              </div>
            </div>

            <div className="absolute top-3 right-3 bg-gray-900/80 border border-gray-800 rounded-lg px-2.5 py-1.5">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <i className="ti ti-map text-xs" />
                Barcelona, ES
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 border-t border-gray-800 flex gap-4 flex-wrap">
            {[
              { name: 'Sensor 01', zone: 'Eixample',    color: '#639922' },
              { name: 'Sensor 02', zone: 'Gràcia',      color: '#EF9F27' },
              { name: 'Sensor 03', zone: 'Barceloneta', color: '#378ADD' },
            ].map(b => (
              <div key={b.name} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: b.color }} />
                <span className="text-xs text-gray-400">
                  <span className="text-gray-300 font-medium">{b.name}</span> — {b.zone}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-3 lg:w-64 xl:w-72">

          {/* Alert list */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col flex-1 min-h-[280px] overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2 shrink-0">
              <i className="ti ti-alert-triangle text-sm text-gray-400" />
              <span className="text-sm font-medium text-gray-200">Live alerts</span>
              <span className="ml-auto text-xs bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-full">
                {criticalCount} critical
              </span>
            </div>
            <div className="flex-1 p-2 flex flex-col gap-1.5 overflow-y-auto">
              {potholes.slice(0, 10).map((p) => {
                const c = sevConfig[p.severity as Severity]
                return (
                  <Link
                    key={p.id}
                    to="/alert/$alertId"
                    params={{ alertId: String(p.id) }}
                    className="block"
                  >
                    <div
                      className="p-2.5 rounded-lg bg-gray-800/50 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                      style={{ borderLeft: `2px solid ${c.color}` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-200 truncate max-w-[110px]">
                          {p.street}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${c.badge}`}>
                          {c.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">{p.bike} · {p.time}</p>
                        {!p.reviewed ? (
                          <span className="text-xs text-amber-400 flex items-center gap-1">
                            <i className="ti ti-eye text-xs" />
                            review
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <i className="ti ti-check text-xs" />
                            done
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-300 mb-1 flex items-center gap-2">
              <i className="ti ti-player-play text-sm text-gray-400" />
              Simulate detection
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Fire a fake Arduino detection to test the live flow.
            </p>
            <button
              onClick={simulate}
              className="w-full py-2 rounded-xl bg-green-950 border border-green-900 text-green-400 text-xs font-medium hover:bg-green-900 transition-colors flex items-center justify-center gap-2"
            >
              <i className="ti ti-plus text-sm" />
              Detect new pothole
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}