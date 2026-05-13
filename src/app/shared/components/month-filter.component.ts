import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MonthFilterService } from '../../core/services/month-filter.service';

@Component({
  selector: 'app-month-filter',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="month-filter">
      <button
        mat-icon-button
        (click)="filter.prev()"
        matTooltip="Mês anterior"
        aria-label="Mês anterior"
      >
        <mat-icon>chevron_left</mat-icon>
      </button>

      <div class="display">
        <span class="label">{{ filter.label() }}</span>
        @if (filter.isCurrentMonth()) {
          <span class="dot" matTooltip="Mês atual"></span>
        }
      </div>

      <button
        mat-icon-button
        (click)="filter.next()"
        matTooltip="Próximo mês"
        aria-label="Próximo mês"
      >
        <mat-icon>chevron_right</mat-icon>
      </button>

      @if (!filter.isCurrentMonth()) {
        <button
          mat-button
          color="primary"
          (click)="filter.goToCurrentMonth()"
          class="today-btn"
        >
          <mat-icon>today</mat-icon>
          Hoje
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    .month-filter {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--mat-sys-surface-container);
      border-radius: 999px;
      padding: 4px;
    }

    .display {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 12px;
      min-width: 160px;
      justify-content: center;
    }

    .label {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
      color: var(--mat-sys-on-surface);
      text-transform: capitalize;
      white-space: nowrap;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--mat-sys-primary);
      flex-shrink: 0;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--mat-sys-primary) 20%, transparent);
    }

    .today-btn {
      margin-left: 4px;
      border-radius: 999px !important;
    }

    .today-btn .mat-icon {
      margin-right: 4px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 600px) {
      .display { min-width: 120px; padding: 0 6px; }
      .label { font-size: 0.92rem; }
      .today-btn { padding: 0 10px !important; min-width: 0 !important; }
    }
  `],
})
export class MonthFilterComponent {
  readonly filter = inject(MonthFilterService);
}
