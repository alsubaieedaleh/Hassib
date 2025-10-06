-- Ensure multi-tenant columns exist so that the Angular application can scope queries
-- by the authenticated Supabase user. The app already sends the user id with every
-- insert/update, but the original migration file was empty which meant the required
-- columns and row level security policies were never applied.

begin;

-- Storage locations --------------------------------------------------------
alter table if exists public.storage_locations
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_storage_locations_user_id
  on public.storage_locations (user_id);

alter table if exists public.storage_locations enable row level security;

create policy if not exists "Storage locations are scoped per user"
  on public.storage_locations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inventory ----------------------------------------------------------------
alter table if exists public.inventory_items
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_inventory_items_user_id
  on public.inventory_items (user_id);

create index if not exists idx_inventory_items_user_sku
  on public.inventory_items (user_id, sku);

alter table if exists public.inventory_items enable row level security;

create policy if not exists "Inventory is scoped per user"
  on public.inventory_items
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Inventory movements ------------------------------------------------------
alter table if exists public.inventory_movements
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_inventory_movements_user_id
  on public.inventory_movements (user_id);

alter table if exists public.inventory_movements enable row level security;

create policy if not exists "Inventory movements are scoped per user"
  on public.inventory_movements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sales orders -------------------------------------------------------------
alter table if exists public.sales_orders
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_sales_orders_user_id
  on public.sales_orders (user_id);

alter table if exists public.sales_orders enable row level security;

create policy if not exists "Sales orders are scoped per user"
  on public.sales_orders
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sales lines --------------------------------------------------------------
alter table if exists public.sales_lines
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists idx_sales_lines_user_id
  on public.sales_lines (user_id);

alter table if exists public.sales_lines enable row level security;

create policy if not exists "Sales lines are scoped per user"
  on public.sales_lines
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
