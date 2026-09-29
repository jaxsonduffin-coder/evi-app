// =============================================
// EVI - Account Service
// Account deletion, data export, support
// =============================================

import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, deleteUser as firebaseDeleteUser } from 'firebase/auth';
import { app } from './firebase';
import { Analytics } from './analyticsService';

const functions = getFunctions(app, 'us-central1');

/**
 * Request a downloadable export of everything EVI has stored about the
 * signed-in user (profile, household data, documents metadata, tasks,
 * vehicles, important dates, referrals). Returns a signed URL valid for
 * 24 hours.
 */
export async function exportUserData(): Promise<{ downloadUrl: string; fileName: string }> {
  const exportFn = httpsCallable(functions, 'exportUserData');
  const result = await exportFn();
  return result.data as { downloadUrl: string; fileName: string };
}

/**
 * Permanently delete the user's account and all their data.
 * Apple mandates this be accessible from within the app.
 */
export async function deleteAccount(): Promise<void> {
  const auth = getAuth(app);
  if (!auth.currentUser) throw new Error('Not signed in');

  const deleteAccountFn = httpsCallable(functions, 'deleteAccount');
  await deleteAccountFn();
  Analytics.accountDeleted();
  // The Cloud Function also deletes the auth record, but sign out just in case
  try {
    await auth.signOut();
  } catch {}
}
