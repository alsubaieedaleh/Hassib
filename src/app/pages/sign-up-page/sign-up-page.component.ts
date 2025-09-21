import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-sign-up-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './sign-up-page.component.html'
})
export class SignUpPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.group({
    store: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    teamSize: ['1-5', Validators.required],
    plan: ['', Validators.required],
    terms: [false, Validators.requiredTrue],
  });

  readonly loading = this.auth.loading();
  readonly authError = this.auth.error();
  readonly configurationError = this.auth.configurationError();
  readonly successMessage = signal<string | null>(null);

  plans = [
    {
      name: 'Starter',
      detail: 'Best for single-location retailers trying Hassib for the first time.'
    },
    {
      name: 'Growth',
      detail: 'Multi-branch teams who need inventory forecasting and user roles.'
    },
    {
      name: 'Enterprise',
      detail: 'Custom SLAs, dedicated support, and advanced analytics.'
    }
  ];

  checklist = [
    'Unlimited products and barcode scanning',
    'Realtime sales and tax dashboards',
    'Staff permissions with audit trails',
    'Built-in Supabase authentication ready'
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

    const value = this.form.getRawValue();

    try {
      await this.auth.signUp({
        email: value.email!,
        password: value.password!,
        metadata: {
          store: value.store,
          phone: value.phone,
          teamSize: value.teamSize,
          plan: value.plan,
        },
      });

      this.successMessage.set('Account created! Check your email to confirm the address before signing in.');
      this.form.reset({
        store: '',
        email: '',
        phone: '',
        password: '',
        teamSize: '1-5',
        plan: '',
        terms: false,
      });
    } catch (error) {
      console.error('Failed to sign up with Supabase', error);
    }
  }
}
