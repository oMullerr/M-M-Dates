import { Injectable, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';

import { Expense } from '../models';
import {
  ExpenseDialogComponent,
  ExpenseDialogData,
} from '../../shared/components/expense-dialog.component';

/**
 * Centralizes opening of the expense dialog. Encapsulates the responsive
 * configuration (full-screen bottom-sheet on mobile, centered floating
 * dialog on desktop) and prevents opening more than one instance at once.
 */
@Injectable({ providedIn: 'root' })
export class ExpenseDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly breakpoints = inject(BreakpointObserver);

  private currentRef: MatDialogRef<ExpenseDialogComponent> | null = null;

  /** Opens the dialog to create a new expense. */
  openNew(): MatDialogRef<ExpenseDialogComponent> | null {
    return this.open({});
  }

  /** Opens the dialog to edit an existing expense. */
  openEdit(expense: Expense): MatDialogRef<ExpenseDialogComponent> | null {
    return this.open({ expense });
  }

  // ---------- Internals ----------

  private open(data: ExpenseDialogData): MatDialogRef<ExpenseDialogComponent> | null {
    // Prevent duplicate dialogs: if one is already open, focus it instead.
    if (this.currentRef) {
      // Already open — bring it to the front and ignore the click.
      return this.currentRef;
    }

    const isMobile = this.breakpoints.isMatched('(max-width: 600px)');

    const config: MatDialogConfig<ExpenseDialogData> = isMobile
      ? this.mobileConfig(data)
      : this.desktopConfig(data);

    this.currentRef = this.dialog.open(ExpenseDialogComponent, config);

    this.currentRef.afterClosed().subscribe(() => {
      this.currentRef = null;
    });

    return this.currentRef;
  }

  private desktopConfig(data: ExpenseDialogData): MatDialogConfig<ExpenseDialogData> {
    return {
      data,
      width: '560px',
      maxWidth: '95vw',
      maxHeight: '92vh',
      panelClass: 'expense-dialog-panel',
      backdropClass: 'expense-dialog-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      disableClose: false,
      hasBackdrop: true,
    };
  }

  private mobileConfig(data: ExpenseDialogData): MatDialogConfig<ExpenseDialogData> {
    return {
      data,
      width: '100vw',
      maxWidth: '100vw',
      height: '100dvh',
      maxHeight: '100dvh',
      position: { top: '0', left: '0' },
      panelClass: ['expense-dialog-panel', 'expense-dialog-panel--mobile'],
      backdropClass: 'expense-dialog-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      disableClose: false,
      hasBackdrop: true,
    };
  }
}
