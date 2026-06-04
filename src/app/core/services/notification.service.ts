import { Injectable, Injector, inject, runInInjectionContext, signal } from '@angular/core';
import {
  Messaging,
  deleteToken,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from '@angular/fire/messaging';

import { environment } from '../../../environments/environment';
import { PushToken } from '../models';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

/**
 * The FCM service worker is registered at a dedicated scope so it can coexist
 * with Angular's `ngsw-worker.js` (which controls `/`). Push events are bound
 * to the registration, not the scope, so they still reach this worker.
 */
const FCM_SW_URL = '/firebase-messaging-sw.js';
const FCM_SW_SCOPE = '/firebase-cloud-messaging-push-scope';

/**
 * Owns Web Push (FCM) on the client:
 * - feature detection (older iOS / unsupported browsers degrade gracefully),
 * - permission + token lifecycle (enable / disable / refresh),
 * - foreground message handling (shows a system notification, per product decision).
 *
 * Messaging is injected lazily so unsupported browsers never construct it.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthService);
  private readonly firestore = inject(FirestoreService);

  /** Current browser permission, or 'unsupported' when push isn't available at all. */
  readonly permission = signal<NotificationPermission | 'unsupported'>(this.readPermission());

  /** True when a token is currently registered for this device (drives the UI toggle). */
  readonly enabled = signal(false);

  private supportedPromise?: Promise<boolean>;
  private currentToken: string | null = null;
  private foregroundBound = false;

  /** True when this browser/device can do web push (iOS needs 16.4+ standalone PWA). */
  async isSupported(): Promise<boolean> {
    if (!this.supportedPromise) {
      this.supportedPromise = (async () => {
        if (typeof window === 'undefined') return false;
        if (
          !('serviceWorker' in navigator) ||
          !('Notification' in window) ||
          !('PushManager' in window)
        ) {
          return false;
        }
        try {
          return await isMessagingSupported();
        } catch {
          return false;
        }
      })();
    }
    return this.supportedPromise;
  }

  /**
   * Turns notifications on. Must be called from a user gesture (the toggle),
   * because iOS only allows `requestPermission()` from a real interaction.
   * Returns true when a token was successfully registered.
   */
  async enable(): Promise<boolean> {
    if (!(await this.isSupported())) return false;

    const user = this.auth.currentUser();
    if (!user?.coupleId) return false;

    const permission = await Notification.requestPermission();
    this.permission.set(permission);
    if (permission !== 'granted') return false;

    try {
      const token = await this.fetchToken();
      if (!token) return false;
      this.currentToken = token;
      await this.firestore.savePushToken(
        user.coupleId,
        this.buildTokenDoc(token, user.uid, user.displayName),
      );
      this.enabled.set(true);
      this.listenForeground();
      return true;
    } catch (err) {
      console.error('[push] Falha ao ativar notificações', err);
      return false;
    }
  }

  /** Turns notifications off: deletes the FCM token and removes its Firestore doc. */
  async disable(): Promise<void> {
    const coupleId = this.auth.currentUser()?.coupleId;
    try {
      if (!(await this.isSupported())) return;
      const token = this.currentToken ?? (await this.fetchToken().catch(() => null));
      await deleteToken(this.messaging).catch(() => {});
      if (token && coupleId) {
        await this.firestore.deletePushToken(coupleId, token).catch(() => {});
      }
      this.currentToken = null;
      this.enabled.set(false);
    } catch (err) {
      console.error('[push] Falha ao desativar notificações', err);
    }
  }

  /**
   * On app boot: if permission was already granted, refresh the stored token.
   * FCM tokens can rotate, so re-upserting on each launch keeps them current.
   */
  async refreshTokenIfEnabled(): Promise<void> {
    if (!(await this.isSupported())) return;
    if (this.readPermission() !== 'granted') return;

    const user = this.auth.currentUser();
    if (!user?.coupleId) return;

    try {
      const token = await this.fetchToken();
      if (!token) return;
      this.currentToken = token;
      await this.firestore.savePushToken(
        user.coupleId,
        this.buildTokenDoc(token, user.uid, user.displayName),
      );
      this.enabled.set(true);
      this.listenForeground();
    } catch (err) {
      console.error('[push] Falha ao atualizar token', err);
    }
  }

  /**
   * Shows a system notification while the app is in the foreground (product
   * decision). FCM doesn't auto-display foreground messages, so we render it
   * via the FCM service worker registration (which owns the click handler).
   */
  listenForeground(): void {
    if (this.foregroundBound) return;
    this.foregroundBound = true;

    onMessage(this.messaging, async (payload) => {
      const data = payload.data ?? {};
      const title = data['title'] ?? 'Novo gasto 🍔';
      try {
        const reg =
          (await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE)) ??
          (await navigator.serviceWorker.ready);
        await reg.showNotification(title, {
          body: data['body'] ?? '',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: data['expenseId'] || undefined,
          data: { url: data['url'] ?? '/expenses' },
        });
      } catch (err) {
        console.error('[push] Falha ao exibir notificação em foreground', err);
      }
    });
  }

  // ---------- helpers ----------

  private get messaging(): Messaging {
    return runInInjectionContext(this.injector, () => inject(Messaging));
  }

  private async fetchToken(): Promise<string | null> {
    const registration = await this.registerFcmServiceWorker();
    const token = await getToken(this.messaging, {
      vapidKey: environment.vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  }

  private async registerFcmServiceWorker(): Promise<ServiceWorkerRegistration> {
    const existing = await navigator.serviceWorker.getRegistration(FCM_SW_SCOPE);
    if (existing) return existing;
    return navigator.serviceWorker.register(FCM_SW_URL, { scope: FCM_SW_SCOPE });
  }

  private buildTokenDoc(token: string, uid: string, displayName: string): PushToken {
    return {
      token,
      uid,
      displayName,
      platform: this.detectPlatform(),
      createdAt: Date.now(),
      userAgent: navigator.userAgent,
    };
  }

  private detectPlatform(): string {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'desktop';
  }

  private readPermission(): NotificationPermission | 'unsupported' {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  }
}
