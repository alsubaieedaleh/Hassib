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

The application persists authentication, inventory and sales data to Supabase. A detailed, step-by-step
guide covering the required environment variables, database schema, optional indexes, row-level
security policies and authentication settings is available in [SUPABASE.md](./SUPABASE.md).

Once you finish the setup described there, logging in, signing up, importing inventory and recording
sales will store data in Supabase. When the credentials are missing the UI displays a warning so you
know the integration still needs configuration.
