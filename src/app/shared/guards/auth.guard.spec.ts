import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthState, UserStoreService } from '../services/user-store.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let createdTree: { commands: any[]; extras?: any } | undefined;
  let state$: Subject<AuthState>;

  beforeEach(() => {
    createdTree = undefined;
    state$ = new Subject<AuthState>();

    const authServiceMock = { restoreSession: jest.fn().mockResolvedValue(undefined) };
    const userStoreMock: Partial<UserStoreService> = {
      state$: state$.asObservable(),
      snapshot: { status: 'loading', session: null, user: null, roles: [], error: null },
      hasRequiredRole: jest.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserStoreService, useValue: userStoreMock },
        {
          provide: Router,
          useValue: {
            createUrlTree: jest.fn().mockImplementation((commands: any[], extras?: any) => {
              createdTree = { commands, extras };
              const joined = Array.isArray(commands) ? commands.join('/') : String(commands);
              return `tree:${joined}`;
            }),
          },
        },
      ],
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('redirects unauthenticated users to login with return url', async () => {
    const resultPromise = firstValueFrom(
      guard.canActivate({ data: {} } as any, { url: '/secure' } as any),
    );

    state$.next({ status: 'unauthenticated', session: null, user: null, roles: [], error: null });

    const result = await resultPromise;
    expect(result).toBe('tree:/login');
    expect(createdTree?.commands).toEqual(['/login']);
    expect(createdTree?.extras?.queryParams?.returnUrl).toBe('/secure');
  });

  it('blocks access when required roles are missing for restricted routes', async () => {
    const userStore = TestBed.inject(UserStoreService) as any;
    userStore.hasRequiredRole.mockReturnValue(false);

    const session: any = { user: { id: 'user-1' } };
    const resultPromise = firstValueFrom(
      guard.canActivate(
        { data: { roles: ['admin'] }, routeConfig: { path: 'admin' } } as any,
        { url: '/admin' } as any,
      ),
    );

    state$.next({
      status: 'authenticated',
      session,
      user: { id: 'user-1', email: 'demo@example.com' },
      roles: ['user'],
      error: null,
    });

    const result = await resultPromise;
    expect(result).toBe('tree:/dashboard');
    expect(createdTree?.commands).toEqual(['/dashboard']);
  });

  it('allows access for authenticated users with a matching role', async () => {
    const session: any = { user: { id: 'user-1' } };
    const resultPromise = firstValueFrom(
      guard.canActivate(
        { data: { roles: ['user'] }, routeConfig: { path: 'sales' } } as any,
        { url: '/sales' } as any,
      ),
    );

    state$.next({
      status: 'authenticated',
      session,
      user: { id: 'user-1', email: 'demo@example.com' },
      roles: ['user'],
      error: null,
    });

    const result = await resultPromise;
    expect(result).toBe(true);
  });

  it('allows access to dashboard, sales, and storage regardless of roles', async () => {
    const userStore = TestBed.inject(UserStoreService) as any;
    userStore.hasRequiredRole.mockReturnValue(false);

    const session: any = { user: { id: 'user-1' } };

    const makeRoute = (path: string) => ({ data: { roles: ['admin'] }, routeConfig: { path } });

    const dashboardResultPromise = firstValueFrom(
      guard.canActivate(makeRoute('dashboard') as any, { url: '/dashboard' } as any),
    );
    const salesResultPromise = firstValueFrom(
      guard.canActivate(makeRoute('sales') as any, { url: '/sales' } as any),
    );
    const storageResultPromise = firstValueFrom(
      guard.canActivate(makeRoute('storage') as any, { url: '/storage' } as any),
    );

    const authState = {
      status: 'authenticated' as const,
      session,
      user: { id: 'user-1', email: 'demo@example.com' },
      roles: ['user'],
      error: null,
    };

    state$.next(authState);

    expect(await dashboardResultPromise).toBe(true);
    expect(await salesResultPromise).toBe(true);
    expect(await storageResultPromise).toBe(true);
  });

  it('redirects via canActivateChild when the user is not authenticated', async () => {
    const resultPromise = firstValueFrom(
      guard.canActivateChild({ data: {} } as any, { url: '/storage' } as any),
    );

    state$.next({ status: 'unauthenticated', session: null, user: null, roles: [], error: null });

    const result = await resultPromise;
    expect(result).toBe('tree:/login');
    expect(createdTree?.commands).toEqual(['/login']);
    expect(createdTree?.extras?.queryParams?.returnUrl).toBe('/storage');
  });
});
