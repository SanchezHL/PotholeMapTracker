import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'

export const Route = createFileRoute('/city-report')({
  component: CityReport,
})

const zoneData = [
  { name: 'Eixample',     total: 68, fixed: 21, critical: 3, medium: 2, low: 1 },
  { name: 'Gràcia',       total: 44, fixed: 18, critical: 1, medium: 3, low: 2 },
  { name: 'Poblenou',     total: 38, fixed: 12, critical: 2, medium: 2, low: 2 },
  { name: 'Barceloneta',  total: 28, fixed: 14, critical: 1, medium: 1, low: 4 },
  { name: 'Ciutat Vella', total: 22, fixed: 8,  critical: 1, medium: 2, low: 1 },
  { name: 'Poble Sec',    total: 16, fixed: 5,  critical: 1, medium: 1, low: 2 },
  { name: 'Others',       total: 31, fixed: 11, critical: 1, medium: 2, low: 3 },
]

const activityLog = [
  { color: '#E24B4A', text: '3 critical potholes in Eixample flagged',   time: '2 min ago' },
  { color: '#639922', text: 'Carrer de Balmes repaired & closed',         time: '1 hr ago'  },
  { color: '#EF9F27', text: 'Weekly report sent to ayuntamiento',         time: '3 hrs ago' },
  { color: '#374151', text: 'Sensor 02 route completed — Gràcia',         time: '5 hrs ago' },
  { color: '#639922', text: 'Via Laietana patch confirmed by maintenance', time: '6 hrs ago' },
  { color: '#E24B4A', text: 'New critical zone detected — Poblenou',      time: '8 hrs ago' },
]

const reportsSent = [
  { label: 'Ayuntamiento BCN', value: 12, status: 'sent'    },
  { label: 'Maintenance team', value: 8,  status: 'sent'    },
  { label: 'Weekly digest',    value: 3,  status: 'sent'    },
  { label: 'Pending review',   value: 5,  status: 'pending' },
]

const maxTotal = Math.max(...zoneData.map(z => z.total))

function CityReport() {
  const [activeZone, setActiveZone] = React.useState<string | null>(null)
  const [exporting, setExporting]   = React.useState(false)
  const reportRef = React.useRef<HTMLDivElement>(null)

  const totalPotholes  = zoneData.reduce((s, z) => s + z.total, 0)
  const totalFixed     = zoneData.reduce((s, z) => s + z.fixed, 0)
  const resolutionRate = Math.round((totalFixed / totalPotholes) * 100)

  const criticalTotal = zoneData.reduce((s, z) => s + z.critical * 10, 0)
  const mediumTotal   = zoneData.reduce((s, z) => s + z.medium  * 8,  0)
  const lowTotal      = zoneData.reduce((s, z) => s + z.low     * 5,  0)
  const sevTotal      = criticalTotal + mediumTotal + lowTotal
  const critPct       = Math.round((criticalTotal / sevTotal) * 100)
  const medPct        = Math.round((mediumTotal   / sevTotal) * 100)
  const lowPct        = 100 - critPct - medPct

  const r        = 35
  const circ     = 2 * Math.PI * r
  const critDash = (critPct / 100) * circ
  const medDash  = (medPct  / 100) * circ
  const lowDash  = (lowPct  / 100) * circ

  async function handleExportPDF() {
    if (!reportRef.current) return
    setExporting(true)

    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF       = (await import('jspdf')).default

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#030712',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData     = canvas.toDataURL('image/png')
      const pdf         = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth   = pdf.internal.pageSize.getWidth()
      const pageHeight  = pdf.internal.pageSize.getHeight()
      const imgWidth    = pageWidth
      const imgHeight   = (canvas.height * imgWidth) / canvas.width

      let heightLeft  = imgHeight
      let position    = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`PotholeTracker_CityReport_Barcelona_${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 overflow-y-auto pb-4 pr-4">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-base font-medium text-gray-100">City report</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Barcelona · May 2026 · Auto-generated from sensor data
          </p>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 px-3 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <i className="ti ti-loader-2 text-sm animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <i className="ti ti-download text-sm" />
              Export PDF
            </>
          )}
        </button>
      </div>

      {/* everything below here gets captured for PDF */}
      <div ref={reportRef} className="flex flex-col gap-3">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total potholes</p>
            <p className="text-2xl font-medium text-gray-100">{totalPotholes}</p>
            <p className="text-xs mt-1 text-red-400">+18 this week</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Repaired</p>
            <p className="text-2xl font-medium text-gray-100">{totalFixed}</p>
            <p className="text-xs mt-1 text-green-500">{resolutionRate}% resolution rate</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Avg response time</p>
            <p className="text-2xl font-medium text-gray-100">4.2h</p>
            <p className="text-xs mt-1 text-amber-400">+0.8h vs last week</p>
          </div>
        </div>

        {/* ── MIDDLE ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Bar chart by zone */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <i className="ti ti-map-pin text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-200">Potholes by zone</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {zoneData.map(z => {
                const pct   = Math.round((z.total / maxTotal) * 100)
                const color = z.total >= 50 ? '#E24B4A' : z.total >= 30 ? '#EF9F27' : '#639922'
                return (
                  <div
                    key={z.name}
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setActiveZone(activeZone === z.name ? null : z.name)}
                  >
                    <span className="text-xs text-gray-400 w-24 shrink-0 group-hover:text-gray-200 transition-colors">
                      {z.name}
                    </span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right shrink-0">{z.total}</span>
                  </div>
                )
              })}

              {activeZone && (() => {
                const z = zoneData.find(d => d.name === activeZone)!
                return (
                  <div className="mt-1 bg-gray-950 border border-gray-800 rounded-xl p-3 flex gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-gray-500">Zone</p>
                      <p className="text-sm font-medium text-gray-200">{z.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-sm font-medium text-gray-200">{z.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fixed</p>
                      <p className="text-sm font-medium text-green-400">{z.fixed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className="text-sm font-medium text-amber-400">{z.total - z.fixed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Resolution</p>
                      <p className="text-sm font-medium text-gray-200">
                        {Math.round((z.fixed / z.total) * 100)}%
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Zone status grid */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <i className="ti ti-building text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-200">Zone status overview</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {zoneData.slice(0, 4).map(z => {
                const resPct = Math.round((z.fixed / z.total) * 100)
                return (
                  <div key={z.name} className="bg-gray-950 border border-gray-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-200">{z.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        resPct >= 50
                          ? 'bg-green-950 text-green-400 border border-green-900'
                          : 'bg-amber-950 text-amber-400 border border-amber-900'
                      }`}>
                        {resPct}% fixed
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 mb-2">
                      <span>{z.total} total</span>
                      <span className="text-green-600">{z.fixed} repaired</span>
                    </div>
                    <div className="flex h-1 rounded-full overflow-hidden gap-px">
                      <div style={{ flex: z.critical, background: '#E24B4A', borderRadius: 2 }} />
                      <div style={{ flex: z.medium,   background: '#EF9F27', borderRadius: 2 }} />
                      <div style={{ flex: z.low,      background: '#639922', borderRadius: 2 }} />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs">
                      <span style={{ color: '#E24B4A' }}>{z.critical} crit</span>
                      <span style={{ color: '#EF9F27' }}>{z.medium} med</span>
                      <span style={{ color: '#639922' }}>{z.low} low</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Activity timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <i className="ti ti-clock text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-200">Recent activity</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {activityLog.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: item.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-relaxed">{item.text}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reports sent */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <i className="ti ti-send text-gray-500 text-sm" />
              <span className="text-sm font-medium text-gray-200">Reports sent</span>
            </div>
            <div className="p-4 flex flex-col">
              {reportsSent.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div className="flex items-center gap-2">
                    <i className={`ti ${r.status === 'sent' ? 'ti-circle-check' : 'ti-clock'} text-sm ${r.status === 'sent' ? 'text-green-600' : 'text-amber-500'}`} />
                    <span className="text-xs text-gray-300">{r.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-100">{r.value}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      r.status === 'sent'
                        ? 'bg-green-950 text-green-400 border-green-900'
                        : 'bg-amber-950 text-amber-400 border-amber-900'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
              <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-950 border border-green-900 text-green-400 text-xs font-medium hover:bg-green-900 transition-colors">
                <i className="ti ti-send text-sm" />
                Send new report to city
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}