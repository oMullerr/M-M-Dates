import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Expense, MonthSummary, Settings } from '../models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly storage = inject(StorageService);

  private readonly _expenses = signal<Expense[]>([]);
  readonly expenses = this._expenses.asReadonly();

  list(): Observable<Expense[]> {
    const data = this.storage.readExpenses();
    this._expenses.set(data);
    return of(data);
  }

  /** Re-reads from storage. Use after external mutations (import, reset). */
  refresh(): void {
    this._expenses.set(this.storage.readExpenses());
  }

  create(expense: Omit<Expense, 'id'>): Observable<Expense> {
    const created: Expense = { ...expense, id: this.storage.generateId() };
    const next = [...this._expenses(), created];
    this._expenses.set(next);
    this.storage.writeExpenses(next);
    return of(created);
  }

  update(expense: Expense): Observable<Expense> {
    const next = this._expenses().map((e) => (e.id === expense.id ? expense : e));
    this._expenses.set(next);
    this.storage.writeExpenses(next);
    return of(expense);
  }

  remove(id: string): Observable<void> {
    const next = this._expenses().filter((e) => e.id !== id);
    this._expenses.set(next);
    this.storage.writeExpenses(next);
    return of(void 0);
  }

  /* ---------- Pure helpers (used by computed signals) ---------- */

  filterByMonth(month: number, year: number): Expense[] {
    return this._expenses().filter((e) => {
      const parts = e.date.split('/');
      if (parts.length !== 3) return false;
      const m = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);
      return m === month && y === year;
    });
  }

  buildSummary(month: number, year: number, settings: Settings): MonthSummary {
    const list = this.filterByMonth(month, year);
    const totalSpent = list.reduce((acc, e) => acc + e.value, 0);
    const budget = settings.monthlyBudget;
    const remaining = budget - totalSpent;
    const percentSpent = budget > 0 ? (totalSpent / budget) * 100 : 0;

    const byOwner: Record<string, number> = {};
    const byMethod: Record<string, number> = {};

    settings.paymentMethods.forEach((m) => {
      byOwner[m.owner] = 0;
      byMethod[m.name] = 0;
    });

    list.forEach((e) => {
      const pm = settings.paymentMethods.find((m) => m.name === e.paymentMethod);
      if (pm) byOwner[pm.owner] = (byOwner[pm.owner] || 0) + e.value;
      byMethod[e.paymentMethod] = (byMethod[e.paymentMethod] || 0) + e.value;
    });

    return {
      month,
      year,
      monthlyBudget: budget,
      totalSpent,
      remaining,
      percentSpent,
      count: list.length,
      byOwner,
      byMethod,
    };
  }

  /**
   * Remaining budget per owner, splitting the total budget equally.
   * 2 owners with 1600 budget → each starts with 800.
   */
  remainingByOwner(month: number, year: number, settings: Settings): Record<string, number> {
    const owners = Array.from(new Set(settings.paymentMethods.map((m) => m.owner)));
    if (owners.length === 0) return {};
    const perPerson = settings.monthlyBudget / owners.length;
    const summary = this.buildSummary(month, year, settings);
    const out: Record<string, number> = {};
    owners.forEach((o) => {
      out[o] = perPerson - (summary.byOwner[o] || 0);
    });
    return out;
  }

  /**
   * Builds the WhatsApp-ready message in the requested template.
   * Per-owner lines are dynamic and sorted alphabetically.
   */
  buildMessage(expense: Expense, settings: Settings): string {
    const parts = expense.date.split('/');
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    const summary = this.buildSummary(month, year, settings);
    const perOwner = this.remainingByOwner(month, year, settings);

    const fmt = (v: number) =>
      v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const lines = [
      'Oh o lanchinho!! 🍕🍔🍟',
      `Data: ${expense.date}`,
      `Local: ${expense.location}`,
      `Valor: R$ ${fmt(expense.value)}`,
      `Forma de pagamento: ${expense.paymentMethod}`,
    ];

    Object.keys(perOwner).sort().forEach((o) => {
      lines.push(`Budget ${o} restante: R$ ${fmt(perOwner[o])}`);
    });

    lines.push(`Budget total restante: R$ ${fmt(summary.remaining)}`);
    return lines.join('\n');
  }
}
