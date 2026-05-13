import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Expense } from '../../core/models';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';

export interface ExpenseDialogData {
  expense?: Expense;
}

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog">
      <header class="dialog-header">
        <div class="title-block">
          <span class="emoji" aria-hidden="true">🍕</span>
          <div>
            <h2 class="dialog-title">
              {{ isEdit() ? 'Editar lanchinho' : 'Oh o lanchinho!!' }}
            </h2>
            <p class="dialog-subtitle">
              {{ isEdit() ? 'Atualize os detalhes do registro' : 'Registre um novo date 💕' }}
            </p>
          </div>
        </div>
        <button mat-icon-button (click)="cancel()" aria-label="Fechar">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-divider />

      <form [formGroup]="form" (ngSubmit)="save()" class="dialog-body">
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

      <mat-divider />

      <footer class="dialog-footer">
        <button mat-button type="button" (click)="cancel()" [disabled]="saving()">
          Cancelar
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="save()"
          [disabled]="form.invalid || saving()"
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
    .dialog {
      display: flex;
      flex-direction: column;
      min-width: 320px;
      max-width: 560px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 20px 24px 16px;
      gap: 12px;
    }

    .title-block { display: flex; align-items: center; gap: 14px; }
    .emoji { font-size: 32px; line-height: 1; }

    .dialog-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.4rem;
      letter-spacing: -0.02em;
      margin-bottom: 2px;
      color: var(--mat-sys-on-surface);
    }

    .dialog-subtitle {
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .dialog-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
      max-height: 70vh;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .pm-option { display: inline-flex; align-items: center; gap: 10px; }

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

    .preview {
      margin-top: 8px;
      padding: 14px 16px;
      background: var(--mat-sys-surface-container-low);
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

    .preview-title .mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .preview-text {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.85rem;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
    }

    @media (max-width: 600px) {
      .dialog { max-width: 100%; }
      .dialog-header, .dialog-body, .dialog-footer {
        padding-left: 16px;
        padding-right: 16px;
      }
      .row { grid-template-columns: 1fr; }
      .dialog-title { font-size: 1.2rem; }
    }
  `],
})
export class ExpenseDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly expenseService = inject(ExpenseService);
  private readonly settingsService = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<ExpenseDialogComponent>);
  private readonly data = inject<ExpenseDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly isEdit = computed(() => !!this.data?.expense);
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
    if (this.data?.expense) {
      this.form.patchValue({
        date: this.data.expense.date,
        location: this.data.expense.location,
        value: this.data.expense.value,
        paymentMethod: this.data.expense.paymentMethod,
      });
    } else {
      this.form.patchValue({ date: this.todayBR() });
    }

    this.form.valueChanges.subscribe((v) => this.formValue.set(v));
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

    const obs$ = this.isEdit() && this.data.expense
      ? this.expenseService.update({ ...this.data.expense, ...payload })
      : this.expenseService.create(payload);

    obs$.subscribe({
      next: (result) => {
        this.toast.success(this.isEdit() ? 'Atualizado com sucesso 💕' : 'Lanchinho registrado 🍔');
        this.saving.set(false);
        this.dialogRef.close(result);
      },
      error: () => {
        this.toast.error('Não foi possível salvar. Tente novamente.');
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    if (this.saving()) return;
    this.dialogRef.close();
  }

  private todayBR(): string {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
}
