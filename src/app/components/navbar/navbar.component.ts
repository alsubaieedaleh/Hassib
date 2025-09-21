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
  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update((state) => !state);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
