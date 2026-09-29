// =============================================
// EVI - Household Invite Service
// Generates and redeems short-lived join codes via Cloud Functions
// =============================================

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';
import { Analytics } from './analyticsService';

const functions = getFunctions(app, 'us-central1');

export interface CreateInviteResult {
  code: string;
  expiresAt: number;
}

export interface JoinHouseholdResult {
  householdId: string;
  householdName?: string;
  alreadyMember: boolean;
}

/**
 * Generate a new 6-character invite code for the given household.
 * Any previous unused code for that household is invalidated.
 */
export async function createHouseholdInvite(householdId: string): Promise<CreateInviteResult> {
  const fn = httpsCallable(functions, 'createHouseholdInvite');
  const result = await fn({ householdId });
  Analytics.inviteCreated();
  return result.data as CreateInviteResult;
}

/**
 * Redeem an invite code, joining the caller to the household it belongs to.
 */
export async function joinHouseholdByCode(code: string): Promise<JoinHouseholdResult> {
  const fn = httpsCallable(functions, 'joinHouseholdByCode');
  const result = await fn({ code: code.trim().toUpperCase() });
  Analytics.inviteRedeemed();
  Analytics.householdJoined();
  return result.data as JoinHouseholdResult;
}

/** Build the shareable deep link for an invite code. */
export function buildInviteLink(code: string): string {
  return `evi://join/${code}`;
}
