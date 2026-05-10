import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MongoClient } from 'mongodb'

const BARCELONA_BOUNDS = {
  minLat: 41.3200,
  maxLat: 41.4700,
  minLng: 2.0900,
  maxLng: 2.2300,
}

const assetImages = [
  'assets/pothole_87.jpg',
  'assets/pothole_88.jpg',
  'assets/pothole_92.jpg',
  'assets/pothole_151.jpg',
  'assets/pothole_152.jpg',
]

const locations = [
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

function resolveMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI
  }

  const envPath = resolve(process.cwd(), '.env')

  if (!existsSync(envPath)) {
    throw new Error('No se ha encontrado .env en app/web y falta MONGO_URI')
  }

  const envContents = readFileSync(envPath, 'utf8')

  for (const rawLine of envContents.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith('#') || !line.startsWith('MONGO_URI=')) {
      continue
    }

    const value = line.slice('MONGO_URI='.length).trim().replace(/^['"]|['"]$/g, '')

    if (value) {
      process.env.MONGO_URI = value
      return value
    }
  }

  throw new Error('Falta MONGO_URI en .env')
}

function assertInsideBarcelona(lat, lng, label) {
  const inside =
    lat >= BARCELONA_BOUNDS.minLat &&
    lat <= BARCELONA_BOUNDS.maxLat &&
    lng >= BARCELONA_BOUNDS.minLng &&
    lng <= BARCELONA_BOUNDS.maxLng

  if (!inside) {
    throw new Error(`La coordenada de ${label} está fuera de Barcelona: ${lat}, ${lng}`)
  }
}

function isoHoursAgo(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
}

function formatGps(lat, lng) {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

function toBase64DataUrl(relativePath) {
  const absolutePath = resolve(process.cwd(), relativePath)

  if (!existsSync(absolutePath)) {
    throw new Error(`No se ha encontrado la imagen ${relativePath}`)
  }

  const base64 = readFileSync(absolutePath).toString('base64')
  return `data:image/jpeg;base64,${base64}`
}

function buildSeedDocuments() {
  const imageDataUrls = assetImages.map(toBase64DataUrl)

  return locations.slice(0, 5).map((location, index) => {
    const lat = location.lat + (index % 2 === 0 ? 0.00025 : -0.00022)
    const lng = location.lng + (index % 2 === 0 ? -0.00018 : 0.00021)
    const type = index < 3 ? 'bache' : 'señal'

    assertInsideBarcelona(lat, lng, `${location.street} ${type}`)

    return {
      image_url: imageDataUrls[index],
      gps: formatGps(lat, lng),
      timestamp: isoHoursAgo(index * 6 + 1),
      type_of_damage: type,
      num_of_potholes: type === 'bache' ? (index % 3) + 1 : 0,
      num_of_signals: type === 'señal' ? ((index - 3) % 3) + 1 : 0,
      source: 'sample-seed',
      seed_version: 'barcelona-v2',
      street_hint: location.street,
      zone_hint: location.zone,
    }
  })
}

async function main() {
  const replaceAll = process.argv.includes('--replace')
  const mongoUri = resolveMongoUri()
  const client = new MongoClient(mongoUri)

  try {
    await client.connect()

    const db = client.db('iot_project')
    const collection = db.collection('road_incidents')
    const docs = buildSeedDocuments()

    if (replaceAll) {
      const deleteResult = await collection.deleteMany({})
      console.log(`Colección limpiada: ${deleteResult.deletedCount} documentos borrados`)
    } else {
      const deleteResult = await collection.deleteMany({ source: 'sample-seed' })
      console.log(`Seeds anteriores eliminados: ${deleteResult.deletedCount}`)
    }

    const insertResult = await collection.insertMany(docs)
    const insertedCount = Object.keys(insertResult.insertedIds).length
    const totalCount = await collection.countDocuments()

    console.log(`Insertados ${insertedCount} documentos de ejemplo en road_incidents`)
    console.log(`Total actual en la colección: ${totalCount}`)
    console.log('Resumen del seed:')
    console.log('- 5 incidencias de ejemplo en Barcelona')
    console.log('- 3 incidencias de bache')
    console.log('- 2 incidencias de señal')
    console.log(`- Imágenes locales en base64: ${assetImages.length}`)
    console.log(`- Modo replace total: ${replaceAll ? 'sí' : 'no'}`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error('Error ejecutando el seed:', error)
  process.exit(1)
})
