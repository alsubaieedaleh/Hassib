import { DestroyRef, Injectable, Signal, inject, signal } from '@angular/core';
import type { AuthChangeEvent, AuthSession } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';
import { UserStoreService } from './user-store.service';

interface SignUpPayload {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

type SupabaseAuthSubscription = { unsubscribe: () => void };

@Injectable({ providedIn: 'root' })

export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly userStore = inject(UserStoreService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  private authSubscription: SupabaseAuthSubscription | null = null;
  private initialisePromise: Promise<void> | null = null;

  constructor() {
    if (!this.supabase.isConfigured()) {
      return;
    }

    void this.restoreSession();
  }

  isConfigured(): boolean {
    return this.supabase.isConfigured();
  }

  configurationError(): Signal<string | null> {
    return this.supabase.configurationError();
  }

  loading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  error(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  async restoreSession(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.userStore.setSession(null);
      return;
    }

    if (this.initialisePromise) {
      return this.initialisePromise;
    }

    this.initialisePromise = this.initialiseAuth();
    try {
      await this.initialisePromise;
    } finally {
      this.initialisePromise = null;
    }
  }

  private async initialiseAuth(): Promise<void> {
    const client = this.supabase.ensureClient();
    this.userStore.setLoading();

    try {
      const { data, error } = await client.auth.getSession();
      if (error) {
        throw error;
      }
      this.userStore.setSession(data.session ?? null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to restore Supabase session.';
      this.userStore.setSession(null);
      this.userStore.setError(message);
    }

    if (!this.authSubscription) {
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event: AuthChangeEvent, session: AuthSession | null) => {
        this.userStore.setSession(session);
      });

      this.authSubscription = subscription;
      this.destroyRef.onDestroy(() => {
        this.authSubscription?.unsubscribe();
        this.authSubscription = null;
      });
    }
  }

  async refreshSession(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.userStore.setSession(null);
      return;
    }

    const client = this.supabase.ensureClient();
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }
    this.userStore.setSession(data.session ?? null);
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.userStore.clearError();

    try {
      const client = this.supabase.ensureClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
      await this.refreshSession();
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Unable to sign in with Supabase.';

      if (error && typeof error === 'object' && 'status' in error) {
        const status = Number((error as { status?: number }).status ?? NaN);
        if (status === 400) {
          message = 'Invalid email or password. Please check your credentials or reset your password.';
        } else if (status >= 500) {
          message = 'Supabase authentication is temporarily unavailable. Please try again shortly.';
        }
      }

      this.errorSignal.set(message);
      this.userStore.setError(message);
      throw new Error(message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signUp(payload: SignUpPayload): Promise<void> {
    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const client = this.supabase.ensureClient();
      const { error } = await client.auth.signUp({
        email: payload.email,
        password: payload.password,
        options: payload.metadata ? { data: payload.metadata } : undefined,
      });

      if (error) {
        throw error;
      }
      await this.refreshSession();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create Supabase user.';
      this.errorSignal.set(message);
      this.userStore.setError(message);
      throw new Error(message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.userStore.setSession(null);
      return;
    }

    const client = this.supabase.ensureClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
    this.userStore.setSession(null);
  }
}
