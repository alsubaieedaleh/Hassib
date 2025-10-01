import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { NavComponent } from './navbar.component';
import { AuthService } from '../../shared/services/auth.service';
import { AuthState, UserStoreService } from '../../shared/services/user-store.service';

class UserStoreMock {
  private readonly subject: BehaviorSubject<AuthState>;
  readonly state$; 
  snapshot: AuthState;

  constructor(initial: AuthState) {
    this.subject = new BehaviorSubject<AuthState>(initial);
    this.state$ = this.subject.asObservable();
    this.snapshot = initial;
  }

  setState(state: AuthState) {
    this.snapshot = state;
    this.subject.next(state);
  }
}

describe('NavbarComponent', () => {
  let component: NavComponent;
  let fixture: ComponentFixture<NavComponent>;
  let authService: { signOut: jest.Mock };
  let userStore: UserStoreMock;
  let router: Router;

  beforeEach(async () => {
    authService = { signOut: jest.fn().mockResolvedValue(undefined) };
    userStore = new UserStoreMock({
      status: 'unauthenticated',
      session: null,
      user: null,
      roles: [],
      error: null,
    });

    await TestBed.configureTestingModule({
      imports: [NavComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UserStoreService, useValue: userStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NavComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);
    fixture.detectChanges();
  });

  it('shows sign-in links when unauthenticated', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-links .login')?.textContent).toContain('Sign In');
  });

  it('displays the user email and sign-out button when authenticated', async () => {
    userStore.setState({
      status: 'authenticated',
      session: {} as any,
      user: { id: 'user-1', email: 'demo@example.com' },
      roles: ['user'],
      error: null,
    });

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.user-pill')?.textContent).toContain('demo@example.com');

    const signOutButton = compiled.querySelector<HTMLButtonElement>('button.sign-out');
    signOutButton?.click();

    expect(authService.signOut).toHaveBeenCalled();
  });
});
