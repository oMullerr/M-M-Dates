import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Expense } from '../../core/models';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-page fade-up">
      <header class="form-header">
        <button
          mat-icon-button
          type="button"
          (click)="cancel()"
          aria-label="Voltar"
          class="back-btn"
        >
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="title-block">
          <span class="emoji" aria-hidden="true">🍕</span>
          <div class="title-text">
            <h1 class="form-title">
              {{ isEdit() ? 'Editar lanchinho' : 'Oh o lanchinho!!' }}
            </h1>
            <p class="form-subtitle">
              {{ isEdit() ? 'Atualize os detalhes do registro' : 'Registre um novo date 💕' }}
            </p>
          </div>
        </div>
      </header>

      <form [formGroup]="form" (ngSubmit)="save()" class="form-body">
        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Data</mat-label>
            <input
              matInput
              formControlName="date"
              placeholder="dd/MM/aaaa"
              maxlength="10"
              inputmode="numeric"
              (input)="formatDate($event)"
            />
            <mat-icon matSuffix>event</mat-icon>
            @if (form.get('date')?.touched && form.get('date')?.invalid) {
              <mat-error>Use o formato dd/MM/aaaa</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Valor</mat-label>
            <span matTextPrefix>R$&nbsp;</span>
            <input
              matInput
              type="number"
              formControlName="value"
              placeholder="0,00"
              step="0.01"
              min="0"
              inputmode="decimal"
            />
            @if (form.get('value')?.touched && form.get('value')?.invalid) {
              <mat-error>Informe um valor maior que zero</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Local</mat-label>
          <input
            matInput
            formControlName="location"
            placeholder="Onde rolou o date?"
            maxlength="80"
          />
          <mat-icon matSuffix>storefront</mat-icon>
          @if (form.get('location')?.touched && form.get('location')?.invalid) {
            <mat-error>Conte para a gente onde foi 😊</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Forma de pagamento</mat-label>
          <mat-select formControlName="paymentMethod">
            @for (pm of paymentMethods(); track pm.name) {
              <mat-option [value]="pm.name">
                <span class="pm-option">
                  <span class="pm-dot" [style.background]="pm.color"></span>
                  {{ pm.name }}
                  <small class="pm-owner">· {{ pm.owner }}</small>
                </span>
              </mat-option>
            }
          </mat-select>
          <mat-icon matSuffix>credit_card</mat-icon>
          @if (form.get('paymentMethod')?.touched && form.get('paymentMethod')?.invalid) {
            <mat-error>Escolha uma forma de pagamento</mat-error>
          }
        </mat-form-field>

        @if (previewMessage()) {
          <section class="preview">
            <header class="preview-header">
              <span class="preview-title">
                <mat-icon>visibility</mat-icon>
                Pré-visualização
              </span>
              <button
                mat-icon-button
                type="button"
                (click)="copyPreview()"
                matTooltip="Copiar mensagem"
                aria-label="Copiar"
              >
                <mat-icon>content_copy</mat-icon>
              </button>
            </header>
            <pre class="preview-text">{{ previewMessage() }}</pre>
          </section>
        }
      </form>

      <footer class="form-footer">
        <button
          mat-button
          type="button"
          (click)="cancel()"
          [disabled]="saving()"
          class="footer-cancel"
        >
          Cancelar
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="save()"
          [disabled]="form.invalid || saving()"
          class="footer-save"
        >
          @if (saving()) {
            <mat-spinner diameter="20" />
          } @else {
            <ng-container>
              <mat-icon>{{ isEdit() ? 'save' : 'add' }}</mat-icon>
              {{ isEdit() ? 'Salvar' : 'Registrar' }}
            </ng-container>
          }
        </button>
      </footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .form-page {
      display: flex;
      flex-direction: column;
      gap: 0;
      max-width: 720px;
      margin: 0 auto;
      padding-bottom: env(safe-area-inset-bottom);
    }

    /* HEADER --------------------------------------------------- */

    .form-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0 20px;
    }

    .title-block {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
      flex: 1;
    }

    .emoji {
      font-size: 36px;
      line-height: 1;
      flex-shrink: 0;
    }

    .title-text {
      min-width: 0;
    }

    .form-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.75rem;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
      color: var(--mat-sys-on-surface);
      line-height: 1.1;
    }

    .form-subtitle {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .back-btn {
      flex-shrink: 0;
    }

    /* BODY ----------------------------------------------------- */

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 24px;
      background: var(--mat-sys-surface-container-low);
      border-radius: 20px;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .pm-option {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .pm-dot {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pm-owner {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.78rem;
    }

    /* PREVIEW -------------------------------------------------- */

    .preview {
      margin-top: 8px;
      padding: 14px 16px;
      background: var(--mat-sys-surface);
      border: 1px dashed var(--mat-sys-outline-variant);
      border-radius: 14px;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .preview-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--mat-sys-on-surface-variant);
    }

    .preview-title .mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .preview-text {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    /* FOOTER --------------------------------------------------- */

    .form-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px 0 0;
    }

    .footer-cancel {
      min-width: 120px;
    }

    .footer-save {
      min-width: 160px;
      border-radius: 999px !important;
    }

    .footer-save .mat-icon {
      margin-right: 4px;
    }

    /* MOBILE ADJUSTMENTS --------------------------------------- */

    @media (max-width: 600px) {
      .form-header {
        padding: 0 0 16px;
      }

      .emoji {
        font-size: 28px;
      }

      .form-title {
        font-size: 1.4rem;
      }

      .form-body {
        padding: 18px 16px;
        border-radius: 16px;
      }

      .row {
        grid-template-columns: 1fr;
      }

      .form-footer {
        padding: 20px 0 0;
        gap: 10px;
      }

      .footer-cancel {
        min-width: 0;
        flex: 1;
      }

      .footer-save {
        min-width: 0;
        flex: 2;
        height: 48px !important;
      }
    }
  `],
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input<string | undefined>(undefined);

  readonly saving = signal(false);
  readonly isEdit = computed(() => !!this.id());
  readonly paymentMethods = computed(
    () => this.settingsService.settings()?.paymentMethods ?? [],
  );

  readonly form = this.fb.nonNullable.group({
    date: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}\/\d{4}$/)]],
    location: ['', [Validators.required, Validators.minLength(2)]],
    value: [0, [Validators.required, Validators.min(0.01)]],
    paymentMethod: ['', Validators.required],
  });

  private readonly formValue = signal(this.form.value);
  private editLoaded = false;
  private currentExpense?: Expense;

  readonly previewMessage = computed(() => {
    const v = this.formValue();
    const settings = this.settingsService.settings();
    if (!settings) return '';
    if (!v.date || !v.location || !v.value || !v.paymentMethod) return '';
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v.date)) return '';

    try {
      return this.expenseService.buildMessage(
        {
          date: v.date,
          location: v.location,
          value: Number(v.value),
          paymentMethod: v.paymentMethod,
        },
        settings,
      );
    } catch {
      return '';
    }
  });

  constructor() {
    this.form.patchValue({ date: this.todayBR() });
    this.form.valueChanges.subscribe((v) => this.formValue.set(v));

    effect(() => {
      const id = this.id();
      const list = this.expenseService.expenses();

      if (!id || this.editLoaded) return;
      if (list.length === 0) return;

      const expense = list.find((e) => e.id === id);
      if (!expense) {
        this.router.navigateByUrl('/expenses');
        return;
      }

      this.currentExpense = expense;
      this.form.patchValue({
        date: expense.date,
        location: expense.location,
        value: expense.value,
        paymentMethod: expense.paymentMethod,
      });
      this.editLoaded = true;
    });
  }

  formatDate(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length >= 3 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    this.form.patchValue({ date: formatted });
  }

  copyPreview(): void {
    const text = this.previewMessage();
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => this.toast.success('Mensagem copiada ✨'))
      .catch(() => this.toast.error('Não consegui copiar 😢'));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: Omit<Expense, 'id'> = {
      date: v.date,
      location: v.location.trim(),
      value: Number(v.value),
      paymentMethod: v.paymentMethod,
    };

    this.saving.set(true);

    const obs$ = this.isEdit() && this.currentExpense
      ? this.expenseService.update({ ...this.currentExpense, ...payload })
      : this.expenseService.create(payload);

    obs$.subscribe({
      next: () => {
        this.toast.success(this.isEdit() ? 'Atualizado com sucesso 💕' : 'Lanchinho registrado 🍔');
        this.saving.set(false);
        this.router.navigateByUrl('/expenses');
      },
      error: () => {
        this.toast.error('Não foi possível salvar. Tente novamente.');
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    if (this.saving()) return;
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/expenses');
    }
  }

  private todayBR(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
