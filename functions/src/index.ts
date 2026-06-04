import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

initializeApp();

/**
 * IMPORTANT: a Firestore trigger must run in the SAME region as the Firestore
 * database. The mm-dates DB is assumed to be in São Paulo (southamerica-east1).
 * If `firebase deploy` fails with a region/location error, change this to your
 * database's location (Console → Firestore → ⚙️), e.g. 'us-central1'.
 */
setGlobalOptions({ region: 'southamerica-east1' });

interface ExpenseDoc {
  location?: string;
  value?: number;
  paymentMethod?: string;
  createdByUid?: string;
  createdByName?: string;
}

interface PushTokenDoc {
  token: string;
  uid: string;
}

const formatBRL = (value: number): string =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * When a member registers a new expense, notify the OTHER member(s) of the
 * couple with location, amount and who added it. Data-only message → the
 * service worker renders the notification (consistent design, iOS-friendly).
 */
export const notifyNewExpense = onDocumentCreated(
  'couples/{coupleId}/expenses/{expenseId}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const expense = snap.data() as ExpenseDoc;
    const { coupleId, expenseId } = event.params;

    const creatorUid = expense.createdByUid ?? '';
    const creatorName = expense.createdByName?.trim() || 'Seu par';
    const location = expense.location?.trim() || 'um lugar';
    const value = typeof expense.value === 'number' ? expense.value : 0;

    const db = getFirestore();
    const tokensSnap = await db.collection(`couples/${coupleId}/pushTokens`).get();
    if (tokensSnap.empty) {
      logger.info('Nenhum token registrado para o casal', { coupleId });
      return;
    }

    // Notify everyone in the couple EXCEPT whoever created the expense.
    const targets = tokensSnap.docs
      .map((d) => ({ ref: d.ref, ...(d.data() as PushTokenDoc) }))
      .filter((t) => t.token && t.uid !== creatorUid);

    if (targets.length === 0) {
      logger.info('Nenhum destinatário (apenas o criador possui token)', { coupleId });
      return;
    }

    const title = `🍔 ${creatorName} registrou um lanchinho`;
    const body = `R$ ${formatBRL(value)} · ${location}`;

    const response = await getMessaging().sendEachForMulticast({
      tokens: targets.map((t) => t.token),
      data: {
        title,
        body,
        url: '/expenses',
        expenseId,
      },
      webpush: {
        fcmOptions: { link: '/expenses' },
      },
    });

    // Remove tokens that are no longer valid so we don't keep retrying them.
    const cleanup: Promise<unknown>[] = [];
    response.responses.forEach((res, i) => {
      if (res.success) return;
      const code = res.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument'
      ) {
        cleanup.push(targets[i].ref.delete());
      } else {
        logger.warn('Falha ao enviar push', { code, token: targets[i].token });
      }
    });
    await Promise.all(cleanup);

    logger.info('Push processado', {
      coupleId,
      sent: response.successCount,
      failed: response.failureCount,
      cleaned: cleanup.length,
    });
  },
);
