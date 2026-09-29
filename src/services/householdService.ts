// =============================================
// EVI - Household Service
// =============================================

import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Household, HouseholdMember, HomeProfile, User } from '../types';
import { Analytics } from './analyticsService';

const HOUSEHOLDS = 'households';
const HOME_PROFILES = 'homeProfiles';
const USERS = 'users';

// ---- Create ----

export async function createHousehold(
  userId: string,
  displayName: string,
  householdName: string,
  type: 'rent' | 'own' | 'other'
): Promise<string> {
  const householdRef = doc(collection(db, HOUSEHOLDS));
  const householdId = householdRef.id;

  const member: HouseholdMember = {
    userId,
    displayName,
    role: 'owner',
    joinedAt: new Date(),
  };

  // Note: memberIds is a flat array for efficient security-rule lookups.
  // members carries the full member records.
  await setDoc(householdRef, {
    id: householdId,
    name: householdName,
    type,
    createdBy: userId,
    members: [member],
    memberIds: [userId],
    createdAt: serverTimestamp(),
  });

  // Update user's householdIds
  await updateDoc(doc(db, USERS, userId), {
    householdIds: arrayUnion(householdId),
    currentHouseholdId: householdId,
    onboardingComplete: true,
  });

  // Create empty home profile (top-level so security rules can enforce)
  const profileRef = doc(collection(db, HOME_PROFILES));
  await setDoc(profileRef, {
    id: profileRef.id,
    householdId,
    type: type === 'other' ? 'rent' : type,
    utilities: [],
    appliances: [],
  });

  Analytics.householdCreated(type);
  Analytics.onboardingCompleted();

  return householdId;
}

// ---- Read ----

export async function getHousehold(householdId: string): Promise<Household | null> {
  const snap = await getDoc(doc(db, HOUSEHOLDS, householdId));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    ...data,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    members: (data.members || []).map((m: any) => ({
      ...m,
      joinedAt: m.joinedAt instanceof Timestamp ? m.joinedAt.toDate() : new Date(m.joinedAt),
    })),
  } as Household;
}

export async function getHomeProfile(householdId: string): Promise<HomeProfile | null> {
  const q = query(collection(db, HOME_PROFILES), where('householdId', '==', householdId));
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const d = snap.docs[0];
  const raw = { id: d.id, ...d.data() } as any;

  return {
    ...raw,
    purchaseDate: dateOrUndef(raw.purchaseDate),
    leaseStartDate: dateOrUndef(raw.leaseStartDate),
    leaseEndDate: dateOrUndef(raw.leaseEndDate),
    utilities: raw.utilities || [],
    appliances: (raw.appliances || []).map((a: any) => ({
      ...a,
      purchaseDate: dateOrUndef(a.purchaseDate),
      warrantyExpiry: dateOrUndef(a.warrantyExpiry),
    })),
  } as HomeProfile;
}

export async function getUserHouseholds(userId: string): Promise<Household[]> {
  const userDoc = await getDoc(doc(db, USERS, userId));
  if (!userDoc.exists()) return [];

  const userData = userDoc.data() as User;
  const households: Household[] = [];

  for (const hId of userData.householdIds || []) {
    const h = await getHousehold(hId);
    if (h) households.push(h);
  }
  return households;
}

// ---- Update ----

export async function updateHomeProfile(
  profileId: string,
  updates: Partial<HomeProfile>
): Promise<void> {
  const data: any = { ...updates };
  if (updates.purchaseDate) data.purchaseDate = Timestamp.fromDate(updates.purchaseDate);
  if (updates.leaseStartDate) data.leaseStartDate = Timestamp.fromDate(updates.leaseStartDate);
  if (updates.leaseEndDate) data.leaseEndDate = Timestamp.fromDate(updates.leaseEndDate);

  await updateDoc(doc(db, HOME_PROFILES, profileId), data);
}

export async function addMemberToHousehold(
  householdId: string,
  userId: string,
  displayName: string,
  role: 'admin' | 'member' = 'member'
): Promise<void> {
  const member: HouseholdMember = {
    userId,
    displayName,
    role,
    joinedAt: new Date(),
  };

  await updateDoc(doc(db, HOUSEHOLDS, householdId), {
    members: arrayUnion(member),
    memberIds: arrayUnion(userId),
  });

  await updateDoc(doc(db, USERS, userId), {
    householdIds: arrayUnion(householdId),
    currentHouseholdId: householdId,
  });
}

/**
 * Remove a member from a household (owner/admin removing someone, or a
 * member removing themselves to leave).
 *
 * We read the raw doc and rewrite the members/memberIds arrays rather than
 * using arrayRemove(member) — the members array stores joinedAt as a
 * Firestore Timestamp, but getHousehold() converts it to a JS Date for
 * callers, so a member object read via the app's normal helpers would
 * never deep-equal the stored entry and arrayRemove would silently no-op.
 */
export async function removeMemberFromHousehold(
  householdId: string,
  userId: string
): Promise<void> {
  const snap = await getDoc(doc(db, HOUSEHOLDS, householdId));
  if (!snap.exists()) return;
  const data = snap.data() as any;

  const remainingMembers = (data.members || []).filter((m: any) => m.userId !== userId);
  const remainingIds = (data.memberIds || []).filter((id: string) => id !== userId);

  await updateDoc(doc(db, HOUSEHOLDS, householdId), {
    members: remainingMembers,
    memberIds: remainingIds,
  });

  const userSnap = await getDoc(doc(db, USERS, userId));
  const userUpdates: any = { householdIds: arrayRemove(householdId) };
  if (userSnap.exists() && (userSnap.data() as any).currentHouseholdId === householdId) {
    const remainingUserHouseholds = ((userSnap.data() as any).householdIds || []).filter(
      (id: string) => id !== householdId
    );
    userUpdates.currentHouseholdId = remainingUserHouseholds[0] || null;
    if (remainingUserHouseholds.length === 0) userUpdates.onboardingComplete = false;
  }
  await updateDoc(doc(db, USERS, userId), userUpdates);
}

// ---- Helpers ----

function dateOrUndef(v: any): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Timestamp) return v.toDate();
  return new Date(v);
}
