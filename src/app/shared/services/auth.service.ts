import { Injectable, Signal, inject, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

interface SignUpPayload {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);

  private readonly sessionSignal = signal<Session | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  constructor() {
    if (!this.supabase.isConfigured()) {
      return;
    }

    const client = this.supabase.ensureClient();

    void client.auth.getSession().then(({ data }) => {
      this.sessionSignal.set(data.session ?? null);
    });

    client.auth.onAuthStateChange((_event, session) => {
      this.sessionSignal.set(session);
    });
  }

  isConfigured(): boolean {
    return this.supabase.isConfigured();
  }

  configurationError(): Signal<string | null> {
    return this.supabase.configurationError();
  }

  session(): Signal<Session | null> {
    return this.sessionSignal.asReadonly();
  }

  loading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  error(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!this.supabase.isConfigured()) {
      throw new Error('Supabase credentials are not configured.');
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const client = this.supabase.ensureClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in with Supabase.';
      this.errorSignal.set(message);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create Supabase user.';
      this.errorSignal.set(message);
      throw new Error(message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async signOut(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.sessionSignal.set(null);
      return;
    }

    const client = this.supabase.ensureClient();
    const { error } = await client.auth.signOut();
    if (error) {
      throw error;
    }
    this.sessionSignal.set(null);
  }
}
