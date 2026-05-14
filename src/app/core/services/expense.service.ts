import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, from } from 'rxjs';

import { Expense, MonthSummary, Settings } from '../models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

/**
 * Owns the expenses signal for the current couple.
 * Subscribes to live updates from Firestore whenever a user is logged in,
 * and unsubscribes when they log out.
 */
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _expenses = signal<Expense[]>([]);
  readonly expenses = this._expenses.asReadonly();

  private currentSub: { unsubscribe(): void } | null = null;

  constructor() {
    // Auto-(re)subscribe whenever the current user changes.
    effect(() => {
      const user = this.auth.currentUser();
      this.teardownSubscription();

      if (!user?.coupleId) {
        this._expenses.set([]);
        return;
      }

      this.currentSub = this.firestore
        .watchExpenses(user.coupleId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (items) => this._expenses.set(items),
          error: (err) => {
            console.error('[expense] Erro ao escutar Firestore', err);
            this._expenses.set([]);
          },
        });
    });
  }

  /**
   * No-op kept for backward compatibility with the previous local-storage
   * implementation. The signal is already kept up-to-date via onSnapshot.
   */
  list(): Observable<Expense[]> {
    return new Observable<Expense[]>((sub) => {
      sub.next(this._expenses());
      sub.complete();
    });
  }

  create(expense: Omit<Expense, 'id'>): Observable<Expense> {
    const coupleId = this.auth.requireCoupleId();
    return from(
      this.firestore.addExpense(coupleId, expense).then((id) => ({ ...expense, id })),
    );
  }

  update(expense: Expense): Observable<Expense> {
    const coupleId = this.auth.requireCoupleId();
    return from(this.firestore.updateExpense(coupleId, expense).then(() => expense));
  }

  remove(id: string): Observable<void> {
    const coupleId = this.auth.requireCoupleId();
    return from(this.firestore.removeExpense(coupleId, id));
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

    Object.keys(perOwner)
      .sort()
      .forEach((o) => {
        lines.push(`Budget ${o} restante: R$ ${fmt(perOwner[o])}`);
      });

    lines.push(`Budget total restante: R$ ${fmt(summary.remaining)}`);
    return lines.join('\n');
  }

  private teardownSubscription(): void {
    this.currentSub?.unsubscribe();
    this.currentSub = null;
  }
}
