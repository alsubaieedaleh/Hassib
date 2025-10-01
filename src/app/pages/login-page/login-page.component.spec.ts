import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { convertToParamMap } from '@angular/router';

import { LoginPageComponent } from './login-page.component';
import { AuthService } from '../../shared/services/auth.service';

describe('LoginPageComponent', () => {
  let fixture: ComponentFixture<LoginPageComponent>;
  let component: LoginPageComponent;
  let authService: {
    signIn: jest.Mock;
    loading: jest.Mock;
    error: jest.Mock;
    configurationError: jest.Mock;
    isConfigured: jest.Mock;
  };
  let router: Router;

  beforeEach(async () => {
    authService = {
      signIn: jest.fn().mockResolvedValue(undefined),
      loading: jest.fn(() => signal(false)),
      error: jest.fn(() => signal<string | null>(null)),
      configurationError: jest.fn(() => signal<string | null>(null)),
      isConfigured: jest.fn(() => true),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ returnUrl: '/storage' }) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true as any);
    fixture.detectChanges();
  });

  it('does not submit when the form is invalid', async () => {
    component.submit();
    expect(authService.signIn).not.toHaveBeenCalled();
  });

  it('signs in and redirects to the return url', async () => {
    component.form.setValue({ email: 'demo@example.com', password: 'password123', remember: false });

    await component.submit();

    expect(authService.signIn).toHaveBeenCalledWith('demo@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/storage']);
  });
});
