import { Routes } from '@angular/router';

import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/landing-page/landing-page.component').then(m => m.LandingPageComponent),
  },
  {
    path: 'landing',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./pages/sign-up-page/sign-up-page.component').then(m => m.SignUpPageComponent),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    loadComponent: () =>
      import('./layouts/authenticated-layout/authenticated-layout.component').then(
        m => m.AuthenticatedLayoutComponent,
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/main-page/main-page.component').then(m => m.MainPageComponent),
      },
      {
        path: 'sales',
        data: { roles: ['admin', 'user'] },
        loadComponent: () =>
          import('./pages/sales-page/sales-page.component').then(m => m.SalesPage),
      },
      {
        path: 'storage',
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./pages/storage-page/storage-page.component').then(m => m.StoragePage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
