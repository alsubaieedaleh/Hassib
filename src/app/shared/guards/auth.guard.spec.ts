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

  it('blocks access when required roles are missing', async () => {
    const userStore = TestBed.inject(UserStoreService) as any;
    userStore.hasRequiredRole.mockReturnValue(false);

    const session: any = { user: { id: 'user-1' } };
    const resultPromise = firstValueFrom(
      guard.canActivate({ data: { roles: ['admin'] } } as any, { url: '/admin' } as any),
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
      guard.canActivate({ data: { roles: ['user'] } } as any, { url: '/sales' } as any),
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
