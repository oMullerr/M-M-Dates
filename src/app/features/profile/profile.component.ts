import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AuthService } from '../../core/services/auth.service';
import { GlassService } from '../../core/services/glass.service';
import { PwaService } from '../../core/services/pwa.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="profile fade-up">
      <header class="page-header">
        <div>
          <h1 class="page-title">Você</h1>
          <p class="page-subtitle">Sua conta e preferências</p>
        </div>
      </header>

      @if (auth.currentUser(); as user) {
        <mat-card class="settings-card profile-hero">
          <mat-card-content>
            <div class="hero">
              <div class="hero-avatar">{{ initials(user.displayName) }}</div>
              <div class="hero-info">
                <strong>{{ user.displayName }}</strong>
                <small>{{ user.email }}</small>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- APARÊNCIA -->
      <mat-card class="settings-card">
        <mat-card-content>
          <div class="card-row">
            <div class="card-row-icon icon-secondary">
              <mat-icon>{{ themeService.isDark() ? 'dark_mode' : 'light_mode' }}</mat-icon>
            </div>
            <div class="card-row-text">
              <h2>Aparência</h2>
              <p>Escolha entre modo claro ou escuro</p>
            </div>
            <mat-slide-toggle
              [checked]="themeService.isDark()"
              (change)="themeService.toggle()"
              color="primary"
            >
              {{ themeService.isDark() ? 'Escuro' : 'Claro' }}
            </mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- LIQUID GLASS -->
      <mat-card class="settings-card">
        <mat-card-content>
          <div class="card-row">
            <div class="card-row-icon icon-primary">
              <mat-icon>blur_on</mat-icon>
            </div>
            <div class="card-row-text">
              <h2>Liquid Glass</h2>
              <p>Efeito de vidro translúcido nas superfícies do app</p>
            </div>
            <mat-slide-toggle
              [checked]="glass.enabled()"
              (change)="glass.toggle()"
              color="primary"
            >
              {{ glass.enabled() ? 'Ligado' : 'Desligado' }}
            </mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- INSTALAR APP -->
      @if (pwa.canInstall()) {
        <mat-card class="settings-card">
          <mat-card-content>
            <div class="card-row">
              <div class="card-row-icon icon-primary">
                <mat-icon>install_mobile</mat-icon>
              </div>
              <div class="card-row-text">
                <h2>Instalar app</h2>
                <p>Adicione o M&M Dates à tela inicial</p>
              </div>
              <button mat-flat-button color="primary" class="row-action" (click)="installApp()">
                <mat-icon>install_mobile</mat-icon>
                Instalar
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- SAIR -->
      <mat-card class="settings-card">
        <mat-card-content>
          <div class="card-row">
            <div class="card-row-icon icon-danger">
              <mat-icon>logout</mat-icon>
            </div>
            <div class="card-row-text">
              <h2>Sair da conta</h2>
              <p>Encerrar a sessão neste dispositivo</p>
            </div>
            <button mat-stroked-button class="row-action signout" (click)="signOut()">
              <mat-icon>logout</mat-icon>
              Sair
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly themeService = inject(ThemeService);
  readonly glass = inject(GlassService);
  readonly auth = inject(AuthService);
  readonly pwa = inject(PwaService);

  async installApp(): Promise<void> {
    await this.pwa.promptInstall();
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
