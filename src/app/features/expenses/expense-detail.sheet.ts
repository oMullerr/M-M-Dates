import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheetModule,
  MatBottomSheetRef,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Expense } from '../../core/models';
import { BrlPipe } from '../../shared/pipes/brl.pipe';

export type ExpenseDetailAction = 'edit' | 'copy' | 'delete';

export interface ExpenseDetailData {
  expense: Expense;
  methodColor: string;
}

@Component({
  selector: 'app-expense-detail-sheet',
  standalone: true,
  imports: [MatBottomSheetModule, MatButtonModule, MatIconModule, BrlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sheet">
      <span class="grabber" aria-hidden="true"></span>

      <header class="sheet-header">
        <span class="bar" [style.background]="data.methodColor"></span>
        <div class="title-block">
          <h2>{{ data.expense.location }}</h2>
          <span class="value serif numeric">{{ data.expense.value | brl }}</span>
        </div>
      </header>

      <dl class="details">
        <div class="detail">
          <dt><mat-icon>event</mat-icon> Data</dt>
          <dd>{{ data.expense.date }}</dd>
        </div>

        <div class="detail">
          <dt><mat-icon>credit_card</mat-icon> Forma de pagamento</dt>
          <dd>
            <span class="pm-dot" [style.background]="data.methodColor"></span>
            {{ data.expense.paymentMethod }}
          </dd>
        </div>

        @if (data.expense.createdByName) {
          <div class="detail">
            <dt><mat-icon>person</mat-icon> Registrado por</dt>
            <dd>{{ data.expense.createdByName }}</dd>
          </div>
        }

        @if (data.expense.createdAt) {
          <div class="detail">
            <dt><mat-icon>schedule</mat-icon> Criado em</dt>
            <dd>{{ createdAtLabel() }}</dd>
          </div>
        }
      </dl>

      <footer class="sheet-actions">
        <button mat-stroked-button (click)="dismiss('copy')">
          <mat-icon>content_copy</mat-icon>
          Copiar
        </button>
        <button mat-stroked-button (click)="dismiss('edit')">
          <mat-icon>edit</mat-icon>
          Editar
        </button>
        <button mat-stroked-button class="destructive" (click)="dismiss('delete')">
          <mat-icon>delete</mat-icon>
          Excluir
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .sheet {
      padding: 8px 20px calc(20px + env(safe-area-inset-bottom));
      max-width: 560px;
      margin: 0 auto;
    }

    .grabber {
      display: block;
      width: 40px;
      height: 4px;
      border-radius: 999px;
      background: var(--mat-sys-outline-variant);
      margin: 0 auto 16px;
    }

    .sheet-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .bar {
      width: 4px;
      align-self: stretch;
      min-height: 40px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .title-block {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }

    .title-block h2 {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.35rem;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .value {
      font-size: 1.5rem;
      color: var(--mat-sys-primary);
    }

    .details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 16px 0;
    }

    .detail {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 0;
    }

    .detail + .detail {
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .detail dt {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail dt .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .detail dd {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      text-align: right;
    }

    .pm-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .sheet-actions {
      display: flex;
      gap: 8px;
      padding-top: 8px;
    }

    .sheet-actions button {
      flex: 1;
      border-radius: 999px !important;
    }

    .sheet-actions .mat-icon { margin-right: 4px; }

    .destructive {
      color: var(--mat-sys-error);
    }
  `],
})
export class ExpenseDetailSheetComponent {
  readonly ref =
    inject<MatBottomSheetRef<ExpenseDetailSheetComponent, ExpenseDetailAction>>(MatBottomSheetRef);
  readonly data = inject<ExpenseDetailData>(MAT_BOTTOM_SHEET_DATA);

  createdAtLabel(): string {
    const ts = this.data.expense.createdAt;
    if (!ts) return '';
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  dismiss(action: ExpenseDetailAction): void {
    this.ref.dismiss(action);
  }
}
