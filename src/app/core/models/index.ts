/**
 * Domain models for the snack-budget application.
 * Field names are in English; UI labels are translated in components.
 */

export interface Expense {
  id?: string;
  /** Format: dd/MM/yyyy */
  date: string;
  location: string;
  /** Amount in BRL (R$) */
  value: number;
  /** Must match a name in Settings.paymentMethods */
  paymentMethod: string;
}

export interface PaymentMethod {
  /** Display name, e.g. "Cartão Math" */
  name: string;
  /** Owner / person, e.g. "Math", "Mari" */
  owner: string;
  /** Hex color used in charts and chips */
  color: string;
}

export interface Settings {
  id: string;
  monthlyBudget: number;
  paymentMethods: PaymentMethod[];
}

export interface MonthYear {
  /** 1-12 */
  month: number;
  year: number;
  /** Localized label, e.g. "maio de 2026" */
  label: string;
}

export interface MonthSummary {
  month: number;
  year: number;
  monthlyBudget: number;
  totalSpent: number;
  remaining: number;
  percentSpent: number;
  count: number;
  byOwner: Record<string, number>;
  byMethod: Record<string, number>;
}

export type ThemeMode = 'light' | 'dark';
