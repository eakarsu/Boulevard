import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pool from '../config/database.js'

const databaseDir = path.dirname(fileURLToPath(import.meta.url))
const schemaFiles = ['schema.sql', 'schema-enhanced.sql']

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const file of schemaFiles) {
      const sql = await readFile(path.join(databaseDir, file), 'utf8')
      await client.query(sql)
      console.log(`Applied ${file}`)
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch((error) => {
  console.error('Migration failed:', error)
  process.exitCode = 1
})
