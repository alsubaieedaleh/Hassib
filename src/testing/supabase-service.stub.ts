import { Signal, signal } from '@angular/core';

export class SupabaseServiceStub {
  private readonly errorSignal = signal<string | null>('Supabase credentials are not configured for unit tests.');

  isConfigured(): boolean {
    return false;
  }

  configurationError(): Signal<string | null> {
    return this.errorSignal.asReadonly();
  }

  ensureClient(): never {
    throw new Error('Supabase client is not available in the unit test environment.');
  }

  async getAuthenticatedUser(): Promise<null> {
    return null;
  }

  async getAuthenticatedUserId(): Promise<string | null> {
    return null;
  }

  async requireAuthenticatedUserId(): Promise<string> {
    throw new Error('User is not authenticated.');
  }
}
