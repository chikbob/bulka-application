/* global process, console, WebSocket, fetch, AbortSignal */
import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID, randomBytes } from 'node:crypto'
import { Pool, neonConfig } from '@neondatabase/serverless'
neonConfig.webSocketConstructor = WebSocket
const origin = process.env.TEST_URL || 'http://localhost:3001'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const accounts = []
function client() {
  let cookie = ''
  return async (path, method = 'GET', body, extra = {}) => {
    const response = await fetch(origin + '/api/' + path, {
      method,
      signal: AbortSignal.timeout(30000),
      headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json', ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.headers.has('set-cookie'))
      cookie = response.headers.get('set-cookie').split(';')[0]
    const value = await response.json()
    return { status: response.status, ...value }
  }
}
const checkout = () => ({
  id: randomUUID(),
  items: [{ productId: '992233', quantity: 1, modifierIds: [], unitPrice: 1 }],
  name: 'Проверка системы',
  phone: '+70000000000',
  storeId: 'lenina',
  pickupTime: 'asap',
  paymentMethod: 'cash',
  useBonuses: false,
  guestToken: randomBytes(32).toString('hex'),
})
test('account sync, guest orders, authorization and atomic loyalty', async () => {
  const a = client(),
    b = client(),
    guest = client(),
    other = client()
  const email = `qa-${randomUUID()}@example.invalid`,
    password = randomBytes(20).toString('hex')
  try {
    assert.equal((await a('auth/session')).user, null)
    assert.equal((await guest('orders')).status, 401)
    const registered = await a('auth/register', 'POST', {
      email,
      password,
      name: 'Проверка системы',
      favorites: ['992233'],
    })
    assert.equal(registered.status, 201)
    accounts.push(registered.user.id)
    assert.equal((await b('auth/login', 'POST', { email, password: password + 'bad' })).status, 401)
    assert.equal((await b('auth/login', 'POST', { email, password })).status, 200)
    assert.deepEqual((await b('favorites')).ids, ['992233'])
    await a('favorites', 'POST', { id: '992232', saved: true })
    assert.ok((await b('favorites')).ids.includes('992232'))
    const update = await b('auth/profile', 'PATCH', {
      name: 'Новое имя',
      phone: '+70000000000',
      birthday: '',
      notifications: false,
      id: randomUUID(),
      email: 'fake@example.invalid',
    })
    assert.equal(update.user.email, email)
    assert.equal((await a('auth/session')).user.name, 'Новое имя')
    assert.deepEqual((await a('loyalty')).transactions, [])
    const input = checkout(),
      order = (await a('orders', 'POST', input)).order
    assert.equal(order.total, 350, 'server must ignore client price')
    assert.equal(order.status, 'accepted')
    assert.equal((await b('orders')).orders[0].id, order.id)
    assert.equal((await a('orders', 'POST', input)).order.id, order.id)
    assert.equal((await b('orders')).orders.length, 1, 'retry must not duplicate order')
    assert.deepEqual(
      (await a('loyalty')).transactions,
      [],
      'placing unpaid orders cannot mint rewards',
    )
    assert.equal(
      (await a('orders/status', 'PATCH', { id: order.id, status: 'received' })).status,
      403,
    )
    if (process.env.BULKA_STAFF_TOKEN) {
      const headers = { Authorization: 'Bearer ' + process.env.BULKA_STAFF_TOKEN }
      const confirmation = await a(
        'orders/status',
        'PATCH',
        { id: order.id, status: 'received' },
        headers,
      )
      assert.equal(confirmation.status, 200)
      await a('orders/status', 'PATCH', { id: order.id, status: 'received' }, headers)
      assert.equal(
        (await b('loyalty')).transactions.reduce((s, t) => s + t.amount, 0),
        17,
        'award only once',
      )
      const spend1 = { ...checkout(), useBonuses: true },
        spend2 = { ...checkout(), useBonuses: true }
      const results = await Promise.all([a('orders', 'POST', spend1), b('orders', 'POST', spend2)])
      assert.equal(
        results.reduce((s, r) => s + r.order.spentBonuses, 0),
        17,
        'concurrent devices cannot overspend',
      )
      assert.equal(
        (await b('loyalty')).transactions.reduce((s, t) => s + t.amount, 0),
        0,
      )
    }
    const foreign = await other('auth/register', 'POST', {
      email: `qa-${randomUUID()}@example.invalid`,
      password,
      name: 'Другой аккаунт',
    })
    accounts.push(foreign.user.id)
    assert.deepEqual((await other('orders')).orders, [])
    assert.deepEqual((await other('favorites')).ids, [])
    assert.equal(
      (await other('orders', 'POST', input)).status,
      409,
      'cannot claim another account order',
    )
    const guestInput = checkout(),
      guestOrder = await guest('orders', 'POST', guestInput)
    assert.equal(guestOrder.status, 201)
    assert.equal(guestOrder.order.earnedBonuses, 0)
    assert.equal((await guest('orders', 'POST', { ...checkout(), useBonuses: true })).status, 401)
    assert.equal(
      (
        await guest('orders', 'POST', {
          ...guestInput,
          guestToken: randomBytes(32).toString('hex'),
        })
      ).status,
      409,
    )
    await a('auth/logout', 'POST', {})
    assert.equal((await a('auth/session')).user, null)
    assert.equal((await a('favorites')).status, 401)
    console.log(
      'Account isolation, two-device sync, guest checkout, pricing, retry and loyalty checks passed',
    )
  } finally {
    // Remove only synthetic records made by this test; never touch customer data.
    for (const id of accounts) {
      await pool.query('DELETE FROM bulka_loyalty WHERE user_id=$1', [id])
      await pool.query('DELETE FROM bulka_orders WHERE user_id=$1', [id])
      await pool.query('DELETE FROM bulka_users WHERE id=$1', [id])
    }
    await pool.query(
      "DELETE FROM bulka_orders WHERE user_id IS NULL AND contact->>'name'='Проверка системы' AND contact->>'phone'='+70000000000'",
    )
    await pool.end()
  }
})
