import { Injectable, signal, computed } from '@angular/core';
import { MonthYear } from '../models';

const MONTH_NAMES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function buildLabel(month: number, year: number): string {
  return `${MONTH_NAMES_PT[month - 1]} de ${year}`;
}

/**
 * Single global source for the currently-selected month.
 * Every screen reads this signal so charts/lists recompute automatically
 * whenever the user navigates to another month.
 */
@Injectable({ providedIn: 'root' })
export class MonthFilterService {
  private readonly _current = signal<MonthYear>(this.buildToday());

  readonly current = this._current.asReadonly();
  readonly label = computed(() => this._current().label);

  prev(): void {
    const c = this._current();
    let m = c.month - 1;
    let y = c.year;
    if (m < 1) { m = 12; y -= 1; }
    this.set(m, y);
  }

  next(): void {
    const c = this._current();
    let m = c.month + 1;
    let y = c.year;
    if (m > 12) { m = 1; y += 1; }
    this.set(m, y);
  }

  set(month: number, year: number): void {
    this._current.set({ month, year, label: buildLabel(month, year) });
  }

  goToCurrentMonth(): void {
    this._current.set(this.buildToday());
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    const c = this._current();
    return c.month === now.getMonth() + 1 && c.year === now.getFullYear();
  }

  private buildToday(): MonthYear {
    const d = new Date();
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    return { month: m, year: y, label: buildLabel(m, y) };
  }
}
