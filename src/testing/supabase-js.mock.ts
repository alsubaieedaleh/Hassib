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

const createQueryBuilder = () => {
  const baseResult = { data: [], error: null };
  const order = jest.fn().mockResolvedValue(baseResult);
  const single = jest.fn().mockResolvedValue({ data: null, error: null });

  const builder: any = {
    order,
    single,
  };

  builder.eq = jest.fn().mockReturnValue(builder);

  return builder;
};

const createMutationBuilder = () => {
  const eqResult = { error: null };
  const builder: any = {
    eq: jest.fn().mockResolvedValue(eqResult),
  };

  return builder;
};

const createInsertBuilder = () => {
  const selectBuilder = createQueryBuilder();
  return {
    select: jest.fn().mockReturnValue(selectBuilder),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };
};

const createAuthApi = () => {
  const unsubscribe = jest.fn();

  return {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe } }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };
};

export const createClient = jest.fn(
  (_url?: unknown, _anonKey?: unknown, _options?: unknown) => {
    const queryBuilder = createQueryBuilder();

    return {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(createQueryBuilder()),
        insert: jest.fn().mockImplementation(() => createInsertBuilder()),
        update: jest.fn().mockImplementation(() => createMutationBuilder()),
        delete: jest.fn().mockImplementation(() => createMutationBuilder()),
        eq: queryBuilder.eq,
        order: queryBuilder.order,
        single: queryBuilder.single,
      }),
      auth: createAuthApi(),
    };
  }
);

export type SupabaseClient = ReturnType<typeof createClient>;
