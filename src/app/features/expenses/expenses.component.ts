import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { Expense } from '../../core/models';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';
import { MonthFilterService } from '../../core/services/month-filter.service';
import { ToastService } from '../../core/services/toast.service';
import { BrlPipe } from '../../shared/pipes/brl.pipe';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { MonthFilterComponent } from '../../shared/components/month-filter.component';
import {
  ExpenseDetailSheetComponent,
  ExpenseDetailData,
  ExpenseDetailAction,
} from './expense-detail.sheet';

interface ExpenseGroup {
  key: string;
  label: string;
  items: Expense[];
}

type SortOption = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    BrlPipe,
    MonthFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  private readonly expenseService = inject(ExpenseService);
  private readonly settingsService = inject(SettingsService);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly filter = inject(MonthFilterService);

  // Filters
  readonly searchTerm = signal('');
  readonly methodFilter = signal<string>('');
  readonly sort = signal<SortOption>('date-desc');

  readonly paymentMethods = computed(
    () => this.settingsService.settings()?.paymentMethods ?? [],
  );

  readonly expensesAll = computed(() => this.expenseService.expenses());

  readonly monthExpenses = computed(() => {
    this.expenseService.expenses();
    const { month, year } = this.filter.current();
    return this.expenseService.filterByMonth(month, year);
  });

  readonly filteredExpenses = computed(() => {
    let list = this.monthExpenses();
    const term = this.searchTerm().trim().toLowerCase();
    const method = this.methodFilter();

    if (term) {
      list = list.filter((e) => e.location.toLowerCase().includes(term));
    }
    if (method) {
      list = list.filter((e) => e.paymentMethod === method);
    }

    const sortKey = this.sort();
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'date-desc':
          return this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime();
        case 'date-asc':
          return this.parseDate(a.date).getTime() - this.parseDate(b.date).getTime();
        case 'value-desc':
          return b.value - a.value;
        case 'value-asc':
          return a.value - b.value;
      }
    });
  });

  readonly groupedExpenses = computed<ExpenseGroup[]>(() => {
    const list = this.filteredExpenses();
    const groups = new Map<string, Expense[]>();

    for (const expense of list) {
      const items = groups.get(expense.date);
      if (items) {
        items.push(expense);
      } else {
        groups.set(expense.date, [expense]);
      }
    }

    const asc = this.sort() === 'date-asc';
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        const diff = this.parseDate(a).getTime() - this.parseDate(b).getTime();
        return asc ? diff : -diff;
      })
      .map(([key, items]) => ({ key, label: this.dayLabel(key), items }));
  });

  readonly monthTotal = computed(() =>
    this.monthExpenses().reduce((acc, e) => acc + e.value, 0),
  );

  readonly average = computed(() => {
    const list = this.monthExpenses();
    return list.length > 0 ? this.monthTotal() / list.length : 0;
  });

  colorForMethod(name: string): string {
    return this.paymentMethods().find((p) => p.name === name)?.color || '#6750A4';
  }

  copyMessage(expense: Expense): void {
    const settings = this.settingsService.settings();
    if (!settings) return;
    const message = this.expenseService.buildMessage(expense, settings);
    navigator.clipboard
      .writeText(message)
      .then(() => this.toast.success('Mensagem copiada ✨'))
      .catch(() => this.toast.error('Não consegui copiar 😢'));
  }

  remove(expense: Expense): void {
    if (!expense.id) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir lanchinho?',
        message: `O registro de "${expense.location}" será removido. Essa ação não pode ser desfeita.`,
        confirmLabel: 'Excluir',
        cancelLabel: 'Cancelar',
        destructive: true,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed || !expense.id) return;
      this.expenseService.remove(expense.id).subscribe({
        next: () => this.toast.success('Removido com sucesso'),
        error: () => this.toast.error('Não foi possível remover'),
      });
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.methodFilter.set('');
  }

  openDetails(expense: Expense): void {
    const ref = this.bottomSheet.open<
      ExpenseDetailSheetComponent,
      ExpenseDetailData,
      ExpenseDetailAction
    >(ExpenseDetailSheetComponent, {
      data: { expense, methodColor: this.colorForMethod(expense.paymentMethod) },
    });

    ref.afterDismissed().subscribe((action) => {
      if (!action) return;
      switch (action) {
        case 'edit':
          if (expense.id) this.router.navigate(['/expenses', expense.id, 'edit']);
          break;
        case 'copy':
          this.copyMessage(expense);
          break;
        case 'delete':
          this.remove(expense);
          break;
      }
    });
  }

  private dayLabel(date: string): string {
    return this.parseDate(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  private parseDate(date: string): Date {
    const [d, m, y] = date.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
}
