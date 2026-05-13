import { Injectable, signal, computed, effect } from '@angular/core';
import { ThemeMode } from '../models';

const STORAGE_KEY = 'snack-budget.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.loadInitialTheme());

  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode() === 'dark');

  constructor() {
    effect(() => {
      const current = this._mode();
      document.documentElement.classList.toggle('dark-theme', current === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, current);
      } catch {
        /* localStorage may be blocked */
      }
    });
  }

  toggle(): void {
    this._mode.update((m) => (m === 'light' ? 'dark' : 'light'));
  }

  set(mode: ThemeMode): void {
    this._mode.set(mode);
  }

  private loadInitialTheme(): ThemeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
