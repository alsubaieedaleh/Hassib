import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../shared/services/supabase.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly navLinks = [
    {
      label: 'Home',
      route: '/',
      iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6',
      exact: true,
    },
    {
      label: 'Landing',
      route: '/landing',
      iconPath: 'M4 5h16v4H4zM4 11h10v4H4zM4 17h16v2H4z',
    },
    {
      label: 'Sales',
      route: '/sales',
      iconPath: 'M4 4h16v4H4zM4 10h16v10H4z',
    },
    {
      label: 'Storage',
      route: '/storage',
      iconPath: 'M3 7l9-4 9 4v13a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    },
  ] as const;

  menuOpen = signal(false);
  signingOut = signal(false);
  signOutError = signal<string | null>(null);

  toggleMenu() {
    this.menuOpen.update((state) => !state);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  async signOut() {
    if (this.signingOut()) {
      return;
    }

    this.signingOut.set(true);
    this.signOutError.set(null);

    let success = false;
    try {
      const client = this.supabase.ensureClient();
      await client.auth.signOut();
      success = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign out. Please try again.';
      console.error('Sign out failed', error);
      this.signOutError.set(message);
    } finally {
      this.signingOut.set(false);
    }

    if (success) {
      this.closeMenu();
      await this.router.navigate(['/login']);
    }
  }
}
