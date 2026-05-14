import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CollectionReference,
  DocumentReference,
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

import { Expense, Settings } from '../models';

/**
 * Thin layer between the Firestore SDK and our domain services.
 * Keeps onSnapshot subscriptions, document references, and IDs in one place
 * so ExpenseService / SettingsService stay focused on business logic.
 */
@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private readonly firestore = inject(Firestore);

  // ---------- References ----------

  private expensesRef(coupleId: string): CollectionReference<Expense> {
    return collection(this.firestore, 'couples', coupleId, 'expenses') as CollectionReference<Expense>;
  }

  private settingsRef(coupleId: string): DocumentReference<Settings> {
    return doc(this.firestore, 'couples', coupleId, 'config', 'settings') as DocumentReference<Settings>;
  }

  // ---------- Expenses ----------

  /** Live stream of expenses for a couple. Emits on every server change. */
  watchExpenses(coupleId: string): Observable<Expense[]> {
    return new Observable<Expense[]>((subscriber) => {
      const q = query(this.expensesRef(coupleId), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const items: Expense[] = snap.docs.map((d) => {
            const data = d.data() as Expense;
            return { ...data, id: d.id };
          });
          subscriber.next(items);
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  async addExpense(coupleId: string, expense: Omit<Expense, 'id'>): Promise<string> {
    const ref = await addDoc(this.expensesRef(coupleId), {
      ...expense,
      createdAt: Date.now(),
    } as Expense);
    return ref.id;
  }

  async updateExpense(coupleId: string, expense: Expense): Promise<void> {
    if (!expense.id) throw new Error('Expense.id is required for update.');
    const { id, ...payload } = expense;
    await updateDoc(doc(this.expensesRef(coupleId), id), payload as Partial<Expense>);
  }

  async removeExpense(coupleId: string, id: string): Promise<void> {
    await deleteDoc(doc(this.expensesRef(coupleId), id));
  }

  // ---------- Settings ----------

  /** Live stream of settings for a couple. */
  watchSettings(coupleId: string): Observable<Settings | null> {
    return new Observable<Settings | null>((subscriber) => {
      const unsub = onSnapshot(
        this.settingsRef(coupleId),
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(null);
            return;
          }
          subscriber.next({ ...(snap.data() as Settings), id: snap.id });
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  async setSettings(coupleId: string, settings: Settings): Promise<void> {
    const { id, ...payload } = settings;
    await setDoc(this.settingsRef(coupleId), { ...payload, id } as Settings);
  }
}
