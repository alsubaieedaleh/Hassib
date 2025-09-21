import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sign-up-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sign-up-page.component.html'
})
export class SignUpPageComponent {
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

  preventSubmit(event: Event) {
    event.preventDefault();
  }
}
