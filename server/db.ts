import { Pool, neonConfig } from '@neondatabase/serverless'
neonConfig.webSocketConstructor = WebSocket
let pool: Pool | undefined
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  return (pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }))
}
