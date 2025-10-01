import type { AuthSession } from '@supabase/supabase-js';

import { UserStoreService } from './user-store.service';

const baseSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
  access_token: 'token',
  expires_at: null,
  expires_in: 3600,
  refresh_token: 'refresh',
  token_type: 'bearer',
  provider_token: null,
  provider_refresh_token: null,
  user: {
    id: 'user-1',
    email: 'demo@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00.000Z',
    role: 'authenticated',
    updated_at: '2024-01-01T00:00:00.000Z',
    identities: [],
    last_sign_in_at: '2024-01-01T00:00:00.000Z',
    factors: [],
    phone: '',
  },
  ...overrides,
});

describe('UserStoreService', () => {
  let service: UserStoreService;

  beforeEach(() => {
    service = new UserStoreService();
  });

  it('starts in a loading state', () => {
    expect(service.snapshot.status).toBe('loading');
    expect(service.snapshot.session).toBeNull();
  });

  it('stores an authenticated session and derives roles from metadata arrays', () => {
    const session = baseSession({
      user: {
        ...baseSession().user,
        app_metadata: { roles: ['admin', 'user'] },
      },
    });

    service.setSession(session);

    expect(service.snapshot.status).toBe('authenticated');
    expect(service.snapshot.user).toEqual({ id: 'user-1', email: 'demo@example.com' });
    expect(service.snapshot.roles).toEqual(['admin', 'user']);
    expect(service.snapshot.error).toBeNull();
  });

  it('falls back to user metadata roles when app metadata is unavailable', () => {
    const session = baseSession({
      user: {
        ...baseSession().user,
        app_metadata: {},
        user_metadata: { role: 'manager' },
      },
    });

    service.setSession(session);

    expect(service.snapshot.roles).toEqual(['manager']);
  });

  it('clears the session and roles when signing out', () => {
    service.setSession(baseSession());
    service.setSession(null);

    expect(service.snapshot.status).toBe('unauthenticated');
    expect(service.snapshot.session).toBeNull();
    expect(service.snapshot.roles).toEqual([]);
  });

  it('tracks errors without mutating the current session', () => {
    service.setSession(baseSession());
    service.setError('Network down');

    expect(service.snapshot.error).toBe('Network down');
    expect(service.snapshot.status).toBe('authenticated');

    service.clearError();

    expect(service.snapshot.error).toBeNull();
  });

  it('verifies role requirements', () => {
    service.setSession(baseSession({
      user: {
        ...baseSession().user,
        app_metadata: { roles: ['admin'] },
      },
    }));

    expect(service.hasRequiredRole(['admin'])).toBe(true);
    expect(service.hasRequiredRole(['user'])).toBe(false);
    expect(service.hasRequiredRole(undefined)).toBe(true);
  });
});
