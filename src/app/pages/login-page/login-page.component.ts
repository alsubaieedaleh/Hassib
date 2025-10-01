import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false],
  });

  readonly loading = this.auth.loading();
  readonly authError = this.auth.error();
  readonly configurationError = this.auth.configurationError();
  readonly successMessage = signal<string | null>(null);

  helpTopics = [
    {
      title: 'Need a workspace?',
      description: 'Create a team space in seconds and invite your staff when you are ready.'
    },
    {
      title: 'Forgot your password?',
      description: 'Use the reset link below and we will email you the recovery steps instantly.'
    },
    {
      title: 'Prefer social login?',
      description: 'Sign in with Google or Apple once Supabase integration is connected.'
    }
  ];

  get supabaseReady(): boolean {
    return this.auth.isConfigured();
  }

  async submit(): Promise<void> {
    this.successMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();

    if (!email || !password) {
      return;
    }

    try {
      await this.auth.signIn(email, password);
      this.successMessage.set('Signed in successfully. You can proceed to your dashboard.');
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const target = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/sales';
      void this.router.navigate([target]);
    } catch (error) {
      // Error state already captured by the auth service; nothing else required.
      console.error('Failed to sign in with Supabase', error);
    }
  }
}
