import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from './core/services/auth.service';
import { PwaService } from './core/services/pwa.service';
import { ThemeService } from './core/services/theme.service';
import { ShellComponent } from './layout/shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatProgressSpinnerModule, ShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showSplash()) {
      <div class="splash">
        <span class="splash-emoji">🍕</span>
        <mat-spinner diameter="32" />
        <p>Carregando...</p>
      </div>
    } @else if (auth.currentUser()) {
      <app-shell />
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .splash {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface-variant);
    }

    .splash-emoji {
      font-size: 48px;
      animation: bounce 1.5s ease-in-out infinite;
    }

    .splash p { font-size: 0.95rem; }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `],
})
export class AppComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly pwa = inject(PwaService);

  // Injected so its effect runs at startup (DOM dark-theme class).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly themeService = inject(ThemeService);

  readonly showSplash = computed(() => this.auth.loading());

  ngOnInit(): void {
    this.pwa.init();
  }
}
