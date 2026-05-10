import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MongoClient } from 'mongodb'

let clientPromise: Promise<MongoClient> | null = null

function resolveMongoUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI
  }

  const envPath = resolve(process.cwd(), '.env')

  if (existsSync(envPath)) {
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
  }

  throw new Error('Missing MONGO_URI environment variable')
}

async function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(resolveMongoUri())
    clientPromise = client.connect()
  }

  return clientPromise
}

export async function getDb() {
  const client = await getClient()
  return client.db('iot_project')
}
