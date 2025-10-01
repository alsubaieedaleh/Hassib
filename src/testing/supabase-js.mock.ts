export type AuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface AuthSession {
  user: AuthUser;
  [key: string]: unknown;
}

export type AuthChangeEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export type Session = AuthSession;

export type SupabaseClient = any;

export const createClient = (
  _url?: unknown,
  _anonKey?: unknown,
  _options?: unknown
): SupabaseClient => ({
  from: () => ({
    select: () => ({
      order: async () => ({ data: [], error: null }),
      single: async () => ({ data: null, error: null }),
    }),
    insert: () => ({
      select: () => ({
        order: async () => ({ data: [], error: null }),
        single: async () => ({ data: null, error: null }),
      }),
      single: async () => ({ data: null, error: null }),
    }),
    update: () => ({ eq: async () => ({ error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
    eq: async () => ({ error: null }),
    order: async () => ({ data: [], error: null }),
    single: async () => ({ data: null, error: null }),
  }),
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
  },
});
