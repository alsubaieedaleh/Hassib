import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/marketing-landing/marketing-landing.component').then(m => m.MarketingLandingPage)
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
    path: 'app',
    loadComponent: () => import('./pages/landing-page/landing-page.component').then(m => m.LandingPage)
  },
  {
    path: 'sales',
    loadComponent: () => import('./pages/sales-page/sales-page.component').then(m => m.SalesPage)
  },
  {
    path: 'storage',
    loadComponent: () => import('./pages/storage-page/storage-page.component').then(m => m.StoragePage)
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
