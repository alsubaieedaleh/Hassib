# Supabase Integration Guide

This document explains how the application interacts with Supabase and the steps required to
configure a project from scratch. Follow the sections in order when setting up a new Supabase
instance.

## 1. Create a Supabase project
1. Sign in to [Supabase](https://supabase.com) and create a new project.
2. Once the project has been provisioned, open **Project Settings → API** and copy the
   **Project URL** and **anon public key**. These credentials are required by the Angular
   application.

## 2. Configure environment variables
Update both `src/environments/environment.ts` and `src/environments/environment.development.ts`
with the values you copied above:

```ts
export const environment = {
  production: false, // set to true in the production file
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'public-anon-key'
};
```

Restart the dev server (`npm start`) after changing these files so that Angular picks up the new
values.

## 3. Database schema
The application uses Supabase tables for inventory (storage) and sales data. The statements below
create the minimum schema and connect the tables together. Run them in the Supabase SQL editor or as
part of a migration script.

```sql
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
```

The Angular services continue to work because `sales_lines` still accepts direct inserts. When you
start capturing full sales orders in the UI, populate `sale_id` and `inventory_item_id` so each line
links back to the order header and the item stored in inventory.

### Helpful views and triggers (optional)
- Track automatic timestamps on updates by adding a trigger:
  ```sql
  create or replace function public.set_updated_at()
  returns trigger as $$
  begin
    new.updated_at = timezone('utc', now());
    return new;
  end;
  $$ language plpgsql;

  drop trigger if exists trg_inventory_items_set_updated_at on public.inventory_items;
  create trigger trg_inventory_items_set_updated_at
    before update on public.inventory_items
    for each row execute function public.set_updated_at();
  ```
- Create a reporting view that joins orders with their lines and inventory metadata:
  ```sql
  create or replace view public.v_sales_detail as
  select
    o.id as sale_id,
    o.reference,
    o.customer_name,
    o.payment_method,
    o.total,
    o.created_at as sale_created_at,
    l.id as sales_line_id,
    l.qty,
    l.price,
    l.gross_total,
    coalesce(i.name, l.name) as item_name,
    i.location_id
  from public.sales_orders o
  join public.sales_lines l on l.sale_id = o.id
  left join public.inventory_items i on i.id = l.inventory_item_id;
  ```

### Optional indexes and constraints
- Add a unique constraint on `inventory_items.barcode` if each barcode should only appear once:
  ```sql
  alter table public.inventory_items add constraint inventory_items_barcode_unique unique (barcode);
  ```
- Create indexes to speed up common lookups and joins:
  ```sql
  create index if not exists idx_inventory_items_barcode on public.inventory_items (barcode);
  create index if not exists idx_inventory_items_location on public.inventory_items (location_id);
  create index if not exists idx_sales_lines_sale_id on public.sales_lines (sale_id);
  create index if not exists idx_sales_lines_created_at on public.sales_lines (created_at desc);
  ```

## 4. Row Level Security (RLS)
Enable RLS on the tables so that only authenticated users can access them. The following policies
provide the minimal permissions required by the application (read and write for authenticated
users). Add stricter checks if you implement multi-tenant separation.

```sql
alter table public.inventory_items enable row level security;
alter table public.sales_lines enable row level security;
alter table public.storage_locations enable row level security;
alter table public.sales_orders enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Inventory read" on public.inventory_items
  for select using (auth.role() = 'authenticated');
create policy "Inventory write" on public.inventory_items
  for insert with check (auth.role() = 'authenticated');
create policy "Inventory delete" on public.inventory_items
  for delete using (auth.role() = 'authenticated');

create policy "Sales read" on public.sales_lines
  for select using (auth.role() = 'authenticated');
create policy "Sales write" on public.sales_lines
  for insert with check (auth.role() = 'authenticated');
create policy "Sales delete" on public.sales_lines
  for delete using (auth.role() = 'authenticated');

create policy "Storage locations read" on public.storage_locations
  for select using (auth.role() = 'authenticated');
create policy "Storage locations write" on public.storage_locations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Sales orders access" on public.sales_orders
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Inventory movements access" on public.inventory_movements
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
```

If you require multi-tenant separation (e.g. each user should only see their own data), extend the
schema with a `user_id uuid references auth.users (id)` column on the tables you need to scope and
update the policies accordingly (`auth.uid() = user_id`).

## 5. Authentication configuration
Email/password authentication is enabled by default in Supabase. Make sure SMTP settings are
configured in **Authentication → Providers** if you want users to receive confirmation or password
reset emails from your own domain. The Angular application displays configuration errors when the
Supabase credentials are missing so you can verify everything is wired correctly.

## 6. Local testing tips
- The services in `src/app/shared/services` read the Supabase settings at application start. When the
  configuration is missing, the UI surfaces clear error messages, allowing you to finish the setup
  later without breaking the app.
- Use the Supabase dashboard or the SQL editor to inspect data inserted by the application during
  development.
- When running automated tests (`npm test`), consider mocking the Supabase client if you need to
  cover behaviours that depend on the backend.

