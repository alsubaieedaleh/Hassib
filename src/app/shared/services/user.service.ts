import { Injectable, Signal, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';

export interface StoredUser {
  id: string;
  email: string | null;
  fullName: string | null;
  metadata: Record<string, unknown>;
}

const STORAGE_KEY = 'hassib.user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly userSignal = signal<StoredUser | null>(null);

  constructor() {
    this.hydrateFromStorage();
  }

  user(): Signal<StoredUser | null> {
    return this.userSignal.asReadonly();
  }

  isLoggedIn(): boolean {
    return this.userSignal() !== null;
  }

  clear(): void {
    this.setUser(null);
  }

  setUser(user: StoredUser | null): void {
    this.userSignal.set(user);

    if (!this.hasStorage()) {
      return;
    }

    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  syncFromSession(session: Session | null): void {
    if (!session?.user) {
      this.clear();
      return;
    }

    const { user } = session;
    const profile: StoredUser = {
      id: user.id,
      email: user.email ?? null,
      fullName: (user.user_metadata?.['full_name'] as string | undefined) ?? null,
      metadata: user.user_metadata ?? {},
    };

    this.setUser(profile);
  }

  private hydrateFromStorage(): void {
    if (!this.hasStorage()) {
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredUser;
      if (parsed && typeof parsed.id === 'string') {
        this.userSignal.set(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse stored user profile', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private hasStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
