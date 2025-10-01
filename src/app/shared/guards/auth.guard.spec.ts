import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthState, UserStoreService } from '../services/user-store.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let navigateUrl: string | undefined;
  let state$: Subject<AuthState>;

  beforeEach(() => {
    navigateUrl = undefined;
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
            createUrlTree: jest.fn().mockImplementation(url => {
              navigateUrl = Array.isArray(url) ? url.join('/') : url;
              return `tree:${navigateUrl}`;
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
    expect(navigateUrl).toBe('/login');
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
    expect(result).toBe('tree:/');
    expect(navigateUrl).toBe('/');
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
});
