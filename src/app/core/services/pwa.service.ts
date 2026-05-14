import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ToastService } from './toast.service';

/**
 * `beforeinstallprompt` event shape (Chrome/Edge/Android browsers).
 * Not yet in TypeScript lib, so we type it locally.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Handles two PWA concerns:
 * - **Update detection** — when a new build is deployed (Vercel push), the
 *   service worker notices and we surface a toast so the user can reload.
 * - **Install prompt capture** — Chromium browsers fire `beforeinstallprompt`
 *   when the app is installable. We store the event so a UI button can
 *   trigger the prompt on demand.
 */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly document = inject(DOCUMENT);
  private readonly swUpdate = inject(SwUpdate);
  private readonly toast = inject(ToastService);

  /** True when an install prompt is available (Android/Chrome/Edge). */
  readonly canInstall = signal(false);

  /** True when the app is already running standalone (installed). */
  readonly isStandalone = signal(this.detectStandalone());

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  init(): void {
    this.listenForUpdates();
    this.listenForInstallPrompt();
  }

  /**
   * Triggers the native install prompt. Returns true if the user accepted.
   * Should only be called from a user gesture (button click).
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.canInstall.set(false);
      return choice.outcome === 'accepted';
    } catch {
      return false;
    }
  }

  // ---------- Internals ----------

  private listenForUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.toast.info('Nova versão disponível. Recarregando em 3s...');
        setTimeout(() => this.document.defaultView?.location.reload(), 3000);
      });

    // Check every hour for new versions while the app is open.
    this.document.defaultView?.setInterval(
      () => this.swUpdate.checkForUpdate().catch(() => {}),
      60 * 60 * 1000,
    );
  }

  private listenForInstallPrompt(): void {
    if (!this.document.defaultView) return;

    this.document.defaultView.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });

    this.document.defaultView.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.isStandalone.set(true);
      this.toast.success('App instalado! 🎉');
    });
  }

  private detectStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isDisplayStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
    return Boolean(isIosStandalone || isDisplayStandalone);
  }
}
