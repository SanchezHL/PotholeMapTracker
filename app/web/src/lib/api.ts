import { createServerFn } from '@tanstack/react-start'
import type { ObjectId } from 'mongodb'
import { getDb } from '~/lib/mongo'

export type Severity = 'high' | 'med' | 'low'
export type IncidentType = 'bache' | 'senal'

export type PotholeRecord = {
  id: number
  street: string
  severity: Severity
  incidentType: IncidentType
  incidentCount: number
  bike: string
  time: string
  reviewed: boolean
  lng: number
  lat: number
}

export type AlertRecord = {
  id: number
  street: string
  severity: Severity
  incidentType: IncidentType
  incidentCount: number
  bike: string
  time: string
  reviewed: boolean
  image: string | null
  zone: string
}

export type ZoneReport = {
  name: string
  total: number
  fixed: number
  critical: number
  medium: number
  low: number
}

export type ActivityLogItem = {
  color: string
  text: string
  time: string
}

export type ReportDelivery = {
  label: string
  value: number
  status: 'sent' | 'pending'
}

export type CityReportData = {
  zones: ZoneReport[]
  activityLog: ActivityLogItem[]
  reportsSent: ReportDelivery[]
}

type AlertDetailData = {
  alert: AlertRecord | null
  prevAlertId: number | null
  nextAlertId: number | null
  position: number
  total: number
  imageUrl: string | null
}

type MongoGps =
  | string
  | [number, number]
  | {
      lat?: number | string
      lng?: number | string
      latitude?: number | string
      longitude?: number | string
      coordinates?: [number, number]
    }

type MongoRoadIncident = {
  _id: ObjectId
  image_url?: string | null
  gps?: MongoGps | null
  timestamp?: string | Date | null
  type_of_damage?: string | null
  num_of_potholes?: number | string | null
  num_of_signals?: number | string | null
}

type LocationHint = {
  street: string
  zone: string
  lat: number
  lng: number
}

type NormalizedIncident = {
  id: number
  street: string
  zone: string
  severity: Severity
  incidentType: IncidentType
  incidentCount: number
  bike: string
  time: string
  reviewed: boolean
  image: string | null
  lat: number
  lng: number
}

const incidentTypeLabels = {
  bache: { singular: 'bache', plural: 'baches', title: 'Baches' },
  senal: { singular: 'señal', plural: 'señales', title: 'Señales' },
} as const

const locationHints: LocationHint[] = [
  { street: 'Carrer de Mallorca', zone: 'Eixample', lat: 41.3951, lng: 2.1534 },
  { street: 'Carrer de Provença', zone: 'Eixample', lat: 41.3921, lng: 2.1634 },
  { street: 'Av. Diagonal', zone: 'Les Corts', lat: 41.3951, lng: 2.1734 },
  { street: 'Via Laietana', zone: 'Ciutat Vella', lat: 41.3831, lng: 2.1834 },
  { street: 'Passeig de Gràcia', zone: 'Eixample', lat: 41.3911, lng: 2.1634 },
  { street: 'Carrer de Balmes', zone: 'Sarrià', lat: 41.3871, lng: 2.1534 },
  { street: 'Rambla del Poblenou', zone: 'Poblenou', lat: 41.3981, lng: 2.1934 },
  { street: 'Carrer de Muntaner', zone: 'Eixample', lat: 41.3891, lng: 2.1484 },
  { street: 'Gran Via de les Corts', zone: 'Eixample', lat: 41.3801, lng: 2.1684 },
  { street: 'Av. Paral·lel', zone: 'Poble Sec', lat: 41.3761, lng: 2.1584 },
  { street: 'Carrer de la Marina', zone: 'Poblenou', lat: 41.3921, lng: 2.2034 },
  { street: 'Carrer de Consell de Cent', zone: 'Eixample', lat: 41.3881, lng: 2.1734 },
]

const alertImages = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pothole_on_a_road_in_Bangalore.jpg/640px-Pothole_on_a_road_in_Bangalore.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Pothole_St_Helens.jpg/640px-Pothole_St_Helens.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Pothole_in_road.jpg/640px-Pothole_in_road.jpg',
]

const severityColors = {
  high: '#E24B4A',
  med: '#EF9F27',
  low: '#639922',
} as const

function hashString(value: string) {
  let hash = 0

  for (const char of value) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  }

  return Math.abs(hash)
}

function toNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function normalizeDamageType(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getIncidentTypeTitle(type: IncidentType) {
  return incidentTypeLabels[type].title
}

export function formatIncidentCount(type: IncidentType, count: number) {
  const label = count === 1 ? incidentTypeLabels[type].singular : incidentTypeLabels[type].plural
  return `${count} ${label}`
}

function parseGps(gps: MongoGps | null | undefined, seed: string) {
  if (typeof gps === 'string') {
    const [lat, lng] = gps.split(',').map(part => Number(part.trim()))

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng }
    }
  }

  if (Array.isArray(gps) && gps.length >= 2) {
    const lat = toNumber(gps[0])
    const lng = toNumber(gps[1])

    if (lat !== null && lng !== null) {
      return { lat, lng }
    }
  }

  if (gps && typeof gps === 'object' && !Array.isArray(gps)) {
    const lat = toNumber(gps.lat ?? gps.latitude ?? gps.coordinates?.[0])
    const lng = toNumber(gps.lng ?? gps.longitude ?? gps.coordinates?.[1])

    if (lat !== null && lng !== null) {
      return { lat, lng }
    }
  }

  const hash = hashString(seed)

  return {
    lat: 41.3851 + ((hash % 200) - 100) / 5000,
    lng: 2.1734 + ((Math.floor(hash / 200) % 200) - 100) / 5000,
  }
}

function inferLocation(lat: number, lng: number) {
  let closest = locationHints[0]
  let closestDistance = Number.POSITIVE_INFINITY

  for (const location of locationHints) {
    const distance = Math.hypot(lat - location.lat, lng - location.lng)

    if (distance < closestDistance) {
      closest = location
      closestDistance = distance
    }
  }

  return closest
}

function resolveTimestamp(doc: MongoRoadIncident) {
  if (doc.timestamp instanceof Date && !Number.isNaN(doc.timestamp.getTime())) {
    return doc.timestamp
  }

  if (typeof doc.timestamp === 'string') {
    const parsed = new Date(doc.timestamp)

    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return doc._id.getTimestamp()
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function inferSeverity(doc: MongoRoadIncident, potholes: number, signals: number): Severity {
  const damage = normalizeDamageType(doc.type_of_damage)

  if (
    damage.includes('sinkhole') ||
    damage.includes('socav') ||
    damage.includes('severe') ||
    potholes >= 3 ||
    signals >= 2
  ) {
    return 'high'
  }

  if (
    damage.includes('crack') ||
    damage.includes('grieta') ||
    potholes >= 2 ||
    signals >= 1
  ) {
    return 'med'
  }

  return 'low'
}

function inferIncidentType(doc: MongoRoadIncident, potholes: number, signals: number): IncidentType {
  const damage = normalizeDamageType(doc.type_of_damage)

  if (damage.includes('senal') || damage.includes('signal') || damage.includes('sign')) {
    return 'senal'
  }

  if (damage.includes('bache') || damage.includes('pothole')) {
    return 'bache'
  }

  return signals > potholes ? 'senal' : 'bache'
}

function inferReviewed(id: string, severity: Severity, timestamp: Date) {
  const hash = hashString(id)
  const ageHours = (Date.now() - timestamp.getTime()) / 3600000

  if (ageHours >= 72) return true
  if (severity === 'high') return hash % 4 === 0
  if (severity === 'med') return hash % 3 !== 0
  return hash % 2 === 0
}

function normalizeRoadIncident(doc: MongoRoadIncident): NormalizedIncident {
  const objectId = String(doc._id)
  const id = hashString(objectId)
  const potholes = Math.max(0, toNumber(doc.num_of_potholes) ?? 0)
  const signals = Math.max(0, toNumber(doc.num_of_signals) ?? 0)
  const timestamp = resolveTimestamp(doc)
  const incidentType = inferIncidentType(doc, potholes, signals)
  const incidentCount = incidentType === 'senal'
    ? Math.max(1, signals || 1)
    : Math.max(1, potholes || 1)
  const severity = inferSeverity(doc, potholes, signals)
  const coords = parseGps(doc.gps, objectId)
  const location = inferLocation(coords.lat, coords.lng)

  return {
    id,
    street: location.street,
    zone: location.zone,
    severity,
    incidentType,
    incidentCount,
    bike: `Sensor 0${(hashString(`${objectId}:${location.zone}`) % 3) + 1}`,
    time: formatRelativeTime(timestamp),
    reviewed: inferReviewed(objectId, severity, timestamp),
    image: doc.image_url ?? null,
    lat: coords.lat,
    lng: coords.lng,
  }
}

async function listNormalizedIncidents() {
  const db = await getDb()
  const docs = await db
    .collection<MongoRoadIncident>('road_incidents')
    .find({})
    .sort({ timestamp: -1, _id: -1 })
    .limit(200)
    .toArray()

  return docs.map(normalizeRoadIncident)
}

function toPotholeRecord(incident: NormalizedIncident): PotholeRecord {
  return {
    id: incident.id,
    street: incident.street,
    severity: incident.severity,
    incidentType: incident.incidentType,
    incidentCount: incident.incidentCount,
    bike: incident.bike,
    time: incident.time,
    reviewed: incident.reviewed,
    lng: incident.lng,
    lat: incident.lat,
  }
}

function toAlertRecord(incident: NormalizedIncident): AlertRecord {
  return {
    id: incident.id,
    street: incident.street,
    severity: incident.severity,
    incidentType: incident.incidentType,
    incidentCount: incident.incidentCount,
    bike: incident.bike,
    time: incident.time,
    reviewed: incident.reviewed,
    image: incident.image,
    zone: incident.zone,
  }
}

function buildCityReport(alerts: AlertRecord[]): CityReportData {
  const zoneMap = new Map<string, ZoneReport>()

  for (const alert of alerts) {
    const zone = zoneMap.get(alert.zone) ?? {
      name: alert.zone,
      total: 0,
      fixed: 0,
      critical: 0,
      medium: 0,
      low: 0,
    }

    zone.total += alert.incidentCount
    zone.fixed += alert.reviewed ? alert.incidentCount : 0

    if (alert.severity === 'high') zone.critical += 1
    if (alert.severity === 'med') zone.medium += 1
    if (alert.severity === 'low') zone.low += 1

    zoneMap.set(alert.zone, zone)
  }

  const zones = Array.from(zoneMap.values()).sort((a, b) => b.total - a.total)
  const reviewedCount = alerts.filter(alert => alert.reviewed).length
  const unreviewedCount = alerts.length - reviewedCount
  const activityLog = alerts.slice(0, 6).map((alert) => ({
    color: severityColors[alert.severity],
    text: alert.reviewed
      ? `${alert.street} reviewed in ${alert.zone}`
      : `${formatIncidentCount(alert.incidentType, alert.incidentCount)} flagged near ${alert.street}`,
    time: alert.time,
  }))

  return {
    zones,
    activityLog,
    reportsSent: [
      { label: 'Ayuntamiento BCN', value: alerts.length, status: alerts.length > 0 ? 'sent' : 'pending' },
      { label: 'Maintenance team', value: reviewedCount, status: reviewedCount > 0 ? 'sent' : 'pending' },
      { label: 'Weekly digest', value: alerts.length > 0 ? Math.max(1, Math.ceil(alerts.length / 5)) : 0, status: alerts.length > 0 ? 'sent' : 'pending' },
      { label: 'Pending review', value: unreviewedCount, status: unreviewedCount > 0 ? 'pending' : 'sent' },
    ],
  }
}

export const fetchHomePotholes = createServerFn({ method: 'GET' }).handler(async () => {
  const incidents = await listNormalizedIncidents()
  return incidents.slice(0, 12).map(toPotholeRecord)
})

export const createHomePothole = createServerFn({ method: 'POST' }).handler(async () => {
  const lat = 41.3851 + (Math.random() * 0.04 - 0.02)
  const lng = 2.1734 + (Math.random() * 0.06 - 0.03)
  const potholes = 1 + Math.floor(Math.random() * 3)
  const doc = {
    image_url: null,
    gps: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    timestamp: new Date().toISOString(),
    type_of_damage: 'bache',
    num_of_potholes: potholes,
    num_of_signals: 0,
  }
  const db = await getDb()
  const result = await db.collection<Omit<MongoRoadIncident, '_id'>>('road_incidents').insertOne(doc)

  return toPotholeRecord(normalizeRoadIncident({ _id: result.insertedId, ...doc }))
})

export const fetchMapPotholes = createServerFn({ method: 'GET' }).handler(async () => {
  const incidents = await listNormalizedIncidents()
  return incidents.map(toPotholeRecord)
})

export const fetchAlerts = createServerFn({ method: 'GET' }).handler(async () => {
  const incidents = await listNormalizedIncidents()
  return incidents.map(toAlertRecord)
})

export const fetchAlertDetail = createServerFn({ method: 'GET' })
  .inputValidator((d: number) => d)
  .handler(async ({ data: id }): Promise<AlertDetailData> => {
    const alerts = (await listNormalizedIncidents()).map(toAlertRecord)
    const alertIndex = alerts.findIndex((alert) => alert.id === id)

    if (alertIndex === -1) {
      return {
        alert: null,
        prevAlertId: null,
        nextAlertId: null,
        position: 0,
        total: alerts.length,
        imageUrl: null,
      }
    }

    const alert = alerts[alertIndex]

    return {
      alert,
      prevAlertId: alertIndex > 0 ? alerts[alertIndex - 1].id : null,
      nextAlertId: alertIndex < alerts.length - 1 ? alerts[alertIndex + 1].id : null,
      position: alertIndex + 1,
      total: alerts.length,
      imageUrl: alert.image ?? alertImages[(id - 1) % alertImages.length],
    }
  })

export const fetchCityReport = createServerFn({ method: 'GET' }).handler(async () => {
  const alerts = (await listNormalizedIncidents()).map(toAlertRecord)
  return buildCityReport(alerts)
})
