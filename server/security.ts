import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from './db.ts'
const scrypt = promisify(scryptCallback)
export const hash = (value: string) => createHash('sha256').update(value).digest('hex')
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derived.toString('hex')}`
}
export async function passwordMatches(password: string, encoded: string) {
  const [salt, digest] = encoded.split(':')
  const expected = Buffer.from(digest, 'hex')
  const actual = (await scrypt(password, salt, 64)) as Buffer
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
export function sessionToken(req: VercelRequest) {
  return req.cookies?.['__Host-bulka-session'] || req.cookies?.['bulka-session'] || ''
}
export async function currentUser(req: VercelRequest) {
  const token = sessionToken(req)
  if (!token) return null
  const result = await db().query(
    'SELECT u.id,u.email,u.profile,u.balance FROM bulka_users u JOIN bulka_sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()',
    [hash(token)],
  )
  const row = result.rows[0]
  return row ? { ...row.profile, id: row.id, email: row.email } : null
}
export function cookie(req: VercelRequest, value: string, maxAge: number) {
  const local =
    req.headers.host?.startsWith('localhost') || req.headers.host?.startsWith('127.0.0.1')
  return `${local ? 'bulka-session' : '__Host-bulka-session'}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${local ? '' : '; Secure'}`
}
export async function createSession(req: VercelRequest, res: VercelResponse, userId: string) {
  const token = randomBytes(32).toString('hex')
  await db().query(
    "INSERT INTO bulka_sessions(token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '30 days')",
    [hash(token), userId],
  )
  res.setHeader('Set-Cookie', cookie(req, token, 30 * 86400))
}
export async function limit(key: string, max: number, seconds = 900) {
  const result = await db().query(
    `INSERT INTO bulka_rate_limits(key,attempts,expires_at) VALUES ($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN bulka_rate_limits.expires_at<now() THEN 1 ELSE bulka_rate_limits.attempts+1 END, expires_at=CASE WHEN bulka_rate_limits.expires_at<now() THEN EXCLUDED.expires_at ELSE bulka_rate_limits.expires_at END RETURNING attempts`,
    [key, seconds],
  )
  if (result.rows[0].attempts > max)
    throw new HttpError(429, 'Слишком много попыток. Попробуйте немного позже.')
}
export function text(value: unknown, max = 100) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
