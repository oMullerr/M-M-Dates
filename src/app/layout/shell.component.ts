import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  QueryList,
  signal,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatIconModule,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'updatePill()' },
  template: `
    <div class="shell">
      <main class="page">
        <router-outlet />
      </main>

      <!-- Barra flutuante central (liquid glass) -->
      <nav class="tabbar glass">
        <span
          class="tab-pill"
          aria-hidden="true"
          [style.left.px]="pillLeft()"
          [style.width.px]="pillWidth()"
        ></span>

        <a
          #tabEl
          class="tab"
          routerLink="/dashboard"
          routerLinkActive="active"
          aria-label="Dashboard"
        >
          <mat-icon>dashboard</mat-icon>
          <span class="tab-label">Dashboard</span>
        </a>

        <a
          #tabEl
          class="tab"
          routerLink="/expenses"
          routerLinkActive="active"
          aria-label="Gastos"
        >
          <mat-icon>receipt_long</mat-icon>
          <span class="tab-label">Gastos</span>
        </a>

        <a
          #tabEl
          class="tab"
          routerLink="/settings"
          routerLinkActive="active"
          aria-label="Configurações"
        >
          <mat-icon>tune</mat-icon>
          <span class="tab-label">Config.</span>
        </a>

        <a
          #tabEl
          class="tab tab-you"
          routerLink="/perfil"
          routerLinkActive="active"
          aria-label="Você"
        >
          @if (auth.currentUser(); as u) {
            <span class="tab-avatar">{{ initials(u.displayName) }}</span>
          } @else {
            <mat-icon>account_circle</mat-icon>
          }
          <span class="tab-label">Você</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ---------- PÁGINA ---------- */
    .page {
      flex: 1;
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 28px calc(100px + env(safe-area-inset-bottom));
    }

    /* ---------- TAB BAR FLUTUANTE ---------- */
    .tabbar {
      position: fixed;
      left: 50%;
      bottom: calc(16px + env(safe-area-inset-bottom));
      transform: translateX(-50%);
      z-index: 50;
      width: max-content;
      max-width: calc(100% - 32px);
      display: flex;
      justify-content: center;
      gap: 2px;
      padding: 4px;
      border-radius: 999px;
      animation: tabbar-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    /* pílula ativa que desliza/morfa (posição/tamanho medidos da aba ativa) */
    .tab-pill {
      position: absolute;
      top: 4px;
      bottom: 4px;
      left: 0;
      width: 0;
      border-radius: 999px;
      background: color-mix(in srgb, var(--mat-sys-primary) 18%, transparent);
      box-shadow: inset 0 1px 0 var(--glass-highlight);
      transition:
        left 0.42s cubic-bezier(0.34, 1.56, 0.64, 1),
        width 0.42s cubic-bezier(0.34, 1.56, 0.64, 1),
        background 0.3s ease;
      z-index: 1;
    }

    .tab {
      position: relative;
      z-index: 2;
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 4px 12px;
      min-width: 58px;
      min-height: 38px;
      background: transparent;
      border: none;
      border-radius: 999px;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: color 0.3s ease;
    }

    .tab .mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
        font-variation-settings 0.3s ease;
    }

    .tab:active .mat-icon { transform: scale(0.86); }

    .tab-label {
      font-size: 0.6rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      white-space: nowrap;
      line-height: 1;
    }

    .tab.active {
      color: var(--mat-sys-primary);
    }

    .tab.active .mat-icon {
      font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
    }

    .tab-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
      color: #fff;
      font-size: 0.66rem;
      font-weight: 700;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    }

    .tab-you:active .tab-avatar { transform: scale(0.9); transition: transform 0.2s ease; }

    /* ---------- RESPONSIVO ---------- */
    @media (max-width: 600px) {
      .page { padding: 16px 14px calc(96px + env(safe-area-inset-bottom)); }
    }

    @media (max-width: 380px) {
      .tab-label { font-size: 0.6rem; }
    }
  `],
})
export class ShellComponent implements AfterViewInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  @ViewChildren('tabEl') private readonly tabs?: QueryList<ElementRef<HTMLElement>>;

  readonly activeIndex = signal(this.computeIndex(this.router.url));
  readonly pillLeft = signal(0);
  readonly pillWidth = signal(0);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.activeIndex.set(this.computeIndex(e.urlAfterRedirects));
        this.updatePill();
      });
  }

  ngAfterViewInit(): void {
    this.tabs?.changes.subscribe(() => this.updatePill());
    // Aguarda o layout/fontes estabilizarem antes de medir a aba ativa.
    requestAnimationFrame(() => this.updatePill());
  }

  /** Posiciona a pílula sob a aba ativa, medindo sua geometria real. */
  updatePill(): void {
    const el = this.tabs?.get(this.activeIndex())?.nativeElement;
    if (!el) return;
    this.pillLeft.set(el.offsetLeft);
    this.pillWidth.set(el.offsetWidth);
  }

  private computeIndex(url: string): number {
    if (url.startsWith('/dashboard')) return 0;
    if (url.startsWith('/expenses')) return 1;
    if (url.startsWith('/settings')) return 2;
    if (url.startsWith('/perfil')) return 3;
    return 0;
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
