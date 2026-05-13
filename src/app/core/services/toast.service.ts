import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.open(message, 'success');
  }

  error(message: string): void {
    this.open(message, 'error');
  }

  info(message: string): void {
    this.open(message, 'info');
  }

  private open(message: string, kind: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'OK', {
      duration: kind === 'error' ? 5000 : 3500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: [`toast-${kind}`],
    });
  }
}
