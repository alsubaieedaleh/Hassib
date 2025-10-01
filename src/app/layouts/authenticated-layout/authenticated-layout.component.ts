import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { NavComponent } from '../../components/navbar/navbar.component';
import { AuthService } from '../../shared/services/auth.service';
import { UserStoreService } from '../../shared/services/user-store.service';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  templateUrl: './authenticated-layout.component.html',
  styleUrls: ['./authenticated-layout.component.scss']
})
export class AuthenticatedLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userStore = inject(UserStoreService);

  readonly authState = toSignal(this.userStore.state$, {
    initialValue: this.userStore.snapshot,
  });

  ngOnInit(): void {
    void this.authService.restoreSession();
  }
}
