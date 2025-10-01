import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { UserStoreService } from '../services/user-store.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly userStore = inject(UserStoreService);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    routerState: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.evaluateAccess(route, routerState);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.evaluateAccess(childRoute, state);
  }

  private evaluateAccess(
    route: ActivatedRouteSnapshot,
    routerState: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    void this.authService.restoreSession();

    const requiredRoles = route.data?.['roles'] as readonly string[] | undefined;
    const returnUrl = routerState.url;

    return this.userStore.state$.pipe(
      filter(authState => authState.status !== 'loading'),
      take(1),
      map(authState => {
        if (authState.status !== 'authenticated' || !authState.session) {
          return this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl },
          });
        }

        if (this.isAlwaysAccessibleRoute(route)) {
          return true;
        }

        if (!this.userStore.hasRequiredRole(requiredRoles)) {
          return this.router.createUrlTree(['/dashboard']);
        }

        return true;
      }),
    );
  }

  private isAlwaysAccessibleRoute(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path;
    if (!path) {
      return false;
    }

    return ['dashboard', 'sales', 'storage'].includes(path);
  }
}
