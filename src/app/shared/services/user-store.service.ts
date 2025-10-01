import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { AuthSession } from '@supabase/supabase-js';

type Session = AuthSession;

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUserSummary {
  id: string;
  email?: string;
}

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: AuthUserSummary | null;
  roles: readonly string[];
  error: string | null;
}

const INITIAL_STATE: AuthState = {
  status: 'loading',
  session: null,
  user: null,
  roles: [],
  error: null,
};

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private readonly stateSubject = new BehaviorSubject<AuthState>(INITIAL_STATE);

  readonly state$: Observable<AuthState> = this.stateSubject.asObservable();

  get snapshot(): AuthState {
    return this.stateSubject.getValue();
  }

  setLoading(): void {
    const current = this.snapshot;
    this.stateSubject.next({
      ...current,
      status: 'loading',
    });
  }

  setSession(session: Session | null): void {
    if (!session) {
      this.stateSubject.next({
        status: 'unauthenticated',
        session: null,
        user: null,
        roles: [],
        error: null,
      });
      return;
    }

    const roles = this.extractRoles(session);
    this.stateSubject.next({
      status: 'authenticated',
      session,
      user: {
        id: session.user.id,
        email: session.user.email ?? undefined,
      },
      roles,
      error: null,
    });
  }

  setError(error: string): void {
    const current = this.snapshot;
    this.stateSubject.next({
      ...current,
      error,
    });
  }

  clearError(): void {
    const current = this.snapshot;
    if (!current.error) {
      return;
    }

    this.stateSubject.next({
      ...current,
      error: null,
    });
  }

  hasRequiredRole(roles: readonly string[] | undefined): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }

    const currentRoles = this.snapshot.roles;
    if (!currentRoles || currentRoles.length === 0) {
      return false;
    }

    return roles.some(role => currentRoles.includes(role));
  }

  private extractRoles(session: Session): readonly string[] {
    const fromAppMetadata = session.user.app_metadata?.['roles'];
    if (Array.isArray(fromAppMetadata)) {
      return fromAppMetadata.filter((role): role is string => typeof role === 'string');
    }

    const singleAppRole = session.user.app_metadata?.['role'];
    if (typeof singleAppRole === 'string') {
      return [singleAppRole];
    }

    const userMetaRole = session.user.user_metadata?.['role'];
    if (typeof userMetaRole === 'string') {
      return [userMetaRole];
    }

    const userMetaRoles = session.user.user_metadata?.['roles'];
    if (Array.isArray(userMetaRoles)) {
      return userMetaRoles.filter((role): role is string => typeof role === 'string');
    }

    return [];
  }
}
