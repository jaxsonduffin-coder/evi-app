// =============================================
// EVI - Task Service
// Household task management
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
import { HouseholdTask, TaskPriority, TaskStatus } from '../types';
import { Analytics } from './analyticsService';

const TASKS_COLLECTION = 'tasks';

// ---- Create ----

export async function createTask(
  householdId: string,
  userId: string,
  task: {
    title: string;
    description?: string;
    category?: string;
    priority?: TaskPriority;
    assignedTo?: string;
    dueDate?: Date;
    isRecurring?: boolean;
    recurringInterval?: HouseholdTask['recurringInterval'];
    relatedDocumentId?: string;
  }
): Promise<HouseholdTask> {
  const taskData: any = {
    householdId,
    title: task.title,
    description: task.description || '',
    category: task.category || 'general',
    priority: task.priority || 'medium',
    status: 'pending' as TaskStatus,
    assignedTo: task.assignedTo || null,
    dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : null,
    completedAt: null,
    isRecurring: task.isRecurring || false,
    recurringInterval: task.recurringInterval || null,
    relatedDocumentId: task.relatedDocumentId || null,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskData);

  Analytics.taskCreated(taskData.category);

  return {
    id: docRef.id,
    ...taskData,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: task.dueDate,
  } as HouseholdTask;
}

// ---- Retrieval ----

export async function getTask(taskId: string): Promise<HouseholdTask | null> {
  const snap = await getDoc(doc(db, TASKS_COLLECTION, taskId));
  if (!snap.exists()) return null;
  return normalizeTask({ id: snap.id, ...snap.data() });
}

export async function getHouseholdTasks(
  householdId: string,
  filters?: {
    status?: TaskStatus | TaskStatus[];
    assignedTo?: string;
    priority?: TaskPriority;
  }
): Promise<HouseholdTask[]> {
  const constraints: any[] = [where('householdId', '==', householdId)];

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    if (statuses.length === 1) {
      constraints.push(where('status', '==', statuses[0]));
    } else if (statuses.length > 1) {
      constraints.push(where('status', 'in', statuses));
    }
  }
  if (filters?.assignedTo) {
    constraints.push(where('assignedTo', '==', filters.assignedTo));
  }
  if (filters?.priority) {
    constraints.push(where('priority', '==', filters.priority));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, TASKS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeTask({ id: d.id, ...d.data() }));
}

export async function getUpcomingTasks(
  householdId: string,
  daysAhead: number = 7
): Promise<HouseholdTask[]> {
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const q = query(
    collection(db, TASKS_COLLECTION),
    where('householdId', '==', householdId),
    where('status', 'in', ['pending', 'in_progress']),
    where('dueDate', '<=', Timestamp.fromDate(future)),
    orderBy('dueDate', 'asc')
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeTask({ id: d.id, ...d.data() }));
}

// ---- Update ----

export async function updateTask(
  taskId: string,
  updates: Partial<Omit<HouseholdTask, 'id' | 'householdId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const cleanUpdates: any = { ...updates, updatedAt: serverTimestamp() };
  if (updates.dueDate) cleanUpdates.dueDate = Timestamp.fromDate(updates.dueDate);
  if (updates.completedAt) cleanUpdates.completedAt = Timestamp.fromDate(updates.completedAt);

  await updateDoc(doc(db, TASKS_COLLECTION, taskId), cleanUpdates);
}

export async function completeTask(taskId: string): Promise<void> {
  const task = await getTask(taskId);
  if (!task) return;

  await updateTask(taskId, {
    status: 'completed',
    completedAt: new Date(),
  });

  Analytics.taskCompleted(task.category || 'general');

  // If recurring, create the next instance
  if (task.isRecurring && task.recurringInterval && task.dueDate) {
    const nextDue = getNextRecurringDate(task.dueDate, task.recurringInterval);
    await createTask(task.householdId, task.createdBy, {
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: nextDue,
      isRecurring: true,
      recurringInterval: task.recurringInterval,
    });
  }
}

// ---- Delete ----

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
}

// ---- Helpers ----

function normalizeTask(raw: any): HouseholdTask {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt.toDate() : new Date(raw.updatedAt),
    dueDate: raw.dueDate instanceof Timestamp ? raw.dueDate.toDate() : raw.dueDate ? new Date(raw.dueDate) : undefined,
    completedAt: raw.completedAt instanceof Timestamp ? raw.completedAt.toDate() : raw.completedAt ? new Date(raw.completedAt) : undefined,
  };
}

function getNextRecurringDate(from: Date, interval: HouseholdTask['recurringInterval']): Date {
  const next = new Date(from);
  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'annually':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
