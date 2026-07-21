import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pool from '../config/database.js'

const databaseDir = path.dirname(fileURLToPath(import.meta.url))

async function seed() {
  if (process.env.SEED_DATABASE !== '1') {
    throw new Error('Refusing to load fixtures without SEED_DATABASE=1')
  }

  const sql = await readFile(path.join(databaseDir, 'seed-complete.sql'), 'utf8')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
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
