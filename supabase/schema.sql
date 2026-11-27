-- ═══════════════════════════════════════════════════════════
-- NoWave Smart Dining Ecosystem — Supabase PostgreSQL Schema
-- Realtime WebSocket Sync, Waiter Claim & Table OTP System
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- 1. WAITERS & STAFF DIRECTORY
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS waiters (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  pin          TEXT NOT NULL DEFAULT '1234',
  role         TEXT NOT NULL DEFAULT 'waiter' CHECK (role IN ('waiter', 'lead')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_color TEXT NOT NULL DEFAULT '#C59B43',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Staff (Rahul, Priya, Karthik, Sneha)
INSERT INTO waiters (id, name, pin, role, is_active, avatar_color)
VALUES
  ('w1', 'Rahul', '1234', 'lead', true, '#C59B43'),
  ('w2', 'Priya', '1234', 'waiter', true, '#3B82F6'),
  ('w3', 'Karthik', '1234', 'waiter', true, '#10B981'),
  ('w4', 'Sneha', '1234', 'waiter', true, '#EC4899')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

-- ───────────────────────────────────────────────────────────
-- 2. RESTAURANT TABLES (LIFECYCLE STATE MACHINE)
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS restaurant_tables (
  table_number         TEXT PRIMARY KEY,
  status               TEXT NOT NULL DEFAULT 'available'
                       CHECK (status IN ('available', 'browsing', 'awaiting_verification', 'ordered', 'cooking', 'eating', 'paid')),
  assigned_waiter_id   TEXT REFERENCES waiters(id) ON DELETE SET NULL,
  assigned_waiter_name TEXT,
  verification_otp     TEXT, -- 4-digit numeric code e.g. '4829'
  otp_attempts         INT NOT NULL DEFAULT 0,
  current_order_id     TEXT,
  session_token        TEXT,
  guest_count          INT NOT NULL DEFAULT 2,
  total_spent          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_active          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Tables T1 through T8
INSERT INTO restaurant_tables (table_number, status, verification_otp, guest_count, total_spent)
VALUES
  ('1', 'available', '4821', 2, 0),
  ('2', 'available', '7392', 4, 0),
  ('3', 'available', '5129', 2, 0),
  ('4', 'available', '8301', 4, 0),
  ('5', 'available', '2948', 2, 0),
  ('6', 'available', '6173', 4, 0),
  ('7', 'available', '3502', 6, 0),
  ('8', 'available', '9416', 4, 0)
ON CONFLICT (table_number) DO NOTHING;

-- ───────────────────────────────────────────────────────────
-- 3. CORE MENU & CATEGORIES
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  price             DECIMAL(10, 2) NOT NULL,
  half_price        DECIMAL(10, 2),
  image_url         TEXT,
  dietary_type      TEXT NOT NULL DEFAULT 'veg' CHECK (dietary_type IN ('veg', 'nonveg', 'vegan', 'egg')),
  spice_level       INT NOT NULL DEFAULT 1 CHECK (spice_level BETWEEN 1 AND 5),
  station           TEXT NOT NULL DEFAULT 'curry' CHECK (station IN ('tandoor', 'curry', 'drinks', 'desserts')),
  allergens         TEXT[] DEFAULT ARRAY['Dairy']::TEXT[],
  deal_addon        JSONB,
  is_chef_special   BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller     BOOLEAN NOT NULL DEFAULT FALSE,
  availability_slot TEXT NOT NULL DEFAULT 'all_day' CHECK (availability_slot IN ('morning_only', 'lunch_dinner', 'all_day')),
  is_struck_out     BOOLEAN NOT NULL DEFAULT FALSE,
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order        INT NOT NULL DEFAULT 0,
  category_id       UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- 4. ORDERS & KITCHEN TICKETS (KDS)
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number         TEXT NOT NULL UNIQUE,
  table_number         TEXT NOT NULL REFERENCES restaurant_tables(table_number) ON DELETE CASCADE,
  total_amount         DECIMAL(10, 2) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'awaiting_verification'
                       CHECK (status IN ('awaiting_verification', 'confirmed', 'cooking', 'ready', 'served', 'completed', 'cancelled')),
  verification_otp     TEXT,
  assigned_waiter_id   TEXT,
  assigned_waiter_name TEXT,
  estimated_minutes    INT NOT NULL DEFAULT 12,
  session_token        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id    TEXT NOT NULL,
  name            TEXT NOT NULL,
  price           DECIMAL(10, 2) NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  station         TEXT NOT NULL CHECK (station IN ('tandoor', 'curry', 'drinks', 'desserts')),
  customization   JSONB NOT NULL DEFAULT '{"spiceLevel":"medium","portionSize":"full"}'::JSONB,
  station_status  TEXT NOT NULL DEFAULT 'pending' CHECK (station_status IN ('pending', 'cooking', 'ready')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- 5. PAYMENTS & REVIEWS
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id            UUID NOT NULL REFERENCES orders(id),
  table_number        TEXT NOT NULL,
  split_ways          INT NOT NULL DEFAULT 1,
  per_person_amount   DECIMAL(10, 2) NOT NULL,
  tip_amount          DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_paid          DECIMAL(10, 2) NOT NULL,
  payment_method      TEXT NOT NULL CHECK (payment_method IN ('upi', 'card', 'cash', 'bank_transfer')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id),
  table_number  TEXT NOT NULL,
  rating        DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  feedback      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- ───────────────────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Public / Anon: Read menu, tables, and submit orders/payments
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT TO anon USING (true);
CREATE POLICY "Public read waiters" ON waiters FOR SELECT TO anon USING (true);
CREATE POLICY "Public read restaurant_tables" ON restaurant_tables FOR SELECT TO anon USING (true);
CREATE POLICY "Public update browsing tables" ON restaurant_tables FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT TO anon WITH CHECK (total_amount > 0);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT TO anon WITH CHECK (quantity > 0);
CREATE POLICY "Public read own orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert payments" ON payments FOR INSERT TO anon WITH CHECK (total_paid > 0);
CREATE POLICY "Public insert reviews" ON customer_reviews FOR INSERT TO anon WITH CHECK (rating >= 1);

-- Staff / Authenticated: Full Management Access
CREATE POLICY "Staff full categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full menu_items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full waiters" ON waiters FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full restaurant_tables" ON restaurant_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full reviews" ON customer_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────
-- 7. REALTIME PUBLICATION SETUP
-- ───────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE waiters;
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
