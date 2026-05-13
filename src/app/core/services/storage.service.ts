import { Injectable } from '@angular/core';
import { Expense, Settings } from '../models';

const KEYS = {
  expenses: 'snack-budget.expenses',
  settings: 'snack-budget.settings',
} as const;

/**
 * Data seed used on the first run, when localStorage is still empty.
 * After that, all reads/writes go through localStorage and persist
 * across page reloads on the same browser/device.
 */
const SEED: { expenses: Expense[]; settings: Settings } = {
  expenses: [
    { id: '1', date: '03/05/2026', location: 'Cinemark Catuaí', value: 78.5, paymentMethod: 'Cartão Math' },
    { id: '2', date: '05/05/2026', location: 'Outback Steakhouse', value: 215.9, paymentMethod: 'Flash Mari' },
    { id: '3', date: '08/05/2026', location: 'Sorveteria Bacio di Latte', value: 42, paymentMethod: 'Cartão Math' },
    { id: '4', date: '10/05/2026', location: 'Sushi Yamato', value: 198.4, paymentMethod: 'Flash Mari' },
  ],
  settings: {
    id: 'default',
    monthlyBudget: 1600,
    paymentMethods: [
      { name: 'Cartão Math', owner: 'Math', color: '#5B8DEF' },
      { name: 'Flash Mari', owner: 'Mari', color: '#E879A8' },
    ],
  },
};

/**
 * Thin wrapper around window.localStorage that handles JSON
 * serialization, falls back to in-memory data when storage is
 * unavailable (e.g. Safari private mode), and seeds initial data
 * on the first run.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private memoryExpenses: Expense[] | null = null;
  private memorySettings: Settings | null = null;
  private storageAvailable: boolean;

  constructor() {
    this.storageAvailable = this.isStorageAvailable();
  }

  // ---------- Expenses ----------

  readExpenses(): Expense[] {
    if (!this.storageAvailable) {
      return this.memoryExpenses ?? (this.memoryExpenses = structuredClone(SEED.expenses));
    }

    const raw = localStorage.getItem(KEYS.expenses);
    if (raw === null) {
      const initial = structuredClone(SEED.expenses);
      this.writeExpenses(initial);
      return initial;
    }

    try {
      return JSON.parse(raw) as Expense[];
    } catch {
      console.warn('[storage] Falha ao ler "expenses". Restaurando seed.');
      const initial = structuredClone(SEED.expenses);
      this.writeExpenses(initial);
      return initial;
    }
  }

  writeExpenses(expenses: Expense[]): void {
    if (!this.storageAvailable) {
      this.memoryExpenses = expenses;
      return;
    }
    localStorage.setItem(KEYS.expenses, JSON.stringify(expenses));
  }

  // ---------- Settings ----------

  readSettings(): Settings {
    if (!this.storageAvailable) {
      return this.memorySettings ?? (this.memorySettings = structuredClone(SEED.settings));
    }

    const raw = localStorage.getItem(KEYS.settings);
    if (raw === null) {
      const initial = structuredClone(SEED.settings);
      this.writeSettings(initial);
      return initial;
    }

    try {
      return JSON.parse(raw) as Settings;
    } catch {
      console.warn('[storage] Falha ao ler "settings". Restaurando seed.');
      const initial = structuredClone(SEED.settings);
      this.writeSettings(initial);
      return initial;
    }
  }

  writeSettings(settings: Settings): void {
    if (!this.storageAvailable) {
      this.memorySettings = settings;
      return;
    }
    localStorage.setItem(KEYS.settings, JSON.stringify(settings));
  }

  // ---------- Maintenance ----------

  /** Removes all stored data — useful for a "reset" button in the future. */
  clear(): void {
    if (!this.storageAvailable) {
      this.memoryExpenses = null;
      this.memorySettings = null;
      return;
    }
    localStorage.removeItem(KEYS.expenses);
    localStorage.removeItem(KEYS.settings);
  }

  /** Exports current data as a JSON string (for backup/download). */
  exportAll(): string {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      expenses: this.readExpenses(),
      settings: this.readSettings(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Imports a previously exported JSON string. Validates the shape before
   * overwriting current data; throws a friendly error on invalid input.
   */
  importAll(json: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Arquivo não é um JSON válido');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Arquivo inválido');
    }

    const data = parsed as { expenses?: unknown; settings?: unknown };
    if (!Array.isArray(data.expenses) || !data.settings || typeof data.settings !== 'object') {
      throw new Error('Estrutura do arquivo não bate com um backup válido');
    }

    this.writeExpenses(data.expenses as Expense[]);
    this.writeSettings(data.settings as Settings);
  }

  /** Restores the seed data, overwriting everything currently stored. */
  resetAll(): void {
    this.writeExpenses(structuredClone(SEED.expenses));
    this.writeSettings(structuredClone(SEED.settings));
  }

  /** Generates a stable, unique ID for new records. */
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // ---------- Helpers ----------

  private isStorageAvailable(): boolean {
    try {
      const probe = '__snack_budget_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return true;
    } catch {
      return false;
    }
  }
}
