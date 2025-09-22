-- Migration: create storage, inventory, and sales tables
-- Run this migration in Supabase to provision the tables expected by the Angular application.

create table if not exists public.storage_locations (
  id bigserial primary key,
  name text not null,
  code text unique,
  address text,
  created_at timestamptz default now()
);

create table if not exists public.inventory_items (
  id bigserial primary key,
  barcode text,
  name text not null,
  qty numeric not null default 0,
  price numeric not null default 0,
  cost numeric not null default 0,
  gross_total numeric not null default 0,
  vat_amount numeric not null default 0,
  profit numeric not null default 0,
  payment text,
  phone text,
  location_id bigint references public.storage_locations (id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sales_orders (
  id bigserial primary key,
  reference text unique,
  customer_name text,
  customer_phone text,
  payment_method text,
  subtotal numeric not null default 0,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.sales_lines (
  id bigserial primary key,
  sale_id bigint references public.sales_orders (id) on delete cascade,
  inventory_item_id bigint references public.inventory_items (id) on delete set null,
  barcode text,
  name text not null,
  qty numeric not null default 0,
  price numeric not null default 0,
  cost numeric not null default 0,
  gross_total numeric not null default 0,
  vat_amount numeric not null default 0,
  profit numeric not null default 0,
  payment text,
  phone text,
  created_at timestamptz default now()
);

create table if not exists public.inventory_movements (
  id bigserial primary key,
  inventory_item_id bigint not null references public.inventory_items (id) on delete cascade,
  location_id bigint references public.storage_locations (id) on delete set null,
  change numeric not null,
  reason text,
  created_at timestamptz default now()
);

-- Ensure timestamps update automatically when inventory items are edited.
create or replace function public.set_inventory_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_inventory_items_set_updated_at on public.inventory_items;
create trigger trg_inventory_items_set_updated_at
  before update on public.inventory_items
  for each row execute function public.set_inventory_updated_at();

-- Helpful indexes for lookups used by the application.
create index if not exists idx_inventory_items_barcode on public.inventory_items (barcode);
create index if not exists idx_inventory_items_location on public.inventory_items (location_id);
create index if not exists idx_sales_lines_sale_id on public.sales_lines (sale_id);
create index if not exists idx_sales_lines_created_at on public.sales_lines (created_at desc);

-- Enable row level security with permissive policies for authenticated users.
alter table public.inventory_items enable row level security;
alter table public.sales_lines enable row level security;
alter table public.storage_locations enable row level security;
alter table public.sales_orders enable row level security;
alter table public.inventory_movements enable row level security;

create policy if not exists "Inventory read" on public.inventory_items
  for select using (auth.role() = 'authenticated');
create policy if not exists "Inventory write" on public.inventory_items
  for insert with check (auth.role() = 'authenticated');
create policy if not exists "Inventory delete" on public.inventory_items
  for delete using (auth.role() = 'authenticated');

create policy if not exists "Sales read" on public.sales_lines
  for select using (auth.role() = 'authenticated');
create policy if not exists "Sales write" on public.sales_lines
  for insert with check (auth.role() = 'authenticated');
create policy if not exists "Sales delete" on public.sales_lines
  for delete using (auth.role() = 'authenticated');

create policy if not exists "Storage locations read" on public.storage_locations
  for select using (auth.role() = 'authenticated');
create policy if not exists "Storage locations write" on public.storage_locations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy if not exists "Sales orders access" on public.sales_orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy if not exists "Inventory movements access" on public.inventory_movements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
