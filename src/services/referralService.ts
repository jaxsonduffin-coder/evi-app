// =============================================
// EVI - Referral Service
// Invite friends, get free month each
// =============================================

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Analytics } from './analyticsService';

const REFERRALS_COLLECTION = 'referrals';

export interface ReferralStats {
  code: string;
  totalInvited: number;
  totalConverted: number; // signed up + still active
  freeMonthsEarned: number;
  freeMonthsUsed: number;
  freeMonthsRemaining: number;
}

/**
 * Get or create a user's unique referral code.
 * Codes are 6-character alphanumeric (e.g. "EVI3K9").
 */
export async function getOrCreateReferralCode(userId: string, displayName: string): Promise<string> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    if (data.referralCode) return data.referralCode;
  }

  // Generate a unique code
  const code = generateCode(displayName);
  await updateDoc(userRef, { referralCode: code });
  return code;
}

/**
 * Record a signup from a referral code.
 * Called when a new user signs up with someone else's code.
 */
export async function recordReferralSignup(
  referrerCode: string,
  newUserId: string,
  newUserEmail: string
): Promise<boolean> {
  // Find the referrer by their code
  const usersQ = query(collection(db, 'users'), where('referralCode', '==', referrerCode));
  const usersSnap = await getDocs(usersQ);
  if (usersSnap.empty) return false;

  const referrerDoc = usersSnap.docs[0];
  const referrerId = referrerDoc.id;

  // Prevent self-referral
  if (referrerId === newUserId) return false;

  // Record the referral
  await setDoc(doc(db, REFERRALS_COLLECTION, `${referrerId}_${newUserId}`), {
    referrerId,
    referredUserId: newUserId,
    referredUserEmail: newUserEmail,
    referrerCode,
    createdAt: serverTimestamp(),
    status: 'pending', // becomes 'converted' when they subscribe
  });

  // Grant the referrer a free month (in credit form)
  await updateDoc(doc(db, 'users', referrerId), {
    freeMonthsEarned: increment(1),
  });

  // Grant the new user a free month too
  await updateDoc(doc(db, 'users', newUserId), {
    freeMonthsEarned: increment(1),
    referredBy: referrerId,
  });

  Analytics.referralRedeemed();

  return true;
}

/**
 * Get stats for a user's referral activity.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const userData: any = userSnap.exists() ? userSnap.data() : {};

  const code = userData.referralCode || '';
  const freeMonthsEarned = userData.freeMonthsEarned || 0;
  const freeMonthsUsed = userData.freeMonthsUsed || 0;

  // Count referrals
  const referralsQ = query(collection(db, REFERRALS_COLLECTION), where('referrerId', '==', userId));
  const referralsSnap = await getDocs(referralsQ);
  const totalInvited = referralsSnap.size;
  const totalConverted = referralsSnap.docs.filter(
    (d) => d.data().status === 'converted'
  ).length;

  return {
    code,
    totalInvited,
    totalConverted,
    freeMonthsEarned,
    freeMonthsUsed,
    freeMonthsRemaining: freeMonthsEarned - freeMonthsUsed,
  };
}

/**
 * Mark a referral as converted (called when the referred user subscribes).
 */
export async function markReferralConverted(referredUserId: string): Promise<void> {
  const q = query(
    collection(db, REFERRALS_COLLECTION),
    where('referredUserId', '==', referredUserId)
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await updateDoc(doc(db, REFERRALS_COLLECTION, d.id), {
      status: 'converted',
      convertedAt: serverTimestamp(),
    });
  }
}

/**
 * Build a shareable referral link. Uses the app's custom URL scheme
 * (evi://refer/CODE) so tapping it on a device with EVI installed opens
 * straight to signup with the code pre-filled — same pattern as household
 * invite links. Once the app has a real website, this can be upgraded to
 * a universal/app link (https://evi.app/refer/CODE) that also falls back
 * to a store listing for people who don't have the app yet.
 */
export function buildReferralLink(code: string): string {
  return `evi://refer/${code}`;
}

export function buildReferralMessage(code: string, displayName: string): string {
  return `Hey! I've been using EVI to manage everything for our house — bills, warranties, lease, all of it. Use my code ${code} when you sign up and we both get a free month.\n\n${buildReferralLink(code)}`;
}

// ---- Helpers ----

function generateCode(displayName: string): string {
  // Take first 3 letters of name + 3 random chars
  const namePart = displayName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${namePart}${randomPart}`;
}
