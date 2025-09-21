# Hassib

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.5.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Supabase configuration

The application now persists authentication, inventory and sales data to Supabase. To finish the setup:

1. **Add environment variables**
   - Copy your project URL and anon key from the Supabase dashboard.
   - Update both `src/environments/environment.ts` and `src/environments/environment.development.ts`:
     ```ts
     export const environment = {
       production: false, // or true in the production file
       supabaseUrl: 'https://your-project.supabase.co',
       supabaseAnonKey: 'public-anon-key'
     };
     ```
   - Restart the dev server after saving the files.

2. **Create the required tables** by running the following SQL in the Supabase SQL editor:
   ```sql
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
     created_at timestamptz default now()
   );

   create table if not exists public.sales_lines (
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
     created_at timestamptz default now()
   );
   ```

3. **Enable row-level security (RLS)** and allow authenticated users to read and write:
   ```sql
   alter table public.inventory_items enable row level security;
   alter table public.sales_lines enable row level security;

   create policy "Inventory access" on public.inventory_items
     for all using (auth.role() = 'authenticated')
     with check (auth.role() = 'authenticated');

   create policy "Sales access" on public.sales_lines
     for all using (auth.role() = 'authenticated')
     with check (auth.role() = 'authenticated');
   ```

4. **Configure authentication** in Supabase (email/password is enabled by default). Users created through the sign-up form will receive a confirmation email.

Once these steps are complete, logging in, signing up, importing inventory and recording sales will store data in Supabase. When the credentials are missing the UI will display a warning so you know the integration still needs configuration.
