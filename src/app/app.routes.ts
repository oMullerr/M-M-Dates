import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { AuthService } from './core/services/auth.service';

/**
 * Redirects the root path "/" based on the current auth state:
 * - logged in  → /dashboard
 * - logged out → /login
 *
 * Implemented as a canActivate guard that always returns a UrlTree.
 */
const rootRedirect = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() =>
      auth.currentUser()
        ? router.createUrlTree(['/dashboard'])
        : router.createUrlTree(['/login']),
    ),
  );
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootRedirect],
    children: [],
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    title: 'Entrar · M&M Dates',
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard · M&M Dates',
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent),
    title: 'Gastos · M&M Dates',
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
    title: 'Configurações · M&M Dates',
  },
  // Wildcard fallback — same logic as root: route based on auth state.
  {
    path: '**',
    canActivate: [rootRedirect],
    children: [],
  },
];
