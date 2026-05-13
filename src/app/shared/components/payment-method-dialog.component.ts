import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { PaymentMethod } from '../../core/models';

export interface PaymentMethodDialogData {
  method?: PaymentMethod;
  existingNames: string[];
}

const COLOR_PALETTE = [
  '#5B8DEF', '#E879A8', '#10B981', '#F59E0B',
  '#8B5CF6', '#EF4444', '#14B8A6', '#F97316',
  '#06B6D4', '#84CC16', '#A855F7', '#EC4899',
];

@Component({
  selector: 'app-payment-method-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog">
      <header class="dialog-header">
        <h2>{{ isEdit ? 'Editar forma de pagamento' : 'Nova forma de pagamento' }}</h2>
        <button mat-icon-button (click)="ref.close()" aria-label="Fechar">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <mat-divider />

      <form [formGroup]="form" (ngSubmit)="save()" class="dialog-body">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" placeholder="ex.: Cartão Math" maxlength="40" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Informe um nome</mat-error>
          }
          @if (form.get('name')?.hasError('duplicate')) {
            <mat-error>Já existe uma forma com esse nome</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Responsável</mat-label>
          <input matInput formControlName="owner" placeholder="ex.: Math, Mari" maxlength="20" />
          @if (form.get('owner')?.touched && form.get('owner')?.invalid) {
            <mat-error>Informe o responsável</mat-error>
          }
        </mat-form-field>

        <div class="color-section">
          <label class="color-label">Cor</label>
          <div class="palette">
            @for (color of palette; track color) {
              <button
                type="button"
                class="swatch"
                [style.background]="color"
                [class.selected]="form.value.color === color"
                (click)="form.patchValue({ color })"
                [attr.aria-label]="'Cor ' + color"
              >
                @if (form.value.color === color) {
                  <mat-icon>check</mat-icon>
                }
              </button>
            }
          </div>
        </div>
      </form>

      <mat-divider />

      <footer class="dialog-footer">
        <button mat-button (click)="ref.close()">Cancelar</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="form.invalid"
          (click)="save()"
        >
          <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon>
          {{ isEdit ? 'Salvar' : 'Adicionar' }}
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .dialog { min-width: 320px; max-width: 460px; }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
    }

    .dialog-header h2 {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
      color: var(--mat-sys-on-surface);
    }

    .dialog-body {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .color-section { margin-top: 8px; }

    .color-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 10px;
    }

    .palette {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }

    .swatch {
      aspect-ratio: 1;
      border-radius: 12px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 0;
    }

    .swatch:hover { transform: scale(1.08); }

    .swatch.selected {
      border-color: var(--mat-sys-on-surface);
      box-shadow: 0 0 0 3px var(--mat-sys-surface);
    }

    .swatch .mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px 24px;
    }

    @media (max-width: 600px) {
      .dialog-header, .dialog-body, .dialog-footer {
        padding-left: 16px;
        padding-right: 16px;
      }
    }
  `],
})
export class PaymentMethodDialogComponent {
  private readonly fb = inject(FormBuilder);
  readonly ref = inject(MatDialogRef<PaymentMethodDialogComponent, PaymentMethod>);
  readonly data = inject<PaymentMethodDialogData>(MAT_DIALOG_DATA);

  readonly palette = COLOR_PALETTE;
  readonly isEdit = !!this.data?.method;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    owner: ['', [Validators.required, Validators.minLength(1)]],
    color: [COLOR_PALETTE[0], Validators.required],
  });

  constructor() {
    if (this.data?.method) {
      this.form.patchValue({
        name: this.data.method.name,
        owner: this.data.method.owner,
        color: this.data.method.color,
      });
    }

    this.form.get('name')?.valueChanges.subscribe((name) => {
      const normalized = name.trim().toLowerCase();
      const originalName = this.data?.method?.name.toLowerCase();
      const isDuplicate =
        normalized !== '' &&
        normalized !== originalName &&
        this.data.existingNames.some((n) => n.toLowerCase() === normalized);

      const control = this.form.get('name');
      if (isDuplicate) {
        control?.setErrors({ ...(control.errors ?? {}), duplicate: true });
      } else if (control?.hasError('duplicate')) {
        const errors = { ...(control.errors ?? {}) };
        delete errors['duplicate'];
        control.setErrors(Object.keys(errors).length ? errors : null);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.ref.close({
      name: v.name.trim(),
      owner: v.owner.trim(),
      color: v.color,
    });
  }
}
