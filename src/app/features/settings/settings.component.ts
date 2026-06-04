import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { PaymentMethod } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { PwaService } from '../../core/services/pwa.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { BrlPipe } from '../../shared/pipes/brl.pipe';
import {
  PaymentMethodDialogComponent,
  PaymentMethodDialogData,
} from '../../shared/components/payment-method-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

const BUDGET_PRESETS = [800, 1200, 1600, 2000, 2500, 3000];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    BrlPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  readonly themeService = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly pwa = inject(PwaService);

  readonly budgetPresets = BUDGET_PRESETS;
  readonly savingBudget = signal(false);

  // ---------- Notificações ----------
  readonly savingNotif = signal(false);
  readonly notifSupported = signal(false);
  private readonly isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  /** On iOS, web push only works once the PWA is installed to the home screen. */
  readonly notifNeedsInstall = computed(() => this.isIos && !this.pwa.isStandalone());

  readonly currentBudget = computed(
    () => this.settingsService.settings()?.monthlyBudget ?? 0,
  );

  readonly paymentMethods = computed(
    () => this.settingsService.settings()?.paymentMethods ?? [],
  );

  readonly coupleId = computed(() => this.auth.currentUser()?.coupleId ?? '');

  readonly budgetForm = this.fb.nonNullable.group({
    value: [0, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    effect(() => {
      const budget = this.currentBudget();
      if (budget && this.budgetForm.value.value !== budget) {
        this.budgetForm.patchValue({ value: budget }, { emitEvent: false });
      }
    });

    this.notifications.isSupported().then((s) => this.notifSupported.set(s));
  }

  async onToggleNotifications(change: MatSlideToggleChange): Promise<void> {
    this.savingNotif.set(true);
    try {
      if (change.checked) {
        const ok = await this.notifications.enable();
        if (ok) {
          this.toast.success('Notificações ativadas 🔔');
        } else if (this.notifications.permission() === 'denied') {
          this.toast.error('Permissão negada. Habilite nas configurações do navegador.');
        } else {
          this.toast.error('Não foi possível ativar as notificações.');
        }
      } else {
        await this.notifications.disable();
        this.toast.info('Notificações desativadas');
      }
    } finally {
      this.savingNotif.set(false);
    }
  }

  applyPreset(value: number): void {
    this.budgetForm.patchValue({ value });
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) return;
    const value = Number(this.budgetForm.value.value);

    this.savingBudget.set(true);
    this.settingsService.updateMonthlyBudget(value).subscribe({
      next: () => {
        this.toast.success('Budget atualizado 💸');
        this.savingBudget.set(false);
      },
      error: () => {
        this.toast.error('Não foi possível salvar o budget');
        this.savingBudget.set(false);
      },
    });
  }

  openAddMethod(): void {
    const ref = this.dialog.open<
      PaymentMethodDialogComponent,
      PaymentMethodDialogData,
      PaymentMethod
    >(PaymentMethodDialogComponent, {
      data: { existingNames: this.paymentMethods().map((m) => m.name) },
      width: '460px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((method) => {
      if (!method) return;
      this.settingsService.addPaymentMethod(method).subscribe({
        next: () => this.toast.success('Forma de pagamento adicionada 💳'),
        error: () => this.toast.error('Não foi possível adicionar'),
      });
    });
  }

  openEditMethod(method: PaymentMethod): void {
    const ref = this.dialog.open<
      PaymentMethodDialogComponent,
      PaymentMethodDialogData,
      PaymentMethod
    >(PaymentMethodDialogComponent, {
      data: {
        method,
        existingNames: this.paymentMethods().map((m) => m.name),
      },
      width: '460px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((updated) => {
      if (!updated) return;
      this.settingsService.updatePaymentMethod(method.name, updated).subscribe({
        next: () => this.toast.success('Forma de pagamento atualizada'),
        error: () => this.toast.error('Não foi possível atualizar'),
      });
    });
  }

  removeMethod(method: PaymentMethod): void {
    if (this.paymentMethods().length <= 1) {
      this.toast.error('Você precisa manter ao menos uma forma de pagamento');
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Remover forma de pagamento?',
        message: `"${method.name}" será removida. Os gastos existentes continuarão registrados.`,
        confirmLabel: 'Remover',
        cancelLabel: 'Cancelar',
        destructive: true,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.settingsService.removePaymentMethod(method.name).subscribe({
        next: () => this.toast.success('Forma removida'),
        error: () => this.toast.error('Não foi possível remover'),
      });
    });
  }

  // ---------- Compartilhar casal ----------

  copyCoupleId(): void {
    const id = this.coupleId();
    if (!id) return;
    navigator.clipboard
      .writeText(id)
      .then(() => this.toast.success('Código copiado ✨'))
      .catch(() => this.toast.error('Não consegui copiar 😢'));
  }
}
