// =============================================
// EVI - Calendar Event Service
// =============================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
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
import { CalendarEvent } from '../types';

const EVENTS_COLLECTION = 'events';

export async function createEvent(
  householdId: string,
  userId: string,
  event: Omit<CalendarEvent, 'id' | 'householdId' | 'createdAt'>
): Promise<CalendarEvent> {
  const data: any = {
    householdId,
    title: event.title,
    description: event.description || '',
    startDate: Timestamp.fromDate(event.startDate),
    endDate: event.endDate ? Timestamp.fromDate(event.endDate) : null,
    allDay: event.allDay,
    category: event.category,
    assignedTo: event.assignedTo || null,
    relatedTaskId: event.relatedTaskId || null,
    relatedDocumentId: event.relatedDocumentId || null,
    isRecurring: event.isRecurring,
    recurringRule: event.recurringRule || null,
    color: event.color || null,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), data);
  return { id: docRef.id, ...data, createdAt: new Date() } as CalendarEvent;
}

export async function getEventsForMonth(
  householdId: string,
  year: number,
  month: number // 0-11
): Promise<CalendarEvent[]> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('householdId', '==', householdId),
    where('startDate', '>=', Timestamp.fromDate(start)),
    where('startDate', '<', Timestamp.fromDate(end)),
    orderBy('startDate', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
}

export async function getUpcomingEvents(
  householdId: string,
  daysAhead: number = 30
): Promise<CalendarEvent[]> {
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('householdId', '==', householdId),
    where('startDate', '>=', Timestamp.fromDate(now)),
    where('startDate', '<=', Timestamp.fromDate(end)),
    orderBy('startDate', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
}

export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<CalendarEvent, 'id' | 'householdId' | 'createdAt'>>
): Promise<void> {
  const data: any = { ...updates };
  if (updates.startDate) data.startDate = Timestamp.fromDate(updates.startDate);
  if (updates.endDate) data.endDate = Timestamp.fromDate(updates.endDate);

  await updateDoc(doc(db, EVENTS_COLLECTION, eventId), data);
}

export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}

// ---- Helpers ----

function normalize(raw: any): CalendarEvent {
  return {
    ...raw,
    startDate: raw.startDate instanceof Timestamp ? raw.startDate.toDate() : new Date(raw.startDate),
    endDate: raw.endDate instanceof Timestamp ? raw.endDate.toDate() : raw.endDate ? new Date(raw.endDate) : undefined,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(raw.createdAt),
  };
}
