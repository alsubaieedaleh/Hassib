-- Migration: Associate domain tables with auth.users and enforce row-level security
-- Date: 2024-05-04

-- Ensure the uuid-ossp extension exists for UUID utilities when needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. storage_locations -------------------------------------------------------
ALTER TABLE storage_locations
  ADD COLUMN IF NOT EXISTS code text;

ALTER TABLE storage_locations
  ADD COLUMN IF NOT EXISTS user_id uuid;

WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
UPDATE storage_locations AS s
SET user_id = first_user.id
FROM first_user
WHERE s.user_id IS NULL;

ALTER TABLE storage_locations
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE storage_locations
  ADD CONSTRAINT storage_locations_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS storage_locations_user_id_idx
  ON storage_locations(user_id);

-- 2. inventory_items ---------------------------------------------------------
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS user_id uuid;

WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
UPDATE inventory_items AS i
SET user_id = first_user.id
FROM first_user
WHERE i.user_id IS NULL;

ALTER TABLE inventory_items
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_location_user_fk
    FOREIGN KEY (location_id)
    REFERENCES storage_locations(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inventory_items_user_id_idx
  ON inventory_items(user_id);

-- 3. inventory_movements -----------------------------------------------------
ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS user_id uuid;

WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
UPDATE inventory_movements AS m
SET user_id = first_user.id
FROM first_user
WHERE m.user_id IS NULL;

ALTER TABLE inventory_movements
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_inventory_fk
    FOREIGN KEY (inventory_item_id)
    REFERENCES inventory_items(id)
    ON DELETE CASCADE;

ALTER TABLE inventory_movements
  ADD CONSTRAINT inventory_movements_location_fk
    FOREIGN KEY (location_id)
    REFERENCES storage_locations(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS inventory_movements_user_id_idx
  ON inventory_movements(user_id);

-- 4. sales_orders ------------------------------------------------------------
ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS customer_phone text;

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS user_id uuid;

WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
UPDATE sales_orders AS o
SET user_id = first_user.id
FROM first_user
WHERE o.user_id IS NULL;

ALTER TABLE sales_orders
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE sales_orders
  ADD CONSTRAINT sales_orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS sales_orders_user_id_idx
  ON sales_orders(user_id);

-- 5. sales_lines -------------------------------------------------------------
ALTER TABLE sales_lines
  ADD COLUMN IF NOT EXISTS user_id uuid;

WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
UPDATE sales_lines AS l
SET user_id = first_user.id
FROM first_user
WHERE l.user_id IS NULL;

ALTER TABLE sales_lines
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE sales_lines
  ADD CONSTRAINT sales_lines_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sales_lines
  ADD CONSTRAINT sales_lines_order_fk
    FOREIGN KEY (sale_id)
    REFERENCES sales_orders(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS sales_lines_user_id_idx
  ON sales_lines(user_id);

-- Composite helper indexes for ownership checks
CREATE INDEX IF NOT EXISTS inventory_items_user_id_id_idx
  ON inventory_items(user_id, id);

CREATE INDEX IF NOT EXISTS sales_orders_user_id_id_idx
  ON sales_orders(user_id, id);

CREATE INDEX IF NOT EXISTS storage_locations_user_id_id_idx
  ON storage_locations(user_id, id);

-- 6. Row Level Security ------------------------------------------------------
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations FORCE ROW LEVEL SECURITY;

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items FORCE ROW LEVEL SECURITY;

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements FORCE ROW LEVEL SECURITY;

ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_orders FORCE ROW LEVEL SECURITY;

ALTER TABLE sales_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_lines FORCE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DROP POLICY IF EXISTS storage_locations_owner_select ON storage_locations;
DROP POLICY IF EXISTS storage_locations_owner_insert ON storage_locations;
DROP POLICY IF EXISTS storage_locations_owner_update ON storage_locations;
DROP POLICY IF EXISTS storage_locations_owner_delete ON storage_locations;

DROP POLICY IF EXISTS inventory_items_owner_select ON inventory_items;
DROP POLICY IF EXISTS inventory_items_owner_insert ON inventory_items;
DROP POLICY IF EXISTS inventory_items_owner_update ON inventory_items;
DROP POLICY IF EXISTS inventory_items_owner_delete ON inventory_items;

DROP POLICY IF EXISTS inventory_movements_owner_select ON inventory_movements;
DROP POLICY IF EXISTS inventory_movements_owner_insert ON inventory_movements;
DROP POLICY IF EXISTS inventory_movements_owner_update ON inventory_movements;
DROP POLICY IF EXISTS inventory_movements_owner_delete ON inventory_movements;

DROP POLICY IF EXISTS sales_orders_owner_select ON sales_orders;
DROP POLICY IF EXISTS sales_orders_owner_insert ON sales_orders;
DROP POLICY IF EXISTS sales_orders_owner_update ON sales_orders;
DROP POLICY IF EXISTS sales_orders_owner_delete ON sales_orders;

DROP POLICY IF EXISTS sales_lines_owner_select ON sales_lines;
DROP POLICY IF EXISTS sales_lines_owner_insert ON sales_lines;
DROP POLICY IF EXISTS sales_lines_owner_update ON sales_lines;
DROP POLICY IF EXISTS sales_lines_owner_delete ON sales_lines;

-- storage_locations policies
CREATE POLICY storage_locations_owner_select
  ON storage_locations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY storage_locations_owner_insert
  ON storage_locations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY storage_locations_owner_update
  ON storage_locations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY storage_locations_owner_delete
  ON storage_locations
  FOR DELETE
  USING (user_id = auth.uid());

-- inventory_items policies
CREATE POLICY inventory_items_owner_select
  ON inventory_items
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY inventory_items_owner_insert
  ON inventory_items
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY inventory_items_owner_update
  ON inventory_items
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY inventory_items_owner_delete
  ON inventory_items
  FOR DELETE
  USING (user_id = auth.uid());

-- inventory_movements policies
CREATE POLICY inventory_movements_owner_select
  ON inventory_movements
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY inventory_movements_owner_insert
  ON inventory_movements
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      inventory_item_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM inventory_items i
        WHERE i.id = inventory_item_id
          AND i.user_id = auth.uid()
      )
    )
    AND (
      location_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM storage_locations s
        WHERE s.id = location_id
          AND s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY inventory_movements_owner_update
  ON inventory_movements
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      inventory_item_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM inventory_items i
        WHERE i.id = inventory_item_id
          AND i.user_id = auth.uid()
      )
    )
    AND (
      location_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM storage_locations s
        WHERE s.id = location_id
          AND s.user_id = auth.uid()
      )
    )
  );

CREATE POLICY inventory_movements_owner_delete
  ON inventory_movements
  FOR DELETE
  USING (user_id = auth.uid());

-- sales_orders policies
CREATE POLICY sales_orders_owner_select
  ON sales_orders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY sales_orders_owner_insert
  ON sales_orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY sales_orders_owner_update
  ON sales_orders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY sales_orders_owner_delete
  ON sales_orders
  FOR DELETE
  USING (user_id = auth.uid());

-- sales_lines policies
CREATE POLICY sales_lines_owner_select
  ON sales_lines
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY sales_lines_owner_insert
  ON sales_lines
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      sale_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM sales_orders o
        WHERE o.id = sale_id
          AND o.user_id = auth.uid()
      )
    )
  );

CREATE POLICY sales_lines_owner_update
  ON sales_lines
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      sale_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM sales_orders o
        WHERE o.id = sale_id
          AND o.user_id = auth.uid()
      )
    )
  );

CREATE POLICY sales_lines_owner_delete
  ON sales_lines
  FOR DELETE
  USING (user_id = auth.uid());
