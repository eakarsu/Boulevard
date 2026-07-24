import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pool from '../config/database.js'

const databaseDir = path.dirname(fileURLToPath(import.meta.url))

async function seed() {
  if (process.env.SEED_DATABASE !== '1') {
    throw new Error('Refusing to load fixtures without SEED_DATABASE=1')
  }

  const seedFiles = ['seed-data.sql', 'seed-complete.sql']
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const seedFile of seedFiles) {
      await client.query(await readFile(path.join(databaseDir, seedFile), 'utf8'))
    }
    await client.query('COMMIT')
    console.log('Development fixtures loaded')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exitCode = 1
})
