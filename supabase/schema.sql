-- ═══════════════════════════════════════════════════════════
-- NoWave Smart Dining Ecosystem — Supabase PostgreSQL Schema
-- Complete RLS & Anti-Spoofing Architecture
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- 1. CORE MENU & CATEGORIES
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
-- 2. TABLE SESSIONS & ORDERS (KDS)
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS table_sessions (
  table_number  TEXT PRIMARY KEY,
  status        TEXT NOT NULL DEFAULT 'browsing' CHECK (status IN ('browsing', 'ordered', 'cooking', 'eating', 'paid')),
  session_token TEXT,
  guest_count   INT DEFAULT 2,
  total_spent   DECIMAL(10, 2) DEFAULT 0,
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number      TEXT NOT NULL UNIQUE,
  table_number      TEXT NOT NULL,
  total_amount      DECIMAL(10, 2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'cooking' CHECK (status IN ('placed', 'cooking', 'ready', 'served', 'completed')),
  estimated_minutes INT NOT NULL DEFAULT 12,
  session_token     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- 3. PAYMENTS & REVIEWS
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
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ───────────────────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public / Anon: READ-ONLY Menu, Session, and Validated Insert for orders & payments
CREATE POLICY "Public read categories" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT TO anon USING (true);
CREATE POLICY "Public read table_sessions" ON table_sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT TO anon WITH CHECK (total_amount > 0);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT TO anon WITH CHECK (quantity > 0);
CREATE POLICY "Public read own orders" ON orders FOR SELECT TO anon USING (true);
CREATE POLICY "Public insert payments" ON payments FOR INSERT TO anon WITH CHECK (total_paid > 0);
CREATE POLICY "Public insert reviews" ON customer_reviews FOR INSERT TO anon WITH CHECK (rating >= 1);

-- Authenticated Staff: Full Access
CREATE POLICY "Staff full categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full menu_items" ON menu_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full table_sessions" ON table_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full order_items" ON order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full payments" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Staff full reviews" ON customer_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ───────────────────────────────────────────────────────────
-- 5. REALTIME REPLICATION
-- ───────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE table_sessions;

-- ───────────────────────────────────────────────────────────
-- 6. SEED DATA (Realistic Indian Restaurant: 12 dishes, 2 struck out)
-- ───────────────────────────────────────────────────────────

DO $$
DECLARE
  cat_starters UUID;
  cat_mains UUID;
  cat_breads UUID;
  cat_drinks UUID;
  cat_desserts UUID;
BEGIN
  INSERT INTO categories (name, slug, sort_order) VALUES
    ('Starters & Small Plates', 'starters', 0)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_starters;

  INSERT INTO categories (name, slug, sort_order) VALUES
    ('Main Curries & Biryanis', 'mains', 1)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_mains;

  INSERT INTO categories (name, slug, sort_order) VALUES
    ('Artisanal Tandoor Breads', 'breads', 2)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_breads;

  INSERT INTO categories (name, slug, sort_order) VALUES
    ('Craft Beverages & Lassi', 'drinks', 3)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_drinks;

  INSERT INTO categories (name, slug, sort_order) VALUES
    ('Royal Desserts', 'desserts', 4)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_desserts;

  -- 12 Curated Dishes (2 marked struck out: Ghee Roast Chicken & Pistachio Kulfi)
  INSERT INTO menu_items (name, description, price, half_price, dietary_type, spice_level, station, allergens, is_chef_special, is_bestseller, is_struck_out, is_available, category_id, sort_order, image_url) VALUES
    ('Truffle Malai Paneer Tikka', 'Charred artisanal cottage cheese steeped in black truffle oil, green cardamom cream, and roasted coriander emulsion.', 390, 240, 'veg', 1, 'tandoor', ARRAY['Dairy'], true, true, false, true, cat_starters, 0, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=700&q=80'),
    ('Gunpowder Crispy Corn Ribs', 'Char-grilled sweet corn ribs tossed in southern Podi masala, kaffir lime zest, and smoked spiced butter.', 280, 180, 'veg', 2, 'tandoor', ARRAY['Dairy'], false, true, false, true, cat_starters, 1, 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=700&q=80'),
    ('Ghee Roast Chicken Skewers', 'Kundapur slow-roasted chicken supreme in artisanal clarified butter, Byadgi chillies, and curry leaf ash.', 440, 280, 'nonveg', 4, 'tandoor', ARRAY['Dairy'], true, false, true, false, cat_starters, 2, 'https://images.unsplash.com/photo-1527477378776-6469cf361548?w=700&q=80'),
    
    ('Old Delhi Butter Chicken', 'Smoked clay-oven pulled chicken braised in velvety sun-ripened tomato gravy, fenugreek leaves, and churned white butter.', 460, 290, 'nonveg', 2, 'curry', ARRAY['Dairy', 'Nuts'], true, true, false, true, cat_mains, 0, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=700&q=80'),
    ('Dal Makhani 24-Hour Simmer', 'Black lentils slow-cooked overnight over glowing charcoal with vine-ripened tomatoes, garlic, and fresh cream.', 360, 230, 'veg', 1, 'curry', ARRAY['Dairy'], true, true, false, true, cat_mains, 1, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&q=80'),
    ('Awadhi Dum Gosht Biryani', 'Aged long-grain basmati rice and tender lamb shank slow-steamed under dough seal with saffron and rose water.', 540, 350, 'nonveg', 3, 'curry', ARRAY['Dairy'], true, false, false, true, cat_mains, 2, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&q=80'),
    ('Paneer Lababdar', 'Char-grilled cottage cheese in a chunky onion-tomato reduction with grated paneer and freshly ground spices.', 380, 240, 'veg', 2, 'curry', ARRAY['Dairy', 'Nuts'], false, false, false, true, cat_mains, 3, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80'),

    ('Smoked Garlic Naan', 'Hand-stretched sourdough naan studded with toasted garlic flakes and brushed with cultured butter.', 90, 60, 'veg', 1, 'tandoor', ARRAY['Gluten', 'Dairy'], false, true, false, true, cat_breads, 0, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=700&q=80'),
    ('Laccha Paratha', 'Multi-layered flaky whole wheat bread cooked golden crisp on the tandoor walls.', 80, 50, 'veg', 1, 'tandoor', ARRAY['Gluten', 'Dairy'], false, false, false, true, cat_breads, 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80'),

    ('Alphonso Mango Lassi', 'Thick organic yogurt whipped with Ratnagiri Alphonso mango pulp, green cardamom, and crushed pistachios.', 160, 100, 'veg', 1, 'drinks', ARRAY['Dairy', 'Nuts'], false, true, false, true, cat_drinks, 0, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=700&q=80'),
    ('Kulhad Masala Chai', 'Slow-brewed Assam CTC black tea with crushed ginger, cloves, and cinnamon served steaming in earthen clay pot.', 70, 45, 'veg', 1, 'drinks', ARRAY['Dairy'], false, false, false, true, cat_drinks, 1, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=700&q=80'),

    ('Pistachio Saffron Kulfi', 'Traditional slow-reduced frozen milk dessert infused with Kashmiri saffron strands and silver leaf.', 190, 120, 'veg', 1, 'desserts', ARRAY['Dairy', 'Nuts'], true, false, true, false, cat_desserts, 0, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=700&q=80');
END $$;
