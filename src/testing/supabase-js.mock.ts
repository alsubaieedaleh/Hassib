export type SupabaseClient = any;

export interface Session {
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  } | null;
}

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
