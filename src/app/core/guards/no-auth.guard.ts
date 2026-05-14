import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Inverse of authGuard: blocks already-authenticated users from reaching
 * the login screen, sending them straight to the dashboard.
 *
 * Used on the login route so that opening the app while a session is
 * still valid skips the login form entirely.
 */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (auth.currentUser()) {
        return router.createUrlTree(['/dashboard']);
      }
      return true;
    }),
  );
};
