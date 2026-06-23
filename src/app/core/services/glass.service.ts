import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'snack-budget.liquid-glass';

/**
 * Liga/desliga o visual "Liquid Glass" do app.
 * Quando desativado, adiciona a classe `no-glass` no <html>, e as superfícies
 * voltam ao estilo sólido anterior (sem blur/transparência/brilho).
 */
@Injectable({ providedIn: 'root' })
export class GlassService {
  private readonly _enabled = signal<boolean>(this.loadInitial());

  readonly enabled = this._enabled.asReadonly();

  constructor() {
    effect(() => {
      const on = this._enabled();
      document.documentElement.classList.toggle('no-glass', !on);
      try {
        localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
      } catch {
        /* localStorage may be blocked */
      }
    });
  }

  toggle(): void {
    this._enabled.update((v) => !v);
  }

  set(enabled: boolean): void {
    this._enabled.set(enabled);
  }

  private loadInitial(): boolean {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'off') return false;
      if (saved === 'on') return true;
    } catch {
      /* ignore */
    }
    return true; // Liquid Glass ligado por padrão
  }
}
