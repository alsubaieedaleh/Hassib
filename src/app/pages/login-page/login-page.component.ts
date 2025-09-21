import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent {
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

  preventSubmit(event: Event) {
    event.preventDefault();
  }
}
