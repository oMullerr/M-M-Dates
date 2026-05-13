import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PaymentMethod, Settings } from '../models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);

  private readonly _settings = signal<Settings | null>(null);
  readonly settings = this._settings.asReadonly();

  load(): Observable<Settings> {
    const data = this.storage.readSettings();
    this._settings.set(data);
    return of(data);
  }

  /** Re-reads from storage. Use after external mutations (import, reset). */
  refresh(): void {
    this._settings.set(this.storage.readSettings());
  }

  update(settings: Settings): Observable<Settings> {
    this._settings.set(settings);
    this.storage.writeSettings(settings);
    return of(settings);
  }

  updateMonthlyBudget(value: number): Observable<Settings> {
    return this.update({ ...this.requireCurrent(), monthlyBudget: value });
  }

  addPaymentMethod(method: PaymentMethod): Observable<Settings> {
    const current = this.requireCurrent();
    return this.update({
      ...current,
      paymentMethods: [...current.paymentMethods, method],
    });
  }

  updatePaymentMethod(originalName: string, method: PaymentMethod): Observable<Settings> {
    const current = this.requireCurrent();
    return this.update({
      ...current,
      paymentMethods: current.paymentMethods.map((m) =>
        m.name === originalName ? method : m,
      ),
    });
  }

  removePaymentMethod(name: string): Observable<Settings> {
    const current = this.requireCurrent();
    return this.update({
      ...current,
      paymentMethods: current.paymentMethods.filter((m) => m.name !== name),
    });
  }

  private requireCurrent(): Settings {
    const c = this._settings();
    if (!c) throw new Error('Settings have not been loaded yet.');
    return c;
  }
}
