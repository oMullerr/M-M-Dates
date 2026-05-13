import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { Expense, MonthSummary } from '../../core/models';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsService } from '../../core/services/settings.service';
import { MonthFilterService } from '../../core/services/month-filter.service';
import { ThemeService } from '../../core/services/theme.service';
import { BrlPipe } from '../../shared/pipes/brl.pipe';
import { ExpenseDialogComponent } from '../../shared/components/expense-dialog.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    BaseChartDirective,
    BrlPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly expenseService = inject(ExpenseService);
  private readonly settingsService = inject(SettingsService);
  private readonly dialog = inject(MatDialog);
  private readonly themeService = inject(ThemeService);

  readonly filter = inject(MonthFilterService);

  readonly Math = Math;

  // ---------- Reactive summary ----------

  readonly summary = computed<MonthSummary>(() => {
    const settings = this.settingsService.settings();
    if (!settings) return this.emptySummary();
    this.expenseService.expenses(); // dependency tracking
    const { month, year } = this.filter.current();
    return this.expenseService.buildSummary(month, year, settings);
  });

  readonly recentExpenses = computed<Expense[]>(() => {
    this.expenseService.expenses();
    const { month, year } = this.filter.current();
    return this.expenseService
      .filterByMonth(month, year)
      .sort((a, b) => this.parseDate(b.date).getTime() - this.parseDate(a.date).getTime())
      .slice(0, 5);
  });

  // ---------- Header copy ----------

  readonly greetingEmoji = computed(() => {
    const p = this.summary().percentSpent;
    if (p === 0) return '💕';
    if (p < 50) return '😊';
    if (p < 80) return '🤔';
    if (p < 100) return '😬';
    return '🥲';
  });

  readonly greetingTitle = computed(() => {
    if (this.filter.isCurrentMonth()) {
      const h = new Date().getHours();
      if (h < 12) return 'Bom dia, casal!';
      if (h < 18) return 'Boa tarde, casal!';
      return 'Boa noite, casal!';
    }
    return `Resumo de ${this.filter.label()}`;
  });

  readonly greetingSubtitle = computed(() => {
    const s = this.summary();
    if (s.count === 0) return 'Ainda sem registros nesse mês. Bora marcar um date? 💕';
    if (s.remaining < 0)
      return `Vocês estouraram em ${this.brl(Math.abs(s.remaining))}. Cuidado nos próximos! 😅`;
    return `Vocês ainda têm ${this.brl(s.remaining)} para curtir 🥂`;
  });

  // ---------- Status chip ----------

  readonly statusInfo = computed(() => {
    const p = this.summary().percentSpent;
    if (this.summary().count === 0)
      return { label: 'Sem gastos', color: 'var(--mat-sys-on-surface-variant)' };
    if (p < 60) return { label: 'Tranquilo', color: '#10B981' };
    if (p < 90) return { label: 'Atenção', color: '#F59E0B' };
    if (p < 100) return { label: 'No limite', color: '#F97316' };
    return { label: 'Estourou', color: '#EF4444' };
  });

  // ---------- Chart data ----------

  readonly doughnutData = computed<ChartData<'doughnut'>>(() => {
    const settings = this.settingsService.settings();
    const s = this.summary();
    if (!settings) return { labels: [], datasets: [] };

    const items = settings.paymentMethods
      .map((pm) => ({ name: pm.name, color: pm.color, value: s.byMethod[pm.name] || 0 }))
      .filter((item) => item.value > 0);

    return {
      labels: items.map((i) => i.name),
      datasets: [
        {
          data: items.map((i) => i.value),
          backgroundColor: items.map((i) => i.color),
          borderColor: 'transparent',
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  });

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: this.tooltipConfig(),
    },
  };

  readonly barData = computed<ChartData<'bar'>>(() => {
    const s = this.summary();
    const settings = this.settingsService.settings();
    if (!settings) return { labels: [], datasets: [] };

    const owners = Object.keys(s.byOwner);
    const colors = owners.map((o) => {
      const pm = settings.paymentMethods.find((p) => p.owner === o);
      return pm?.color || '#5B8DEF';
    });

    return {
      labels: owners,
      datasets: [
        {
          label: 'Gasto',
          data: owners.map((o) => s.byOwner[o] || 0),
          backgroundColor: colors,
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 60,
        },
      ],
    };
  });

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: this.tooltipConfig(),
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(127, 127, 127, 0.12)' },
        ticks: {
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR'),
        },
      },
    },
  };

  readonly lineData = computed<ChartData<'line'>>(() => {
    this.expenseService.expenses();
    const { month, year } = this.filter.current();
    const expenses = this.expenseService
      .filterByMonth(month, year)
      .sort((a, b) => this.parseDate(a.date).getTime() - this.parseDate(b.date).getTime());

    const byDay = new Map<number, number>();
    expenses.forEach((e) => {
      const day = parseInt(e.date.split('/')[0], 10);
      byDay.set(day, (byDay.get(day) || 0) + e.value);
    });

    const sortedDays = Array.from(byDay.keys()).sort((a, b) => a - b);
    let cumulative = 0;
    const points = sortedDays.map((day) => {
      cumulative += byDay.get(day) || 0;
      return { day, value: cumulative };
    });

    const isDark = this.themeService.isDark();
    const primary = isDark ? '#C7BAFC' : '#6750A4';
    const fill = isDark ? 'rgba(199, 186, 252, 0.16)' : 'rgba(103, 80, 164, 0.12)';

    return {
      labels: points.map((p) => `Dia ${p.day}`),
      datasets: [
        {
          label: 'Acumulado',
          data: points.map((p) => p.value),
          borderColor: primary,
          backgroundColor: fill,
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: primary,
          pointBorderColor: isDark ? '#1c1b1f' : '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  });

  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: this.tooltipConfig(),
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(127, 127, 127, 0.12)' },
        ticks: {
          font: { family: 'Plus Jakarta Sans', size: 11 },
          callback: (v) => 'R$ ' + Number(v).toLocaleString('pt-BR'),
        },
      },
    },
  };

  readonly methodLegend = computed(() => {
    const settings = this.settingsService.settings();
    const s = this.summary();
    if (!settings) return [];
    return settings.paymentMethods
      .map((pm) => ({
        name: pm.name,
        color: pm.color,
        value: s.byMethod[pm.name] || 0,
      }))
      .filter((item) => item.value > 0);
  });

  // ---------- Actions ----------

  openNewExpense(): void {
    this.dialog.open(ExpenseDialogComponent, {
      data: {},
      width: '560px',
      maxWidth: '95vw',
    });
  }

  colorForMethod(name: string): string {
    const settings = this.settingsService.settings();
    return settings?.paymentMethods.find((p) => p.name === name)?.color || '#6750A4';
  }

  // ---------- Helpers ----------

  private brl(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private parseDate(date: string): Date {
    const [d, m, y] = date.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  private emptySummary(): MonthSummary {
    return {
      month: 0,
      year: 0,
      monthlyBudget: 0,
      totalSpent: 0,
      remaining: 0,
      percentSpent: 0,
      count: 0,
      byOwner: {},
      byMethod: {},
    };
  }

  private tooltipConfig() {
    return {
      backgroundColor: '#1c1b1f',
      titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 600 as const },
      bodyFont: { family: 'Plus Jakarta Sans', size: 13 },
      padding: 12,
      cornerRadius: 10,
      callbacks: {
        label: (ctx: any) => {
          const value = typeof ctx.parsed === 'number' ? ctx.parsed : ctx.parsed.y;
          return (
            ' ' + value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          );
        },
      },
    };
  }
}
