import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { AuthenticatedLayoutComponent } from './authenticated-layout.component';
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

describe('AuthenticatedLayoutComponent', () => {
  let userStore: UserStoreMock;
  let authService: { restoreSession: jest.Mock };

  beforeEach(async () => {
    userStore = new UserStoreMock({
      status: 'loading',
      session: null,
      user: null,
      roles: [],
      error: null,
    });
    authService = { restoreSession: jest.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [AuthenticatedLayoutComponent, RouterTestingModule],
      providers: [
        { provide: UserStoreService, useValue: userStore },
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();
  });

  it('should create the layout', () => {
    const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('invokes session restore on init', () => {
    const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
    fixture.detectChanges();
    expect(authService.restoreSession).toHaveBeenCalled();
  });

  it('shows a loading indicator while restoring the session', () => {
    const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-indicator')).not.toBeNull();
  });

  it('renders the shell once the session is available', () => {
    const fixture = TestBed.createComponent(AuthenticatedLayoutComponent);
    fixture.detectChanges();

    userStore.setState({
      status: 'authenticated',
      session: {} as any,
      user: { id: 'user-1', email: 'demo@example.com' },
      roles: ['user'],
      error: null,
    });

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav')).not.toBeNull();
    expect(compiled.querySelector('main.app-main')).not.toBeNull();
  });
});
