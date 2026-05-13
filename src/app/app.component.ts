import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ExpenseService } from './core/services/expense.service';
import { SettingsService } from './core/services/settings.service';
import { ThemeService } from './core/services/theme.service';
import { ShellComponent } from './layout/shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-shell />`,
})
export class AppComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  private readonly settingsService = inject(SettingsService);

  // Injected so its effect runs at startup (DOM dark-theme class).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly themeService = inject(ThemeService);

  ngOnInit(): void {
    // localStorage reads are synchronous — just hydrate signals.
    this.expenseService.list().subscribe();
    this.settingsService.load().subscribe();
  }
}
