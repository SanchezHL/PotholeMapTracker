import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import {
  fetchAlertDetail,
  formatIncidentCount,
  getIncidentTypeTitle,
} from '~/lib/api'

export const Route = createFileRoute('/alert/$alertId')({
  loader: async ({ params }) => {
    return fetchAlertDetail({ data: Number(params.alertId) })
  },
  component: AlertDetail,
})

const sevConfig = {
  high: { label: 'Critical', color: '#E24B4A', badge: 'bg-red-950 text-red-400 border border-red-900'       },
  med:  { label: 'Medium',   color: '#EF9F27', badge: 'bg-amber-950 text-amber-400 border border-amber-900' },
  low:  { label: 'Low',      color: '#639922', badge: 'bg-green-950 text-green-400 border border-green-900' },
} as const

type Severity = keyof typeof sevConfig

function AlertDetail() {
  const { alertId } = Route.useParams()
  const { alert, prevAlertId, nextAlertId, position, total, imageUrl } = Route.useLoaderData()
  const navigate    = useNavigate()
  const id          = Number(alertId)

  const [severity, setSeverity] = React.useState<Severity>(
    (alert?.severity as Severity) ?? 'low'
  )
  const [reviewed, setReviewed] = React.useState(alert?.reviewed ?? false)
  const [notes,    setNotes]    = React.useState('')
  const [saved,    setSaved]    = React.useState(false)
  const [imgError, setImgError] = React.useState(false)

  React.useEffect(() => {
    setSeverity((alert?.severity as Severity) ?? 'low')
    setReviewed(alert?.reviewed ?? false)
    setNotes('')
    setSaved(false)
    setImgError(false)
  }, [alert?.id, alert?.reviewed, alert?.severity])

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function goTo(targetId: number) {
    navigate({ to: '/alert/$alertId', params: { alertId: String(targetId) } })
  }

  if (!alert) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-gray-500">
        <i className="ti ti-alert-circle text-4xl" />
        <p className="text-sm">Alert not found</p>
        <Link to="/alerts" className="text-xs text-green-600 dark:text-green-500 hover:text-green-500 dark:hover:text-green-400 mt-2">
          ← Back to alerts
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 max-w-7xl mx-auto w-full">

      {/* ── TOP NAV ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 px-3 py-2 rounded-xl transition-all shrink-0"
        >
          <i className="ti ti-arrow-left text-sm" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex-1 min-w-0 hidden sm:block">
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            Alert #{alert.id} · {alert.street} · {alert.zone}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => prevAlertId && goTo(prevAlertId)}
            disabled={!prevAlertId}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <i className="ti ti-chevron-left text-sm" />
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0 tabular-nums">
            {position} / {total}
          </span>
          <button
            onClick={() => nextAlertId && goTo(nextAlertId)}
            disabled={!nextAlertId}
            className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <i className="ti ti-chevron-right text-sm" />
          </button>
        </div>
      </div>

      {/* ── MAIN CARD ── */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex flex-col min-h-0">

        {/* Card header */}
        <div
          className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3 shrink-0"
          style={{ borderLeft: `3px solid ${sevConfig[alert.severity as Severity].color}` }}
        >
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100 truncate">{alert.street}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{alert.zone}, Barcelona</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full ${sevConfig[severity].badge}`}>
              {sevConfig[severity].label}
            </span>
            {!reviewed ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                Pending review
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900 flex items-center gap-1">
                <i className="ti ti-check text-xs" /> Reviewed
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0">

          {/* ── 3 INFO CARDS ── */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {[
              { icon: 'ti-map-pin',      label: 'Location', value: alert.zone                },
              { icon: 'ti-clock',        label: 'Detected', value: alert.time                },
              { icon: 'ti-alert-circle', label: getIncidentTypeTitle(alert.incidentType), value: formatIncidentCount(alert.incidentType, alert.incidentCount) },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <i className={`ti ${item.icon} text-xs text-gray-400 dark:text-gray-500`} />
                  <p className="text-xs text-gray-400 dark:text-gray-500">{item.label}</p>
                </div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.value}</p>
              </div>
            ))}
          </div>

          {/* ── TWO COLUMN GRID — IMAGE + REVIEW ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">

            {/* ── LEFT — IMAGE ── */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <i className="ti ti-camera text-xs" /> Detection image
              </p>

              <div className="relative bg-gray-100 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden flex-1 min-h-[260px] flex items-center justify-center">
                {!imgError ? (
                  <img
                    src={imageUrl ?? undefined}
                    alt={`Incident at ${alert.street}`}
                    className="w-full h-full object-cover absolute inset-0"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-700 z-10">
                    <i className="ti ti-camera-off text-4xl" />
                    <p className="text-sm">Image pending from Arduino</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">Will appear once the bike uploads it</p>
                  </div>
                )}

                {!imgError && (
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
                )}

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-20">
                  <span className="text-xs bg-black/60 border border-white/10 text-gray-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                    <i className="ti ti-clock text-xs" /> {alert.time}
                  </span>
                  <span className="text-xs bg-amber-950/90 border border-amber-900 text-amber-400 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <i className="ti ti-camera text-xs" /> Demo image
                  </span>
                </div>

                {/* Bottom badges */}
                {!imgError && (
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 z-20">
                    <span className="text-xs bg-black/60 border border-white/10 text-gray-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                      <i className="ti ti-map-pin text-xs" /> {alert.zone}
                    </span>
                    <span className="text-xs bg-black/60 border border-white/10 text-gray-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 backdrop-blur-sm">
                      <i className="ti ti-bike text-xs" /> {alert.bike}
                    </span>
                    <span className="text-xs bg-red-950/90 border border-red-900 text-red-400 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                      <i className="ti ti-alert-circle text-xs" />
                      {formatIncidentCount(alert.incidentType, alert.incidentCount)} detected
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT — TECH REVIEW ── */}
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <i className="ti ti-clipboard-check text-xs" /> Tech review
              </p>

              <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col gap-3 flex-1">

                {/* Severity */}
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Classify severity</p>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(sevConfig) as Severity[]).map(sev => (
                      <button
                        key={sev}
                        onClick={() => setSeverity(sev)}
                        className={`flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl border transition-all font-medium ${
                          severity === sev
                            ? sevConfig[sev].badge
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-400 bg-transparent'
                        }`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: severity === sev ? sevConfig[sev].color : '#9ca3af' }}
                        />
                        {sevConfig[sev].label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800" />

                {/* Notes */}
                <div className="flex flex-col flex-1">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Review notes</p>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add notes for the city maintenance team..."
                    className="flex-1 min-h-[120px] w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 resize-none transition-colors"
                  />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800" />

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { setReviewed(true); handleSave() }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 dark:bg-green-950 border border-green-700 dark:border-green-900 text-white dark:text-green-400 text-xs font-medium hover:bg-green-700 dark:hover:bg-green-900 transition-colors"
                  >
                    <i className="ti ti-check text-sm" />
                    Mark as reviewed
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {saved ? (
                        <>
                          <i className="ti ti-check text-sm text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Saved!</span>
                        </>
                      ) : (
                        <>
                          <i className="ti ti-device-floppy text-sm" />
                          Save notes
                        </>
                      )}
                    </button>

                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                      <i className="ti ti-send text-sm" />
                      Send to city
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
