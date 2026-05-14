import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { ToastService } from '../core/services/toast.service';
import { MonthFilterComponent } from '../shared/components/month-filter.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    MatMenuModule,
    MonthFilterComponent,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-sidenav-container class="shell" autosize>
      <mat-sidenav
        #sidenav
        [mode]="isHandset() ? 'over' : 'side'"
        [opened]="!isHandset()"
        class="sidenav"
        [fixedInViewport]="isHandset()"
      >
        <div class="brand">
          <span class="brand-emoji">🍕</span>
          <div class="brand-text">
            <strong>M&M Dates</strong>
            <small>Math &amp; Mari 💕</small>
          </div>
        </div>

        <mat-divider />

        <mat-nav-list class="nav">
          <a
            mat-list-item
            routerLink="/dashboard"
            routerLinkActive="active-nav"
            (click)="closeIfHandset()"
          >
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>

          <a
            mat-list-item
            routerLink="/expenses"
            routerLinkActive="active-nav"
            (click)="closeIfHandset()"
          >
            <mat-icon matListItemIcon>receipt_long</mat-icon>
            <span matListItemTitle>Gastos</span>
          </a>

          <a
            mat-list-item
            routerLink="/settings"
            routerLinkActive="active-nav"
            (click)="closeIfHandset()"
          >
            <mat-icon matListItemIcon>tune</mat-icon>
            <span matListItemTitle>Configurações</span>
          </a>
        </mat-nav-list>

        <div class="sidenav-footer">
          <button
            mat-stroked-button
            (click)="themeService.toggle()"
            class="theme-btn"
          >
            <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            {{ themeService.isDark() ? 'Modo claro' : 'Modo escuro' }}
          </button>

          @if (auth.currentUser(); as user) {
            <div class="user-block">
              <div class="user-avatar">{{ initials(user.displayName) }}</div>
              <div class="user-info">
                <strong>{{ user.displayName }}</strong>
                <small>{{ user.email }}</small>
              </div>
              <button
                mat-icon-button
                (click)="signOut()"
                matTooltip="Sair"
                aria-label="Sair"
              >
                <mat-icon>logout</mat-icon>
              </button>
            </div>
          }
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <mat-toolbar class="topbar">
          @if (isHandset()) {
            <button mat-icon-button (click)="sidenav.toggle()" aria-label="Abrir menu">
              <mat-icon>menu</mat-icon>
            </button>
          }

          <span class="topbar-brand">
            <span class="topbar-emoji">🍕</span>
            <span class="topbar-title">M&M Dates</span>
          </span>

          <span class="spacer"></span>

          <app-month-filter class="topbar-month" />

          @if (!isHandset()) {
            <button
              mat-icon-button
              (click)="themeService.toggle()"
              [matTooltip]="themeService.isDark() ? 'Modo claro' : 'Modo escuro'"
              aria-label="Alternar tema"
            >
              <mat-icon>{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
          } @else if (auth.currentUser()) {
            <button
              mat-icon-button
              [matMenuTriggerFor]="userMenu"
              aria-label="Conta"
            >
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              @if (auth.currentUser(); as u) {
                <div class="menu-user">
                  <strong>{{ u.displayName }}</strong>
                  <small>{{ u.email }}</small>
                </div>
                <mat-divider />
              }
              <button mat-menu-item (click)="signOut()">
                <mat-icon>logout</mat-icon>
                Sair
              </button>
            </mat-menu>
          }
        </mat-toolbar>

        <main class="page">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell { height: 100vh; }

    .sidenav {
      width: 260px;
      background: var(--mat-sys-surface-container-low);
      border-right: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 900px) {
      .sidenav {
        background: var(--mat-sys-surface-container);
        box-shadow: 4px 0 32px rgba(0, 0, 0, 0.28);
      }

      ::ng-deep .mat-drawer-backdrop.mat-drawer-shown {
        background-color: rgba(0, 0, 0, 0.45) !important;
      }
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 20px;
    }

    .brand-emoji { font-size: 28px; }

    .brand-text strong {
      display: block;
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
      color: var(--mat-sys-on-surface);
    }

    .brand-text small {
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
      letter-spacing: 0.02em;
    }

    .nav { padding: 12px 8px; flex: 1; }

    .nav .mdc-list-item {
      border-radius: 14px;
      margin-bottom: 4px;
    }

    .nav .active-nav {
      background: color-mix(in srgb, var(--mat-sys-primary) 14%, transparent) !important;
      color: var(--mat-sys-primary) !important;
    }

    .nav .active-nav .mat-icon { color: var(--mat-sys-primary); }
    .nav .active-nav .mdc-list-item__primary-text {
      color: var(--mat-sys-primary) !important;
      font-weight: 600;
    }

    .sidenav-footer {
      padding: 12px 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .theme-btn {
      width: 100%;
      border-radius: 14px !important;
      justify-content: flex-start !important;
    }

    .theme-btn .mat-icon { margin-right: 8px; }

    .user-block {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--mat-sys-primary) 0%, var(--mat-sys-tertiary) 100%);
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-info strong {
      display: block;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
    }

    .user-info small {
      font-size: 0.72rem;
      color: var(--mat-sys-on-surface-variant);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .menu-user {
      padding: 12px 16px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .menu-user strong {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface);
    }

    .menu-user small {
      font-size: 0.78rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .content {
      background: var(--mat-sys-surface);
      display: flex;
      flex-direction: column;
    }

    .topbar {
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      position: sticky;
      top: 0;
      z-index: 10;
      padding: 0 24px;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      gap: 10px;
      min-height: 64px;
    }

    .topbar-brand { display: inline-flex; align-items: center; gap: 10px; }

    .topbar-emoji { font-size: 22px; }

    .topbar-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
      color: var(--mat-sys-on-surface);
    }

    .spacer { flex: 1; }

    .page {
      padding: 28px;
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      flex: 1;
    }

    @media (max-width: 600px) {
      .topbar { padding: 0 8px; }
      .topbar-brand { display: none; }
      .page { padding: 16px; }
    }
  `],
})
export class ShellComponent {
  @ViewChild('sidenav') sidenav?: MatSidenav;

  private readonly breakpoints = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);

  readonly isHandset = signal(false);

  constructor() {
    this.breakpoints
      .observe(['(max-width: 900px)'])
      .subscribe((state) => this.isHandset.set(state.matches));
  }

  closeIfHandset(): void {
    if (this.isHandset()) this.sidenav?.close();
  }

  async signOut(): Promise<void> {
    try {
      await this.auth.signOut();
      this.toast.info('Até logo! 👋');
      this.router.navigateByUrl('/login');
    } catch {
      this.toast.error('Não foi possível sair. Tente novamente.');
    }
  }

  initials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
