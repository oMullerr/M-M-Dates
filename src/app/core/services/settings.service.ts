import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, from } from 'rxjs';

import { PaymentMethod, Settings } from '../models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _settings = signal<Settings | null>(null);
  readonly settings = this._settings.asReadonly();

  private currentSub: { unsubscribe(): void } | null = null;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      this.teardownSubscription();

      if (!user?.coupleId) {
        this._settings.set(null);
        return;
      }

      this.currentSub = this.firestore
        .watchSettings(user.coupleId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (s) => this._settings.set(s),
          error: (err) => {
            console.error('[settings] Erro ao escutar Firestore', err);
            this._settings.set(null);
          },
        });
    });
  }

  /** No-op kept for backward compatibility — the live signal is auto-fed. */
  load(): Observable<Settings | null> {
    return new Observable<Settings | null>((sub) => {
      sub.next(this._settings());
      sub.complete();
    });
  }

  update(settings: Settings): Observable<Settings> {
    const coupleId = this.auth.requireCoupleId();
    return from(this.firestore.setSettings(coupleId, settings).then(() => settings));
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

  private teardownSubscription(): void {
    this.currentSub?.unsubscribe();
    this.currentSub = null;
  }
}
