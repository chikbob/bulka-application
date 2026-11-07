CREATE TABLE IF NOT EXISTS bulka_users (
 id UUID PRIMARY KEY,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 profile JSONB NOT NULL,
 balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bulka_sessions (
 token_hash TEXT PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES bulka_users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS bulka_sessions_user ON bulka_sessions(user_id);
CREATE TABLE IF NOT EXISTS bulka_favorites (
 user_id UUID NOT NULL REFERENCES bulka_users(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL,
 PRIMARY KEY (user_id, product_id)
);
CREATE TABLE IF NOT EXISTS bulka_orders (
 id UUID PRIMARY KEY,
 number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
 user_id UUID REFERENCES bulka_users(id),
 guest_token_hash TEXT,
 data JSONB NOT NULL,
 contact JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bulka_orders_user ON bulka_orders(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS bulka_loyalty (
 id TEXT PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES bulka_users(id),
 order_id UUID REFERENCES bulka_orders(id),
 title TEXT NOT NULL,
 amount INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bulka_rate_limits (
 key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL DEFAULT 1,
 expires_at TIMESTAMPTZ NOT NULL
);
