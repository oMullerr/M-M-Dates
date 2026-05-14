import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <div class="login-card-wrap fade-up">
        <div class="brand">
          <span class="brand-emoji">🍕</span>
          <div>
            <h1 class="brand-title">M&amp;M Dates</h1>
            <p class="brand-subtitle">Controle de gastos de dates 💕</p>
          </div>
        </div>

        <mat-card class="login-card">
          <mat-card-content>
            <mat-tab-group
              [selectedIndex]="activeTab()"
              (selectedIndexChange)="activeTab.set($event)"
              mat-stretch-tabs
              animationDuration="200ms"
            >
              <!-- ENTRAR -->
              <mat-tab label="Entrar">
                <form [formGroup]="signInForm" (ngSubmit)="onSignIn()" class="tab-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input
                      matInput
                      type="email"
                      formControlName="email"
                      autocomplete="email"
                      inputmode="email"
                      placeholder="seu@email.com"
                    />
                    <mat-icon matSuffix>mail</mat-icon>
                    @if (signInForm.get('email')?.touched && signInForm.get('email')?.invalid) {
                      <mat-error>Informe um email válido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Senha</mat-label>
                    <input
                      matInput
                      [type]="showSignInPassword() ? 'text' : 'password'"
                      formControlName="password"
                      autocomplete="current-password"
                    />
                    <button
                      mat-icon-button
                      matSuffix
                      type="button"
                      (click)="showSignInPassword.set(!showSignInPassword())"
                      [attr.aria-label]="showSignInPassword() ? 'Ocultar senha' : 'Mostrar senha'"
                    >
                      <mat-icon>{{ showSignInPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (signInForm.get('password')?.touched && signInForm.get('password')?.invalid) {
                      <mat-error>Informe a senha</mat-error>
                    }
                  </mat-form-field>

                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    class="submit-btn"
                    [disabled]="signInForm.invalid || submitting()"
                  >
                    @if (submitting()) {
                      <mat-spinner diameter="20" />
                    } @else {
                      <ng-container>
                        <mat-icon>login</mat-icon>
                        Entrar
                      </ng-container>
                    }
                  </button>
                </form>
              </mat-tab>

              <!-- CRIAR CONTA -->
              <mat-tab label="Criar conta">
                <form [formGroup]="signUpForm" (ngSubmit)="onSignUp()" class="tab-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Seu nome</mat-label>
                    <input
                      matInput
                      formControlName="displayName"
                      autocomplete="given-name"
                      placeholder="ex.: Math"
                      maxlength="30"
                    />
                    <mat-icon matSuffix>person</mat-icon>
                    @if (signUpForm.get('displayName')?.touched && signUpForm.get('displayName')?.invalid) {
                      <mat-error>Como devemos te chamar?</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input
                      matInput
                      type="email"
                      formControlName="email"
                      autocomplete="email"
                      inputmode="email"
                    />
                    <mat-icon matSuffix>mail</mat-icon>
                    @if (signUpForm.get('email')?.touched && signUpForm.get('email')?.invalid) {
                      <mat-error>Informe um email válido</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Senha</mat-label>
                    <input
                      matInput
                      [type]="showSignUpPassword() ? 'text' : 'password'"
                      formControlName="password"
                      autocomplete="new-password"
                    />
                    <button
                      mat-icon-button
                      matSuffix
                      type="button"
                      (click)="showSignUpPassword.set(!showSignUpPassword())"
                    >
                      <mat-icon>{{ showSignUpPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    <mat-hint>Mínimo de 6 caracteres</mat-hint>
                    @if (signUpForm.get('password')?.touched && signUpForm.get('password')?.invalid) {
                      <mat-error>Senha precisa ter ao menos 6 caracteres</mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>
                      Código do casal
                      <span class="optional">(opcional)</span>
                    </mat-label>
                    <input
                      matInput
                      formControlName="coupleCode"
                      placeholder="Cole o código se seu par já tem conta"
                    />
                    <mat-icon
                      matSuffix
                      matTooltip="Se for o primeiro a criar conta, deixe vazio — o código é gerado para você. Depois, sua/seu par usa esse código para entrar no mesmo casal."
                    >
                      help_outline
                    </mat-icon>
                  </mat-form-field>

                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    class="submit-btn"
                    [disabled]="signUpForm.invalid || submitting()"
                  >
                    @if (submitting()) {
                      <mat-spinner diameter="20" />
                    } @else {
                      <ng-container>
                        <mat-icon>favorite</mat-icon>
                        {{ signUpForm.value.coupleCode ? 'Entrar no casal' : 'Criar conta' }}
                      </ng-container>
                    }
                  </button>
                </form>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>

        <p class="footer-note">
          Feito com 💕 para casais que cuidam do budget juntos.
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 20px;
      background:
        radial-gradient(at 20% 0%, color-mix(in srgb, var(--mat-sys-primary) 14%, transparent), transparent 60%),
        radial-gradient(at 80% 100%, color-mix(in srgb, var(--mat-sys-tertiary) 14%, transparent), transparent 60%),
        var(--mat-sys-surface);
    }

    .login-card-wrap {
      width: 100%;
      max-width: 440px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 0 4px;
    }

    .brand-emoji { font-size: 44px; line-height: 1; }

    .brand-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.85rem;
      letter-spacing: -0.02em;
      color: var(--mat-sys-on-surface);
      margin-bottom: 2px;
    }

    .brand-subtitle {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .login-card {
      border-radius: 24px !important;
    }

    .login-card mat-card-content { padding: 8px 8px 8px !important; }

    .tab-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 28px 20px 20px;
    }

    .submit-btn {
      border-radius: 14px !important;
      height: 50px !important;
      margin-top: 8px;
      font-weight: 600;
    }

    .submit-btn .mat-icon { margin-right: 6px; }

    .optional {
      font-size: 0.78rem;
      opacity: 0.7;
      font-weight: 400;
    }

    .footer-note {
      text-align: center;
      margin-top: 20px;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
    }

    @media (max-width: 480px) {
      .login-page { padding: 16px; }
      .brand-title { font-size: 1.5rem; }
      .brand-emoji { font-size: 36px; }
    }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly activeTab = signal(0);
  readonly submitting = signal(false);
  readonly showSignInPassword = signal(false);
  readonly showSignUpPassword = signal(false);

  readonly signInForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly signUpForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    coupleCode: [''],
  });

  async onSignIn(): Promise<void> {
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.signInForm.getRawValue();

    this.submitting.set(true);
    try {
      await this.auth.signIn(email, password);
      this.toast.success('Bem-vindo de volta! 💕');
      this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.toast.error(this.friendlyError(err));
    } finally {
      this.submitting.set(false);
    }
  }

  async onSignUp(): Promise<void> {
    if (this.signUpForm.invalid) {
      this.signUpForm.markAllAsTouched();
      return;
    }
    const { displayName, email, password, coupleCode } = this.signUpForm.getRawValue();

    this.submitting.set(true);
    try {
      await this.auth.signUp(email, password, displayName, coupleCode);
      this.toast.success('Conta criada com sucesso! 🎉');
      this.router.navigateByUrl('/dashboard');
    } catch (err) {
      this.toast.error(this.friendlyError(err));
    } finally {
      this.submitting.set(false);
    }
  }

  private friendlyError(err: unknown): string {
    const code = (err as { code?: string })?.code ?? '';
    const message = (err as { message?: string })?.message ?? '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'Email ou senha incorretos.';
    }
    if (code === 'auth/user-not-found') {
      return 'Não encontramos uma conta com esse email.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'Esse email já tem uma conta. Use a aba "Entrar".';
    }
    if (code === 'auth/weak-password') {
      return 'Senha muito fraca. Use ao menos 6 caracteres.';
    }
    if (code === 'auth/invalid-email') {
      return 'Email inválido.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Sem conexão com a internet.';
    }
    if (message.includes('Código do casal')) {
      return message;
    }
    if (message) return message;
    return 'Algo deu errado. Tente novamente.';
  }
}
