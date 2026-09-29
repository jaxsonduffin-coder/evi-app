// =============================================
// EVI - Important Dates Service
// Birthdays, anniversaries, and other recurring annual dates
// =============================================

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ImportantDate, ImportantDateType } from '../types';
import { Analytics } from './analyticsService';

const COLLECTION = 'importantDates';

export interface UpcomingImportantDate extends ImportantDate {
  nextOccurrence: Date;
  daysUntil: number;
  turningAge?: number;
}

// ---- Create ----

export async function createImportantDate(
  householdId: string,
  userId: string,
  data: {
    personName: string;
    type: ImportantDateType;
    label?: string;
    month: number;
    day: number;
    year?: number;
    notes?: string;
    remindDaysBefore?: number;
  }
): Promise<ImportantDate> {
  const docData = {
    householdId,
    personName: data.personName,
    type: data.type,
    label: data.label || null,
    month: data.month,
    day: data.day,
    year: data.year || null,
    notes: data.notes || '',
    remindDaysBefore: data.remindDaysBefore ?? 3,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), docData);

  Analytics.importantDateAdded(data.type);

  return { id: docRef.id, ...docData, createdAt: new Date() } as ImportantDate;
}

// ---- Read ----

export async function getHouseholdImportantDates(householdId: string): Promise<ImportantDate[]> {
  const q = query(
    collection(db, COLLECTION),
    where('householdId', '==', householdId),
    orderBy('month', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
}

/**
 * Return all important dates for a household with their next upcoming
 * occurrence computed, sorted soonest first. Handles year wraparound
 * (e.g. a date in January is "next" even in December).
 */
export async function getUpcomingImportantDates(
  householdId: string,
  withinDays?: number
): Promise<UpcomingImportantDate[]> {
  const dates = await getHouseholdImportantDates(householdId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const withOccurrence: UpcomingImportantDate[] = dates.map((d) => {
    let next = new Date(today.getFullYear(), d.month - 1, d.day);
    if (next < today) {
      next = new Date(today.getFullYear() + 1, d.month - 1, d.day);
    }
    const daysUntil = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const turningAge = d.year ? next.getFullYear() - d.year : undefined;
    return { ...d, nextOccurrence: next, daysUntil, turningAge };
  });

  withOccurrence.sort((a, b) => a.daysUntil - b.daysUntil);

  if (withinDays != null) {
    return withOccurrence.filter((d) => d.daysUntil <= withinDays);
  }
  return withOccurrence;
}

/**
 * Return important dates that fall within a specific calendar month/year
 * (dates recur every year, so this just re-anchors month/day onto that year).
 * Used by the Calendar screen, which navigates month by month rather than
 * "what's coming up next" like the dashboard widget.
 */
export async function getImportantDatesForMonth(
  householdId: string,
  year: number,
  month: number // 0-indexed, matching JS Date, to match getEventsForMonth's convention
): Promise<(ImportantDate & { occurrenceDate: Date; turningAge?: number })[]> {
  const dates = await getHouseholdImportantDates(householdId);
  const targetMonth = month + 1; // stored as 1-12
  return dates
    .filter((d) => d.month === targetMonth)
    .map((d) => ({
      ...d,
      occurrenceDate: new Date(year, d.month - 1, d.day),
      turningAge: d.year ? year - d.year : undefined,
    }));
}

// ---- Update ----

export async function updateImportantDate(
  dateId: string,
  updates: Partial<Omit<ImportantDate, 'id' | 'householdId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, dateId), { ...updates });
}

// ---- Delete ----

export async function deleteImportantDate(dateId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, dateId));
}

// ---- Helpers ----

function normalize(raw: any): ImportantDate {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(raw.createdAt),
  };
}
