import { Routes } from '@angular/router';

import { AuthGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/main-page/main-page.component').then(m => m.MainPageComponent)
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login-page/login-page.component').then(m => m.LoginPageComponent)
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./pages/sign-up-page/sign-up-page.component').then(m => m.SignUpPageComponent)
  },
  {
    path: 'sales',
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'user'] },
    loadComponent: () => import('./pages/sales-page/sales-page.component').then(m => m.SalesPage)
  },
  {
    path: 'storage',
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
    loadComponent: () => import('./pages/storage-page/storage-page.component').then(m => m.StoragePage)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
