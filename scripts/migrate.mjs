/* global WebSocket, process, URL, console */
import { readFile } from 'node:fs/promises'
import { Pool, neonConfig } from '@neondatabase/serverless'
neonConfig.webSocketConstructor = WebSocket
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
try {
  await pool.query(await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8'))
  console.log('Bulka schema ready')
} finally {
  await pool.end()
}
