import { Injectable, Signal, signal } from '@angular/core';
import { createClient, SupabaseClient, type AuthUser } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private readonly configuredSignal = signal<boolean>(false);
  private readonly configurationErrorSignal = signal<string | null>(null);

  constructor() {
    this.initialiseClient();
  }

  private initialiseClient(): void {
    const url = environment.supabaseUrl?.trim();
    const anonKey = environment.supabaseAnonKey?.trim();

    if (!url || !anonKey) {
      this.client = null;
      this.configuredSignal.set(false);
      this.configurationErrorSignal.set(
        'Supabase credentials are missing. Update src/environments/environment*.ts with your project URL and anon key.'
      );
      return;
    }

    try {
      this.client = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // Disable the experimental Navigator LockManager integration which can
          // throw when Zone.js intercepts the promise chain. The Hassib dashboard
          // runs in a single-tab context, so falling back to a no-op lock keeps
          // Supabase session management stable without noisy console errors.
          lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
            return await fn();
          },
        },
      });
      this.configuredSignal.set(true);
      this.configurationErrorSignal.set(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialise Supabase client.';
      this.client = null;
      this.configuredSignal.set(false);
      this.configurationErrorSignal.set(message);
    }
  }

  /** Returns true when a Supabase client has been created successfully. */
  isConfigured(): boolean {
    return this.configuredSignal();
  }

  /** Reactive error message describing why Supabase is not ready. */
  configurationError(): Signal<string | null> {
    return this.configurationErrorSignal.asReadonly();
  }

  /** Lazily returns the Supabase client or throws when configuration is missing. */
  ensureClient(): SupabaseClient {
    if (!this.client) {
      this.initialiseClient();
    }

    if (!this.client) {
      throw new Error(
        this.configurationErrorSignal() ??
          'Supabase credentials are not configured. Set supabaseUrl and supabaseAnonKey in the environment file.'
      );
    }

    return this.client;
  }

  /** Returns the authenticated Supabase user or null when no session is available. */
  async getAuthenticatedUser(): Promise<AuthUser | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const client = this.ensureClient();
    const { data, error } = await client.auth.getUser();
    if (error) {
      throw error;
    }

    return data.user ?? null;
  }

  /** Convenience helper to return just the authenticated user's id if available. */
  async getAuthenticatedUserId(): Promise<string | null> {
    const user = await this.getAuthenticatedUser();
    return user?.id ?? null;
  }

  /** Ensures a user id is present for the current session or throws a descriptive error. */
  async requireAuthenticatedUserId(): Promise<string> {
    const userId = await this.getAuthenticatedUserId();
    if (!userId) {
      throw new Error('User is not authenticated.');
    }
    return userId;
  }
}
