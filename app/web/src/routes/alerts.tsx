import { createFileRoute, Link } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/alerts')({
  component: AlertsPage,
})

export const mockAlerts = [
  { id: 1,  street: 'Carrer de Mallorca',        severity: 'high', bike: 'Bike 01', time: '2 min ago',  reviewed: false, potholes: 3, image: null, zone: 'Eixample'     },
  { id: 2,  street: 'Carrer de Provença',         severity: 'high', bike: 'Bike 01', time: '8 min ago',  reviewed: false, potholes: 2, image: null, zone: 'Eixample'     },
  { id: 3,  street: 'Av. Diagonal',               severity: 'med',  bike: 'Bike 02', time: '15 min ago', reviewed: true,  potholes: 1, image: null, zone: 'Les Corts'    },
  { id: 4,  street: 'Via Laietana',               severity: 'med',  bike: 'Bike 02', time: '22 min ago', reviewed: false, potholes: 2, image: null, zone: 'Ciutat Vella' },
  { id: 5,  street: 'Passeig de Gràcia',          severity: 'low',  bike: 'Bike 03', time: '41 min ago', reviewed: true,  potholes: 1, image: null, zone: 'Eixample'     },
  { id: 6,  street: 'Carrer de Balmes',           severity: 'low',  bike: 'Bike 03', time: '1 hr ago',   reviewed: false, potholes: 1, image: null, zone: 'Sarrià'       },
  { id: 7,  street: 'Rambla del Poblenou',        severity: 'high', bike: 'Bike 01', time: '1 hr ago',   reviewed: false, potholes: 4, image: null, zone: 'Poblenou'     },
  { id: 8,  street: 'Carrer de Muntaner',         severity: 'med',  bike: 'Bike 02', time: '2 hrs ago',  reviewed: true,  potholes: 2, image: null, zone: 'Eixample'     },
  { id: 9,  street: 'Gran Via de les Corts',      severity: 'high', bike: 'Bike 01', time: '2 hrs ago',  reviewed: false, potholes: 3, image: null, zone: 'Eixample'     },
  { id: 10, street: 'Av. Paral·lel',              severity: 'low',  bike: 'Bike 03', time: '3 hrs ago',  reviewed: true,  potholes: 1, image: null, zone: 'Poble Sec'    },
  { id: 11, street: 'Carrer de la Marina',        severity: 'med',  bike: 'Bike 02', time: '3 hrs ago',  reviewed: false, potholes: 2, image: null, zone: 'Poblenou'     },
  { id: 12, street: 'Carrer de Consell de Cent',  severity: 'high', bike: 'Bike 01', time: '4 hrs ago',  reviewed: false, potholes: 3, image: null, zone: 'Eixample'     },
]

const sevConfig = {
  high: { label: 'Critical', color: '#E24B4A', badge: 'bg-red-950 text-red-400 border border-red-900',       dot: 'bg-red-500',   border: 'border-l-red-500'   },
  med:  { label: 'Medium',   color: '#EF9F27', badge: 'bg-amber-950 text-amber-400 border border-amber-900', dot: 'bg-amber-500', border: 'border-l-amber-500' },
  low:  { label: 'Low',      color: '#639922', badge: 'bg-green-950 text-green-400 border border-green-900', dot: 'bg-green-500', border: 'border-l-green-500' },
} as const

type Severity = keyof typeof sevConfig
type Filter = 'all' | 'unreviewed' | Severity

function AlertsPage() {
  const [filter, setFilter] = React.useState<Filter>('all')
  const [search, setSearch] = React.useState('')

  const filtered = mockAlerts.filter(a => {
    const matchesSev    = filter === 'all' || filter === 'unreviewed' || a.severity === filter
    const matchesStatus = filter !== 'unreviewed' || !a.reviewed
    const matchesSearch = a.street.toLowerCase().includes(search.toLowerCase()) ||
                          a.zone.toLowerCase().includes(search.toLowerCase())
    return matchesSev && matchesStatus && matchesSearch
  })

  const critCount       = mockAlerts.filter(a => a.severity === 'high').length
  const unreviewedCount = mockAlerts.filter(a => !a.reviewed).length

  const filterBtns: { key: Filter; label: string }[] = [
    { key: 'all',        label: 'All'      },
    { key: 'unreviewed', label: 'Pending'  },
    { key: 'high',       label: 'Critical' },
    { key: 'med',        label: 'Medium'   },
    { key: 'low',        label: 'Low'      },
  ]

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-base font-medium text-gray-900 dark:text-gray-100">Live alerts</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {mockAlerts.length} total · {critCount} critical · {unreviewedCount} pending review
          </p>
        </div>

        {/* Search */}
        <div className="sm:ml-auto relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Search street or zone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 w-full sm:w-56 transition-colors"
          />
        </div>
      </div>

      {/* ── FILTER PILLS ── */}
      <div className="flex gap-2 flex-wrap">
        {filterBtns.map(btn => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              filter === btn.key
                ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900'
                : 'bg-transparent text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-400'
            }`}
          >
            {btn.label}
            {btn.key === 'unreviewed' && unreviewedCount > 0 && (
              <span className="ml-1.5 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs px-1.5 rounded-full">
                {unreviewedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── ALERT LIST ── */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-600">
            <i className="ti ti-mood-empty text-3xl mb-2" />
            <p className="text-sm">No alerts match your filter</p>
          </div>
        ) : (
          filtered.map((alert, idx) => {
            const c = sevConfig[alert.severity as Severity]
            return (
              <Link
                key={alert.id}
                to="/alert/$alertId"
                params={{ alertId: String(alert.id) }}
                className="block group"
              >
                <div className={`
                  bg-white dark:bg-gray-900
                  border border-gray-200 dark:border-gray-800
                  rounded-xl p-4
                  hover:border-gray-300 dark:hover:border-gray-700
                  transition-all cursor-pointer
                  border-l-2 ${c.border}
                `}>
                  <div className="flex items-start gap-4">

                    {/* Dot + index */}
                    <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${c.dot} ${alert.severity === 'high' ? 'animate-pulse' : ''}`} />
                      <span className="text-xs text-gray-400 dark:text-gray-600">#{idx + 1}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {alert.street}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${c.badge}`}>
                          {c.label}
                        </span>
                        {!alert.reviewed ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900 shrink-0">
                            unreviewed
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 shrink-0">
                            reviewed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <i className="ti ti-map-pin text-xs" /> {alert.zone}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ti ti-clock text-xs" /> {alert.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ti ti-alert-circle text-xs" />
                          {alert.potholes} pothole{alert.potholes > 1 ? 's' : ''} detected
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="shrink-0 text-gray-300 dark:text-gray-700 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors mt-1">
                      <i className="ti ti-chevron-right text-base" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}