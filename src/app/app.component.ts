import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { NavComponent } from './components/navbar/navbar.component';
import { AuthService } from './shared/services/auth.service';
import { UserStoreService } from './shared/services/user-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userStore = inject(UserStoreService);

  readonly authState = toSignal(this.userStore.state$, {
    initialValue: this.userStore.snapshot,
  });

  ngOnInit(): void {
    void this.authService.restoreSession();
  }
}
