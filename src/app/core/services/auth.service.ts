import { Injectable, inject, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  User as FbUser,
} from '@angular/fire/auth';
import {
  Firestore,
  arrayUnion,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';

import { Couple, PaymentMethod, Settings, User } from '../models';

/**
 * Default settings created when a new couple is set up. The owner of the
 * first card matches the user's displayName so the message template works
 * out of the box.
 */
function defaultSettingsFor(displayName: string): Omit<Settings, 'id'> {
  const cleanName = displayName.trim() || 'Eu';
  return {
    monthlyBudget: 1600,
    paymentMethods: [
      { name: `Cartão ${cleanName}`, owner: cleanName, color: '#5B8DEF' } as PaymentMethod,
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  /** True while we're determining the initial auth state. */
  private readonly _loading = signal(true);
  readonly loading = this._loading.asReadonly();

  /** Current user profile (Firebase Auth user + Firestore user doc). */
  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, async (fbUser: FbUser | null) => {
      if (!fbUser) {
        this._currentUser.set(null);
        this._loading.set(false);
        return;
      }

      try {
        const profile = await this.fetchUserProfile(fbUser);
        this._currentUser.set(profile);
      } catch (error) {
        console.error('[auth] Falha ao carregar perfil do usuário', error);
        this._currentUser.set(null);
      } finally {
        this._loading.set(false);
      }
    });
  }

  // ---------- Public API ----------

  async signIn(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(this.auth, email.trim(), password);
    return this.fetchUserProfile(credential.user);
  }

  /**
   * Creates a new account.
   * - If `coupleCode` is given, joins that existing couple.
   * - Otherwise, creates a brand new couple owned by this user.
   */
  async signUp(
    email: string,
    password: string,
    displayName: string,
    coupleCode?: string,
  ): Promise<User> {
    const credential = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
    const fbUser = credential.user;

    // Set the display name on the Auth profile (for completeness).
    await updateProfile(fbUser, { displayName: displayName.trim() });

    let coupleId: string;

    if (coupleCode && coupleCode.trim()) {
      // Join existing couple.
      const code = coupleCode.trim();
      const coupleRef = doc(this.firestore, 'couples', code);
      const coupleSnap = await getDoc(coupleRef);

      if (!coupleSnap.exists()) {
        // Roll back: delete the just-created auth user so they can retry.
        await fbUser.delete().catch(() => {});
        throw new Error('Código do casal não encontrado. Verifique com seu par.');
      }

      await updateDoc(coupleRef, { memberUids: arrayUnion(fbUser.uid) });
      coupleId = code;
    } else {
      // Create new couple.
      const coupleRef = doc(collection(this.firestore, 'couples'));
      const newCouple: Couple = {
        id: coupleRef.id,
        name: `${displayName.trim()} & ?`,
        memberUids: [fbUser.uid],
        createdAt: Date.now(),
      };
      await setDoc(coupleRef, newCouple);
      coupleId = coupleRef.id;

      // Seed default settings for this couple.
      const settings: Settings = {
        id: 'default',
        ...defaultSettingsFor(displayName),
      };
      await setDoc(doc(this.firestore, 'couples', coupleId, 'config', 'settings'), settings);
    }

    // Create the user profile document.
    const userProfile: User = {
      uid: fbUser.uid,
      email: fbUser.email ?? email.trim(),
      displayName: displayName.trim(),
      coupleId,
    };
    await setDoc(doc(this.firestore, 'users', fbUser.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
    });

    this._currentUser.set(userProfile);
    return userProfile;
  }

  async signOut(): Promise<void> {
    await fbSignOut(this.auth);
    this._currentUser.set(null);
  }

  /** Returns the current couple ID, or throws if no user is logged in. */
  requireCoupleId(): string {
    const u = this._currentUser();
    if (!u) throw new Error('No authenticated user.');
    return u.coupleId;
  }

  // ---------- Helpers ----------

  private async fetchUserProfile(fbUser: FbUser): Promise<User> {
    const userRef = doc(this.firestore, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Perfil do usuário não encontrado no Firestore.');
    }

    const data = userSnap.data() as Partial<User>;
    return {
      uid: fbUser.uid,
      email: fbUser.email ?? data.email ?? '',
      displayName: data.displayName ?? fbUser.displayName ?? 'Usuário',
      coupleId: data.coupleId ?? '',
    };
  }
}
