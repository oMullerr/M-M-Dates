import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';

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
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-page fade-in">
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
              #dateTrigger
              matInput
              readonly
              [value]="(form.controls.date.value | date: 'dd/MM/yyyy') || ''"
              (click)="toggleCalendar()"
            />
            <mat-icon matSuffix>event</mat-icon>
            @if (form.get('date')?.touched && form.get('date')?.invalid) {
              <mat-error>Selecione uma data</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Valor</mat-label>
            <span matTextPrefix>R$&nbsp;</span>
            <input
              matInput
              type="text"
              formControlName="value"
              placeholder="0,00"
              inputmode="decimal"
              maxlength="13"
              (input)="formatCurrency($event)"
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

        <div class="payment-field">
          <label class="payment-label">Forma de pagamento *</label>
          <button
            #paymentTrigger
            type="button"
            cdkOverlayOrigin
            class="payment-trigger"
            [class.invalid]="form.get('paymentMethod')?.touched && form.get('paymentMethod')?.invalid"
            [class.has-value]="!!form.get('paymentMethod')?.value"
            (click)="togglePaymentMenu()"
            (blur)="form.get('paymentMethod')?.markAsTouched()"
          >
            @if (form.get('paymentMethod')?.value; as selectedName) {
              <span class="payment-selected">
                <span
                  class="pm-dot"
                  [style.background]="colorForSelectedMethod()"
                ></span>
                {{ selectedName }}
              </span>
            } @else {
              <span class="payment-placeholder">Selecione</span>
            }
            <mat-icon class="payment-suffix">credit_card</mat-icon>
            <mat-icon class="payment-arrow" [class.open]="paymentMenuOpen()">
              arrow_drop_down
            </mat-icon>
          </button>

          @if (form.get('paymentMethod')?.touched && form.get('paymentMethod')?.invalid) {
            <small class="payment-error">Escolha uma forma de pagamento</small>
          }
        </div>

        @if (paymentMenuOpen()) {
          <div class="payment-backdrop" (click)="paymentMenuOpen.set(false)"></div>
          <div
            class="payment-panel"
            [style.top.px]="dropdownTop()"
            [style.left.px]="dropdownLeft()"
            [style.width.px]="dropdownWidth()"
          >
            @for (pm of paymentMethods(); track pm.name) {
              <button
                type="button"
                class="payment-panel-item"
                [class.selected]="form.get('paymentMethod')?.value === pm.name"
                (click)="selectPaymentMethod(pm.name)"
              >
                <span class="pm-dot" [style.background]="pm.color"></span>
                <span class="pm-name">{{ pm.name }}</span>
                <small class="pm-owner">· {{ pm.owner }}</small>
              </button>
            }
          </div>
        }

        @if (calendarOpen()) {
          <div class="calendar-backdrop" (click)="calendarOpen.set(false)"></div>
          <div
            class="calendar-panel"
            [style.top.px]="calTop()"
            [style.left.px]="calLeft()"
          >
            <mat-calendar
              [selected]="form.controls.date.value"
              [startAt]="form.controls.date.value"
              (selectedChange)="onDateSelected($event)"
            />
          </div>
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

    .fade-in {
      animation: fade-in 0.25s ease-out both;
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
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

    /* PAYMENT FIELD (custom dropdown) -------------------------- */

    .payment-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 4px;
    }

    .payment-label {
      font-size: 0.78rem;
      color: var(--mat-sys-on-surface-variant);
      padding-left: 14px;
      font-weight: 500;
    }

    .payment-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: 56px;
      padding: 0 14px;
      background: transparent;
      border: 1px solid var(--mat-sys-outline);
      border-radius: 4px;
      color: var(--mat-sys-on-surface);
      font: inherit;
      font-size: 1rem;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s ease;
    }

    .payment-trigger:hover {
      border-color: var(--mat-sys-on-surface);
    }

    .payment-trigger:focus-visible {
      outline: none;
      border-color: var(--mat-sys-primary);
      border-width: 2px;
      padding: 0 13px;
    }

    .payment-trigger.invalid {
      border-color: var(--mat-sys-error);
    }

    .payment-selected {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
    }

    .payment-placeholder {
      flex: 1;
      color: var(--mat-sys-on-surface-variant);
    }

    .payment-suffix {
      color: var(--mat-sys-on-surface-variant);
      flex-shrink: 0;
    }

    .payment-arrow {
      color: var(--mat-sys-on-surface-variant);
      flex-shrink: 0;
      transition: transform 0.2s ease;
    }

    .payment-arrow.open {
      transform: rotate(180deg);
    }

    .payment-error {
      color: var(--mat-sys-error);
      font-size: 0.75rem;
      padding-left: 14px;
    }

    /* Dropdown panel — position: fixed com coords calculadas no componente */

    .payment-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: transparent;
    }

    .payment-panel {
      position: fixed;
      z-index: 1001;
      background: var(--mat-sys-surface-container);
      border-radius: 12px;
      border: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
      padding: 6px;
      max-height: 280px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 2px;
      animation: payment-panel-in 160ms ease-out both;
    }

    @keyframes payment-panel-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .payment-panel-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: transparent;
      border: none;
      border-radius: 8px;
      color: var(--mat-sys-on-surface);
      font: inherit;
      font-size: 0.95rem;
      text-align: left;
      cursor: pointer;
      transition: background 0.12s ease;
    }

    .payment-panel-item:hover {
      background: var(--mat-sys-surface-container-high);
    }

    .payment-panel-item.selected {
      background: color-mix(in srgb, var(--mat-sys-primary) 14%, transparent);
      color: var(--mat-sys-primary);
      font-weight: 600;
    }

    .payment-panel-item .pm-name {
      flex: 1;
    }

    /* CALENDAR (custom panel, mesmo padrão do dropdown de pagamento) ---- */

    .calendar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: transparent;
    }

    .calendar-panel {
      position: fixed;
      z-index: 1001;
      width: 320px;
      max-width: calc(100vw - 16px);
      background: var(--mat-sys-surface-container);
      border-radius: 16px;
      border: 1px solid var(--mat-sys-outline-variant);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
      padding: 4px 8px;
      animation: payment-panel-in 160ms ease-out both;
    }

    .calendar-panel mat-calendar {
      width: 100%;
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

  readonly paymentTrigger = viewChild<ElementRef<HTMLButtonElement>>('paymentTrigger');
  readonly paymentMenuOpen = signal(false);
  readonly dropdownTop = signal(0);
  readonly dropdownLeft = signal(0);
  readonly dropdownWidth = signal(0);

  readonly dateTrigger = viewChild<ElementRef<HTMLInputElement>>('dateTrigger');
  readonly calendarOpen = signal(false);
  readonly calTop = signal(0);
  readonly calLeft = signal(0);

  readonly form = this.fb.nonNullable.group({
    date: this.fb.nonNullable.control<Date>(new Date(), Validators.required),
    location: ['', [Validators.required, Validators.minLength(2)]],
    value: ['', [Validators.required, this.minValueValidator(0.01)]],
    paymentMethod: ['', Validators.required],
  });

  private readonly formValue = signal(this.form.value);
  private editLoaded = false;
  private currentExpense?: Expense;

  constructor() {
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
        date: this.parseBRDate(expense.date),
        location: expense.location,
        value: this.formatNumberAsCurrency(expense.value),
        paymentMethod: expense.paymentMethod,
      });
      this.editLoaded = true;
    });
  }

  togglePaymentMenu(): void {
    if (this.paymentMenuOpen()) {
      this.paymentMenuOpen.set(false);
      return;
    }
    this.openPaymentMenu();
  }

  private openPaymentMenu(): void {
    const trigger = this.paymentTrigger();
    if (!trigger) return;
    const rect = trigger.nativeElement.getBoundingClientRect();
    const optionHeight = 48;
    const panelHeight = Math.min(
      this.paymentMethods().length * optionHeight + 12,
      280,
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top: number;
    if (spaceBelow >= panelHeight + 12 || spaceBelow >= spaceAbove) {
      top = rect.bottom + 6;
    } else {
      top = Math.max(8, rect.top - panelHeight - 6);
    }

    this.dropdownTop.set(top);
    this.dropdownLeft.set(rect.left);
    this.dropdownWidth.set(rect.width);
    this.paymentMenuOpen.set(true);
  }

  selectPaymentMethod(name: string): void {
    this.form.patchValue({ paymentMethod: name });
    this.form.get('paymentMethod')?.markAsTouched();
    this.paymentMenuOpen.set(false);
  }

  toggleCalendar(): void {
    if (this.calendarOpen()) {
      this.calendarOpen.set(false);
      return;
    }
    this.openCalendar();
  }

  private openCalendar(): void {
    const trigger = this.dateTrigger();
    if (!trigger) return;
    const rect = trigger.nativeElement.getBoundingClientRect();
    const panelWidth = 320;
    const panelHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom;

    const top =
      spaceBelow >= panelHeight + 12 || spaceBelow >= rect.top
        ? rect.bottom + 6
        : Math.max(8, rect.top - panelHeight - 6);
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - panelWidth - 8,
    );

    this.calTop.set(top);
    this.calLeft.set(left);
    this.calendarOpen.set(true);
  }

  onDateSelected(date: Date | null): void {
    if (date) this.form.patchValue({ date });
    this.form.get('date')?.markAsTouched();
    this.calendarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.paymentMenuOpen.set(false);
    this.calendarOpen.set(false);
  }

  @HostListener('window:resize')
  onViewportResize(): void {
    this.paymentMenuOpen.set(false);
    this.calendarOpen.set(false);
  }

  colorForSelectedMethod(): string {
    const name = this.form.get('paymentMethod')?.value;
    if (!name) return '';
    return this.paymentMethods().find((pm) => pm.name === name)?.color ?? '';
  }

  formatCurrency(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    if (!digits) {
      this.form.patchValue({ value: '' });
      return;
    }
    const numeric = Number.parseInt(digits, 10) / 100;
    this.form.patchValue({ value: this.formatNumberAsCurrency(numeric) });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: Omit<Expense, 'id'> = {
      date: this.dateToBR(v.date),
      location: v.location.trim(),
      value: this.parseCurrency(v.value),
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

  private dateToBR(d: Date): string {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  private parseBRDate(date: string): Date {
    const [d, m, y] = date.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  private parseCurrency(formatted: string): number {
    if (!formatted) return 0;
    return Number(formatted.replace(/\./g, '').replace(',', '.'));
  }

  private formatNumberAsCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private minValueValidator(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const numeric = this.parseCurrency(control.value);
      return numeric >= min ? null : { min: { actual: numeric, required: min } };
    };
  }
}
