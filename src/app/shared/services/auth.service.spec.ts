import { TestBed } from '@angular/core/testing';
import type { AuthSession } from '@supabase/supabase-js';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { UserStoreService } from './user-store.service';

const createSession = (overrides: Partial<AuthSession> = {}): AuthSession => ({
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
    app_metadata: { roles: ['user'] },
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

describe('AuthService', () => {
  let service: AuthService;
  let supabaseClientMock: any;
  let userStore: UserStoreService;
  let authStateChangeHandler: ((event: string, session: AuthSession | null) => void) | null;

  beforeEach(() => {
    authStateChangeHandler = null;
    supabaseClientMock = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signInWithPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
        signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
        onAuthStateChange: jest.fn().mockImplementation(handler => {
          authStateChangeHandler = handler;
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }),
      },
    };

    const supabaseServiceMock = {
      isConfigured: jest.fn().mockReturnValue(true),
      ensureClient: jest.fn().mockReturnValue(supabaseClientMock),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        UserStoreService,
        { provide: SupabaseService, useValue: supabaseServiceMock },
      ],
    });

    service = TestBed.inject(AuthService);
    userStore = TestBed.inject(UserStoreService);
  });

  it('restores the current session on startup', async () => {
    const session = createSession();
    supabaseClientMock.auth.getSession.mockResolvedValue({ data: { session }, error: null });

    await service.restoreSession();

    expect(userStore.snapshot.status).toBe('authenticated');
    expect(userStore.snapshot.session).toEqual(session);
  });

  it('updates the user store after successful sign in', async () => {
    const session = createSession();
    supabaseClientMock.auth.getSession
      .mockResolvedValueOnce({ data: { session: null }, error: null })
      .mockResolvedValue({ data: { session }, error: null });

    await service.restoreSession();
    await service.signIn('demo@example.com', 'password123');

    expect(supabaseClientMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'demo@example.com',
      password: 'password123',
    });
    expect(userStore.snapshot.status).toBe('authenticated');
    expect(userStore.snapshot.roles).toContain('user');
  });

  it('clears the session after sign out', async () => {
    userStore.setSession(createSession());

    await service.signOut();

    expect(supabaseClientMock.auth.signOut).toHaveBeenCalled();
    expect(userStore.snapshot.status).toBe('unauthenticated');
  });

  it('responds to Supabase auth state changes', async () => {
    await service.restoreSession();

    expect(authStateChangeHandler).toBeTruthy();

    const session = createSession({ user: { ...createSession().user, email: 'new@example.com' } });
    authStateChangeHandler?.('SIGNED_IN', session);

    expect(userStore.snapshot.user).toEqual({ id: 'user-1', email: 'new@example.com' });
  });
});
