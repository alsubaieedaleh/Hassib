import { Routes } from '@angular/router';
 
export const routes: Routes = [
    
    {path: "sales", 
        loadComponent: ( )=> import('./pages/sales-page/sales-page.component').then(m => m.SalesPage)
    },
    {path: "", 
        loadComponent: ( )=> import('./pages/landing-page/landing-page.component').then(m => m.LandingPage)
    }

];
