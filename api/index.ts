import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../server/db.js'
import {
  HttpError,
  hash,
  passwordHash,
  passwordMatches,
  currentUser,
  createSession,
  sessionToken,
  cookie,
  limit,
  text,
} from '../server/security.js'
import products from '../src/data/products.json' with { type: 'json' }
import type { Product, Order, User } from '../src/types/index.js'
const catalog = new Map((products as Product[]).map((p) => [p.id, p]))
function required(user: User | null): asserts user is User & { id: string } {
  if (!user?.id) throw new HttpError(401, 'Войдите в аккаунт')
}
function profile(body: Record<string, unknown>) {
  const name = text(body.name, 80),
    phone = text(body.phone, 30),
    birthday = text(body.birthday, 10)
  if (name.length < 2) throw new HttpError(400, 'Укажите имя — от двух символов')
  if (phone && !/^\+?[\d\s()-]{10,30}$/.test(phone))
    throw new HttpError(400, 'Проверьте номер телефона')
  if (
    birthday &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(birthday) ||
      !Number.isFinite(Date.parse(birthday)) ||
      Date.parse(birthday) > Date.now())
  )
    throw new HttpError(400, 'Проверьте дату рождения')
  return { name, phone, birthday, notifications: body.notifications === true }
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  try {
    const path = (
      typeof req.query.route === 'string'
        ? req.query.route
        : new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/api\//, '')
    ).replace(/\/$/, '')
    if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || ''))
      throw new HttpError(405, 'Метод не поддерживается')
    if (req.method !== 'GET') {
      const origin = req.headers.origin
      const host = req.headers['x-forwarded-host'] || req.headers.host
      if (origin && new URL(origin).host !== host)
        throw new HttpError(403, 'Запрос с другого сайта запрещён')
      if (!req.headers['content-type']?.includes('application/json'))
        throw new HttpError(415, 'Ожидается JSON')
      if (JSON.stringify(req.body || {}).length > 50000)
        throw new HttpError(413, 'Слишком большой запрос')
    }
    const body = req.body || {}
    const user = await currentUser(req)
    if (path === 'auth/session' && req.method === 'GET') return res.json({ user })
    if (path === 'auth/register' && req.method === 'POST') {
      await limit('register:' + hash(String(req.headers['x-forwarded-for'] || 'local')), 10, 3600)
      const email = text(body.email, 254).toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Проверьте почту')
      if (
        typeof body.password !== 'string' ||
        body.password.length < 10 ||
        body.password.length > 128
      )
        throw new HttpError(400, 'Пароль должен содержать от 10 до 128 символов')
      const data = profile(body),
        id = randomUUID()
      const password = await passwordHash(body.password)
      try {
        await db().query(
          'INSERT INTO bulka_users(id,email,password_hash,profile) VALUES($1,$2,$3,$4)',
          [id, email, password, JSON.stringify(data)],
        )
      } catch (e) {
        if ((e as { code?: string }).code === '23505')
          throw new HttpError(409, 'Не удалось зарегистрироваться с этой почтой. Попробуйте войти.')
        throw e
      }
      const favorites = Array.isArray(body.favorites)
        ? [...new Set(body.favorites)]
            .filter((v): v is string => typeof v === 'string' && catalog.has(v))
            .slice(0, 100)
        : []
      if (favorites.length)
        await db().query(
          'INSERT INTO bulka_favorites(user_id,product_id) SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING',
          [id, favorites],
        )
      await createSession(req, res, id)
      return res.status(201).json({ user: { ...data, id, email } })
    }
    if (path === 'auth/login' && req.method === 'POST') {
      const email = text(body.email, 254).toLowerCase()
      await limit('login-ip:' + hash(String(req.headers['x-forwarded-for'] || 'local')), 50)
      await limit('login:' + hash(email), 10)
      if (typeof body.password !== 'string' || body.password.length > 128)
        throw new HttpError(400, 'Проверьте почту и пароль')
      const result = await db().query(
        'SELECT id,email,profile,password_hash FROM bulka_users WHERE email=$1',
        [email],
      )
      const row = result.rows[0]
      // Perform the same expensive hash for an unknown email.
      const encoded = row?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64)
      if (!(await passwordMatches(body.password, encoded)) || !row)
        throw new HttpError(401, 'Неверная почта или пароль')
      await createSession(req, res, row.id)
      return res.json({ user: { ...row.profile, id: row.id, email: row.email } })
    }
    if (path === 'auth/logout' && req.method === 'POST') {
      await db().query('DELETE FROM bulka_sessions WHERE token_hash=$1', [hash(sessionToken(req))])
      res.setHeader('Set-Cookie', cookie(req, '', 0))
      return res.json({ ok: true })
    }
    if (path === 'auth/profile' && req.method === 'PATCH') {
      required(user)
      const data = profile(body)
      await db().query('UPDATE bulka_users SET profile=$1 WHERE id=$2', [
        JSON.stringify(data),
        user.id,
      ])
      return res.json({ user: { ...data, id: user.id, email: user.email } })
    }
    if (path === 'favorites') {
      required(user)
      if (req.method === 'POST') {
        const id = text(body.id)
        if (!catalog.has(id) || typeof body.saved !== 'boolean')
          throw new HttpError(400, 'Неизвестный товар')
        if (body.saved)
          await db().query(
            'INSERT INTO bulka_favorites(user_id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
            [user.id, id],
          )
        else
          await db().query('DELETE FROM bulka_favorites WHERE user_id=$1 AND product_id=$2', [
            user.id,
            id,
          ])
      } else if (req.method !== 'GET') throw new HttpError(405, 'Метод не поддерживается')
      const result = await db().query(
        'SELECT product_id FROM bulka_favorites WHERE user_id=$1 ORDER BY product_id',
        [user.id],
      )
      return res.json({ ids: result.rows.map((r) => r.product_id) })
    }
    if (path === 'loyalty' && req.method === 'GET') {
      required(user)
      const result = await db().query(
        'SELECT id,title,amount,created_at AS date FROM bulka_loyalty WHERE user_id=$1 ORDER BY created_at DESC',
        [user.id],
      )
      return res.json({ transactions: result.rows })
    }
    if (path === 'orders/guest' && req.method === 'POST') {
      const token = text(body.guestToken, 128)
      if (!/^[a-f0-9]{64}$/.test(token))
        throw new HttpError(400, 'Не удалось подтвердить устройство')
      const result = await db().query(
        'SELECT data FROM bulka_orders WHERE user_id IS NULL AND guest_token_hash=$1 ORDER BY created_at DESC LIMIT 100',
        [hash(token)],
      )
      return res.json({ orders: result.rows.map((r) => r.data) })
    }
    if (path === 'orders' && req.method === 'GET') {
      required(user)
      const result = await db().query(
        'SELECT data FROM bulka_orders WHERE user_id=$1 ORDER BY created_at DESC',
        [user.id],
      )
      return res.json({ orders: result.rows.map((r) => r.data) })
    }
    if (path === 'orders' && req.method === 'POST') {
      await limit('order:' + hash(String(req.headers['x-forwarded-for'] || 'local')), 30, 3600)
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 60)
        throw new HttpError(400, 'Проверьте корзину')
      const contact = { name: text(body.name, 80), phone: text(body.phone, 30) }
      if (
        !contact.name ||
        !/^\+?[\d\s()-]{10,30}$/.test(contact.phone) ||
        contact.phone.replace(/\D/g, '').length < 10
      )
        throw new HttpError(400, 'Укажите имя и телефон')
      if (body.storeId !== 'lenina' || !['card', 'cash'].includes(body.paymentMethod))
        throw new HttpError(400, 'Проверьте точку и способ оплаты')
      if (
        typeof body.id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)
      )
        throw new HttpError(400, 'Неверный идентификатор заказа')
      if (body.useBonuses && !user) throw new HttpError(401, 'Войдите, чтобы списать булочки')
      const items = body.items.map(
        (input: {
          productId?: string
          quantity?: number
          variantId?: string
          modifierIds?: string[]
        }) => {
          const p = catalog.get(input.productId || '')
          if (
            !p ||
            !Number.isInteger(input.quantity) ||
            input.quantity! < 1 ||
            input.quantity! > 50
          )
            throw new HttpError(400, 'Проверьте товары и количество')
          const variant = p.variants?.find((v) => v.id === input.variantId)
          if (input.variantId && !variant) throw new HttpError(400, 'Вариант товара недоступен')
          if (
            input.modifierIds &&
            (!Array.isArray(input.modifierIds) || input.modifierIds.length > 20)
          )
            throw new HttpError(400, 'Проверьте добавки')
          const ids = [...new Set(input.modifierIds || [])]
          const options = p.modifiers?.flatMap((m) => m.options) || []
          if (
            ids.some((id) => !options.some((o) => o.id === id)) ||
            p.modifiers?.some(
              (m) => ids.filter((id) => m.options.some((o) => o.id === id)).length > 1,
            )
          )
            throw new HttpError(400, 'Проверьте добавки')
          return {
            key: [p.id, input.variantId || '', ...ids].join(':'),
            productId: p.id,
            quantity: input.quantity!,
            variantId: input.variantId,
            modifierIds: ids,
            name: p.name,
            image: p.image,
            unitPrice:
              p.price +
              (variant?.priceDelta || 0) +
              options.filter((o) => ids.includes(o.id)).reduce((n, o) => n + o.priceDelta, 0),
          }
        },
      )
      const subtotal = items.reduce(
        (n: number, i: { unitPrice: number; quantity: number }) => n + i.unitPrice * i.quantity,
        0,
      )
      const pickupTime =
        body.pickupTime === 'asap'
          ? new Date(Date.now() + 14 * 60000).toISOString()
          : text(body.pickupTime, 40)
      if (
        !Number.isFinite(Date.parse(pickupTime)) ||
        Date.parse(pickupTime) < Date.now() - 60000 ||
        Date.parse(pickupTime) > Date.now() + 86400000
      )
        throw new HttpError(400, 'Выберите новое время получения')
      const guestToken = !user ? text(body.guestToken, 128) : ''
      if (!user && !/^[a-f0-9]{64}$/.test(guestToken))
        throw new HttpError(400, 'Не удалось подтвердить устройство. Обновите страницу.')
      const client = await db().connect()
      try {
        await client.query('BEGIN')
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [body.id])
        if (user) await client.query('SELECT id FROM bulka_users WHERE id=$1 FOR UPDATE', [user.id])
        const previous = await client.query(
          'SELECT user_id,guest_token_hash,data FROM bulka_orders WHERE id=$1',
          [body.id],
        )
        if (previous.rows.length) {
          const old = previous.rows[0]
          if (
            user
              ? old.user_id !== user.id
              : old.user_id || old.guest_token_hash !== hash(guestToken)
          )
            throw new HttpError(409, 'Заказ с этим идентификатором уже существует')
          await client.query('COMMIT')
          return res.json({ order: old.data })
        }
        const balanceResult = user
          ? await client.query('SELECT balance FROM bulka_users WHERE id=$1', [user.id])
          : null
        const spent = body.useBonuses
          ? Math.min(balanceResult?.rows[0]?.balance || 0, Math.floor(subtotal * 0.3))
          : 0
        const order: Order = {
          id: body.id,
          number: 0,
          items,
          total: subtotal - spent,
          earnedBonuses: user ? Math.floor((subtotal - spent) * 0.05) : 0,
          spentBonuses: spent,
          storeId: body.storeId,
          pickupTime,
          paymentMethod: body.paymentMethod,
          status: 'accepted',
          createdAt: new Date().toISOString(),
        }
        const inserted = await client.query(
          'INSERT INTO bulka_orders(id,user_id,guest_token_hash,data,contact) VALUES($1,$2,$3,$4,$5) RETURNING number',
          [
            order.id,
            user?.id || null,
            guestToken ? hash(guestToken) : null,
            JSON.stringify(order),
            JSON.stringify(contact),
          ],
        )
        order.number = Number(inserted.rows[0].number)
        await client.query('UPDATE bulka_orders SET data=$1 WHERE id=$2', [
          JSON.stringify(order),
          order.id,
        ])
        if (spent && user) {
          await client.query('UPDATE bulka_users SET balance=balance-$1 WHERE id=$2', [
            spent,
            user.id,
          ])
          await client.query(
            'INSERT INTO bulka_loyalty(id,user_id,order_id,title,amount) VALUES($1,$2,$3,$4,$5)',
            [order.id + '-spent', user.id, order.id, `Заказ №${order.number} · списание`, -spent],
          )
        }
        await client.query('COMMIT')
        return res.status(201).json({ order })
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    }
    // Only staff can confirm preparation/payment and grant rewards. Customer requests cannot mint bonuses.
    if (path === 'orders/status' && req.method === 'PATCH') {
      const secret = process.env.BULKA_STAFF_TOKEN
      if (!secret || req.headers.authorization !== `Bearer ${secret}`)
        throw new HttpError(403, 'Требуется доступ сотрудника')
      if (!['preparing', 'ready', 'received'].includes(body.status))
        throw new HttpError(400, 'Неверный статус')
      const client = await db().connect()
      try {
        await client.query('BEGIN')
        const owner = await client.query('SELECT user_id FROM bulka_orders WHERE id=$1', [
          text(body.id),
        ])
        if (!owner.rows.length) throw new HttpError(404, 'Заказ не найден')
        const ownerId = owner.rows[0].user_id
        if (ownerId)
          await client.query('SELECT id FROM bulka_users WHERE id=$1 FOR UPDATE', [ownerId])
        const result = await client.query('SELECT data FROM bulka_orders WHERE id=$1 FOR UPDATE', [
          body.id,
        ])
        const order = result.rows[0].data as Order
        const sequence = ['accepted', 'preparing', 'ready', 'received']
        if (sequence.indexOf(body.status) < sequence.indexOf(order.status))
          throw new HttpError(409, 'Нельзя вернуть заказ на предыдущий этап')
        order.status = body.status
        if (body.status === 'received' && ownerId && order.earnedBonuses) {
          const award = await client.query(
            'INSERT INTO bulka_loyalty(id,user_id,order_id,title,amount) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id',
            [
              order.id + '-earned',
              ownerId,
              order.id,
              `Заказ №${order.number} · начисление`,
              order.earnedBonuses,
            ],
          )
          if (award.rows.length)
            await client.query('UPDATE bulka_users SET balance=balance+$1 WHERE id=$2', [
              order.earnedBonuses,
              ownerId,
            ])
        }
        await client.query('UPDATE bulka_orders SET data=$1 WHERE id=$2', [
          JSON.stringify(order),
          order.id,
        ])
        await client.query('COMMIT')
        return res.json({ order })
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    }
    throw new HttpError(404, 'Не найдено')
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.message })
    console.error('API failure', (e as { code?: string }).code || (e as Error).name)
    return res.status(503).json({ error: 'Сервис временно недоступен. Попробуйте ещё раз.' })
  }
}
