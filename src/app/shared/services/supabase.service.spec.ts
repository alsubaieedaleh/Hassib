import { environment } from '../../../environments/environment';
import { SupabaseService } from './supabase.service';
import { createClient } from '@supabase/supabase-js';

const originalUrl = environment.supabaseUrl;
const originalAnonKey = environment.supabaseAnonKey;

const getMockedCreateClient = () => createClient as jest.MockedFunction<typeof createClient>;

const createMockSupabaseClient = () => {
  const auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest
      .fn()
      .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
    signUp: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  };

  return {
    from: jest.fn(),
    auth,
  };
};

describe('SupabaseService', () => {
  beforeEach(() => {
    environment.supabaseUrl = originalUrl;
    environment.supabaseAnonKey = originalAnonKey;
    getMockedCreateClient().mockReset();
  });

  afterAll(() => {
    environment.supabaseUrl = originalUrl;
    environment.supabaseAnonKey = originalAnonKey;
  });

  it('initialises Supabase when credentials are configured', () => {
    const mockClient = createMockSupabaseClient();
    getMockedCreateClient().mockReturnValue(mockClient);

    const service = new SupabaseService();

    expect(createClient).toHaveBeenCalledWith(
      originalUrl.trim(),
      originalAnonKey.trim(),
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: true,
          autoRefreshToken: true,
          lock: expect.any(Function),
        }),
      })
    );
    expect(service.isConfigured()).toBe(true);
    expect(service.configurationError()()).toBeNull();
    expect(service.ensureClient()).toBe(mockClient);
  });

  it('surfaces a helpful error when credentials are missing', () => {
    environment.supabaseUrl = '' as unknown as typeof originalUrl;
    environment.supabaseAnonKey = '' as unknown as typeof originalAnonKey;

    const service = new SupabaseService();

    expect(createClient).not.toHaveBeenCalled();
    expect(service.isConfigured()).toBe(false);
    expect(service.configurationError()()).toContain('Supabase credentials are missing');
    expect(() => service.ensureClient()).toThrow('Supabase credentials are missing');
  });

  it('retries initialisation when ensureClient is called after credentials are restored', () => {
    environment.supabaseUrl = '' as unknown as typeof originalUrl;
    environment.supabaseAnonKey = '' as unknown as typeof originalAnonKey;
    const service = new SupabaseService();
    expect(service.isConfigured()).toBe(false);

    const mockClient = createMockSupabaseClient();
    environment.supabaseUrl = originalUrl;
    environment.supabaseAnonKey = originalAnonKey;
    getMockedCreateClient().mockReturnValue(mockClient);

    const ensured = service.ensureClient();

    expect(createClient).toHaveBeenCalledTimes(1);
    expect(ensured).toBe(mockClient);
    expect(service.isConfigured()).toBe(true);
  });

  it('returns the authenticated user when Supabase returns one', async () => {
    const mockClient = createMockSupabaseClient();
    const user = { id: 'user-123', email: 'user@example.com' };
    mockClient.auth.getUser.mockResolvedValue({ data: { user }, error: null });
    getMockedCreateClient().mockReturnValue(mockClient);

    const service = new SupabaseService();
    const result = await service.getAuthenticatedUser();

    expect(mockClient.auth.getUser).toHaveBeenCalled();
    expect(result).toEqual(user);
  });

  it('returns null when no user session is available', async () => {
    const mockClient = createMockSupabaseClient();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    getMockedCreateClient().mockReturnValue(mockClient);

    const service = new SupabaseService();
    const result = await service.getAuthenticatedUser();

    expect(result).toBeNull();
  });

  it('throws the Supabase error if fetching the user fails', async () => {
    const mockClient = createMockSupabaseClient();
    const failure = new Error('network down');
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: failure });
    getMockedCreateClient().mockReturnValue(mockClient);

    const service = new SupabaseService();

    await expect(service.getAuthenticatedUser()).rejects.toThrow(failure);
  });

  it('returns only the user id from getAuthenticatedUserId', async () => {
    const mockClient = createMockSupabaseClient();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: { id: 'abc-123' } }, error: null });
    getMockedCreateClient().mockReturnValue(mockClient);

    const service = new SupabaseService();
    const userId = await service.getAuthenticatedUserId();

    expect(userId).toBe('abc-123');
  });

  it('throws a descriptive error when requireAuthenticatedUserId is called without a session', async () => {
    const mockClient = createMockSupabaseClient();
    mockClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    getMockedCreateClient().mockReturnValue(mockClient);

    const service = new SupabaseService();

    await expect(service.requireAuthenticatedUserId()).rejects.toThrow('User is not authenticated.');
  });
});
