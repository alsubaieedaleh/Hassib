import { TestBed } from '@angular/core/testing';
import type { Session } from '@supabase/supabase-js';

import { StoredUser, UserService } from './user.service';

describe('UserService', () => {
  const storageKey = 'hassib.user';

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('hydrates the stored user from localStorage on creation', () => {
    const stored: StoredUser = {
      id: 'user-123',
      email: 'stored@example.com',
      fullName: 'Stored Person',
      metadata: { role: 'manager' },
    };
    localStorage.setItem(storageKey, JSON.stringify(stored));

    TestBed.configureTestingModule({ providers: [UserService] });
    const service = TestBed.inject(UserService);
    const user = service.user();

    expect(user()).toEqual(stored);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('persists user profiles when setUser is called', () => {
    TestBed.configureTestingModule({ providers: [UserService] });
    const service = TestBed.inject(UserService);

    const user: StoredUser = {
      id: 'abc',
      email: 'hello@example.com',
      fullName: 'Hello User',
      metadata: { tier: 'pro' },
    };

    service.setUser(user);

    expect(service.user()()).toEqual(user);
    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(user));
  });

  it('clears the stored profile when syncFromSession receives null', () => {
    TestBed.configureTestingModule({ providers: [UserService] });
    const service = TestBed.inject(UserService);

    service.setUser({ id: 'keep', email: 'keep@example.com', fullName: null, metadata: {} });
    expect(service.isLoggedIn()).toBe(true);

    service.syncFromSession(null);

    expect(service.user()()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('maps Supabase sessions to stored users', () => {
    TestBed.configureTestingModule({ providers: [UserService] });
    const service = TestBed.inject(UserService);

    const session = {
      user: {
        id: 'user-55',
        email: 'supabase@example.com',
        user_metadata: {
          full_name: 'Supabase User',
          department: 'sales',
        },
      },
    } as unknown as Session;

    service.syncFromSession(session);

    expect(service.user()()).toEqual({
      id: 'user-55',
      email: 'supabase@example.com',
      fullName: 'Supabase User',
      metadata: { full_name: 'Supabase User', department: 'sales' },
    });
    expect(localStorage.getItem(storageKey)).toBe(JSON.stringify(service.user()()));
  });
});
