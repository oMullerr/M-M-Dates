import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThemeService } from '../core/services/theme.service';
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
    MonthFilterComponent,
  ],
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

    .nav {
      padding: 12px 8px;
      flex: 1;
    }

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

    .sidenav-footer { padding: 12px 16px 18px; }

    .theme-btn {
      width: 100%;
      border-radius: 14px !important;
      justify-content: flex-start !important;
    }

    .theme-btn .mat-icon { margin-right: 8px; }

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

    .topbar-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

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
  readonly themeService = inject(ThemeService);

  readonly isHandset = signal(false);

  constructor() {
    this.breakpoints
      .observe(['(max-width: 900px)'])
      .subscribe((state) => this.isHandset.set(state.matches));
  }

  closeIfHandset(): void {
    if (this.isHandset()) this.sidenav?.close();
  }
}
