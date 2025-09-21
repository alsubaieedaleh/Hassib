import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavComponent {
  readonly navLinks = [
    {
      label: 'Main',
      route: '/',
      iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6',
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

  toggleMenu() {
    this.menuOpen.update((state) => !state);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
