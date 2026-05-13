import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm">
      <div class="icon-wrap" [class.destructive]="data.destructive">
        <mat-icon>{{ data.destructive ? 'warning' : 'help' }}</mat-icon>
      </div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="actions">
        <button mat-button (click)="ref.close(false)">
          {{ data.cancelLabel ?? 'Cancelar' }}
        </button>
        <button
          mat-flat-button
          [color]="data.destructive ? 'warn' : 'primary'"
          (click)="ref.close(true)"
        >
          {{ data.confirmLabel ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirm {
      padding: 28px 24px 20px;
      text-align: center;
      min-width: 280px;
      max-width: 380px;
    }

    .icon-wrap {
      width: 56px;
      height: 56px;
      margin: 0 auto 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: color-mix(in srgb, var(--mat-sys-primary) 12%, transparent);
      color: var(--mat-sys-primary);
    }

    .icon-wrap.destructive {
      background: color-mix(in srgb, var(--mat-sys-error) 12%, transparent);
      color: var(--mat-sys-error);
    }

    .icon-wrap .mat-icon { font-size: 28px; width: 28px; height: 28px; }

    h2 {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 1.3rem;
      margin-bottom: 6px;
      color: var(--mat-sys-on-surface);
    }

    p {
      font-size: 0.9rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: center;
    }
  `],
})
export class ConfirmDialogComponent {
  readonly ref = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
