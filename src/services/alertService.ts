// =============================================
// EVI - Alert Service & Proactive Engine
// Generates and manages household alerts
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
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  HouseholdAlert,
  AlertSeverity,
  HomeProfile,
  Vehicle,
  HouseholdTask,
  HouseholdDocument,
  Appliance,
} from '../types';

const ALERTS_COLLECTION = 'alerts';

// ---- CRUD ----

export async function createAlert(
  householdId: string,
  alert: {
    title: string;
    description: string;
    severity: AlertSeverity;
    category: string;
    actionLabel?: string;
    actionRoute?: string;
    relatedDocumentId?: string;
    relatedTaskId?: string;
    dueDate?: Date;
  }
): Promise<HouseholdAlert> {
  const data: any = {
    householdId,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    category: alert.category,
    actionLabel: alert.actionLabel || null,
    actionRoute: alert.actionRoute || null,
    relatedDocumentId: alert.relatedDocumentId || null,
    relatedTaskId: alert.relatedTaskId || null,
    dueDate: alert.dueDate ? Timestamp.fromDate(alert.dueDate) : null,
    isDismissed: false,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, ALERTS_COLLECTION), data);
  return { id: docRef.id, ...data, createdAt: new Date() } as HouseholdAlert;
}

export async function getActiveAlerts(householdId: string): Promise<HouseholdAlert[]> {
  const q = query(
    collection(db, ALERTS_COLLECTION),
    where('householdId', '==', householdId),
    where('isDismissed', '==', false),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
}

export async function dismissAlert(alertId: string): Promise<void> {
  await updateDoc(doc(db, ALERTS_COLLECTION, alertId), { isDismissed: true });
}

export async function deleteAlert(alertId: string): Promise<void> {
  await deleteDoc(doc(db, ALERTS_COLLECTION, alertId));
}

// ---- Proactive Alert Generation ----
// Analyzes household data and generates timely alerts.
// Should run daily via Cloud Function or client-side on app open.

export interface HouseholdSnapshot {
  homeProfile: HomeProfile | null;
  vehicles: Vehicle[];
  tasks: HouseholdTask[];
  documents: HouseholdDocument[];
  existingAlerts: HouseholdAlert[];
}

export async function generateProactiveAlerts(
  householdId: string,
  snapshot: HouseholdSnapshot
): Promise<HouseholdAlert[]> {
  const now = new Date();
  const alertsToCreate: Parameters<typeof createAlert>[1][] = [];

  // Skip creating alerts that already exist (dedupe by title + category)
  const existingKeys = new Set(
    snapshot.existingAlerts.map((a) => `${a.category}::${a.title}`)
  );
  const shouldCreate = (title: string, category: string) =>
    !existingKeys.has(`${category}::${title}`);

  // ---- Lease expiry (renter) ----
  if (snapshot.homeProfile?.type === 'rent' && snapshot.homeProfile.leaseEndDate) {
    const daysUntilExpiry = daysBetween(now, snapshot.homeProfile.leaseEndDate);
    if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) {
      const title = `Lease expires in ${daysUntilExpiry} days`;
      const severity: AlertSeverity = daysUntilExpiry <= 30 ? 'urgent' : daysUntilExpiry <= 60 ? 'warning' : 'info';
      if (shouldCreate(title, 'lease')) {
        alertsToCreate.push({
          title,
          description: `Your lease at ${snapshot.homeProfile.address?.street || 'your home'} ends on ${snapshot.homeProfile.leaseEndDate.toLocaleDateString()}. Review renewal options.`,
          severity,
          category: 'lease',
          actionLabel: 'View Lease',
          dueDate: snapshot.homeProfile.leaseEndDate,
        });
      }
    }
  }

  // ---- Vehicle registration/insurance expiry ----
  for (const vehicle of snapshot.vehicles) {
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    if (vehicle.registrationExpiry) {
      const days = daysBetween(now, vehicle.registrationExpiry);
      if (days > 0 && days <= 45) {
        const title = `${vehicleName} registration expires in ${days} days`;
        if (shouldCreate(title, 'vehicle_registration')) {
          alertsToCreate.push({
            title,
            description: `Renew registration for your ${vehicleName} before ${vehicle.registrationExpiry.toLocaleDateString()}.`,
            severity: days <= 14 ? 'urgent' : 'warning',
            category: 'vehicle_registration',
            actionLabel: 'View Vehicle',
            dueDate: vehicle.registrationExpiry,
          });
        }
      }
    }

    if (vehicle.insuranceExpiry) {
      const days = daysBetween(now, vehicle.insuranceExpiry);
      if (days > 0 && days <= 45) {
        const title = `${vehicleName} insurance expires in ${days} days`;
        if (shouldCreate(title, 'vehicle_insurance')) {
          alertsToCreate.push({
            title,
            description: `Renew auto insurance policy for your ${vehicleName}.`,
            severity: days <= 14 ? 'urgent' : 'warning',
            category: 'vehicle_insurance',
            actionLabel: 'View Vehicle',
            dueDate: vehicle.insuranceExpiry,
          });
        }
      }
    }
  }

  // ---- Appliance warranties ----
  for (const appliance of snapshot.homeProfile?.appliances || []) {
    if (appliance.warrantyExpiry) {
      const days = daysBetween(now, appliance.warrantyExpiry);
      if (days > 0 && days <= 60) {
        const title = `${appliance.name} warranty expires in ${days} days`;
        if (shouldCreate(title, 'warranty')) {
          alertsToCreate.push({
            title,
            description: `Your ${appliance.brand || ''} ${appliance.name} warranty ends on ${appliance.warrantyExpiry.toLocaleDateString()}. Consider extended coverage.`,
            severity: days <= 14 ? 'warning' : 'info',
            category: 'warranty',
            dueDate: appliance.warrantyExpiry,
          });
        }
      }
    }
  }

  // ---- HVAC/System maintenance overdue ----
  if (snapshot.homeProfile?.hvacInfo?.lastServiceDate) {
    const monthsSinceService = monthsBetween(snapshot.homeProfile.hvacInfo.lastServiceDate, now);
    if (monthsSinceService >= 12) {
      const title = 'HVAC service overdue';
      if (shouldCreate(title, 'maintenance')) {
        alertsToCreate.push({
          title,
          description: `Your HVAC hasn't been serviced in ${monthsSinceService} months. Schedule a tune-up to prevent failures.`,
          severity: 'warning',
          category: 'maintenance',
        });
      }
    }
  }

  // ---- Overdue tasks ----
  const overdueTasks = snapshot.tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && t.dueDate < now
  );
  if (overdueTasks.length > 0) {
    const title = `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`;
    if (shouldCreate(title, 'tasks')) {
      alertsToCreate.push({
        title,
        description: `You have ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} past their due date. Review and update your list.`,
        severity: overdueTasks.length > 3 ? 'urgent' : 'warning',
        category: 'tasks',
        actionLabel: 'View Tasks',
      });
    }
  }

  // ---- Seasonal reminders ----
  const month = now.getMonth();
  if (month === 8 || month === 9) {
    // Sept-Oct: winter prep
    const title = 'Time to prep for winter';
    if (shouldCreate(title, 'seasonal')) {
      alertsToCreate.push({
        title,
        description: 'Service HVAC, change filters, check weatherstripping, and clean gutters before cold weather hits.',
        severity: 'info',
        category: 'seasonal',
        actionLabel: 'View Checklist',
      });
    }
  } else if (month === 2 || month === 3) {
    // March-April: spring cleaning
    const title = 'Spring maintenance checklist';
    if (shouldCreate(title, 'seasonal')) {
      alertsToCreate.push({
        title,
        description: 'Check A/C, inspect roof for winter damage, service lawn equipment, and test smoke detectors.',
        severity: 'info',
        category: 'seasonal',
        actionLabel: 'View Checklist',
      });
    }
  }

  // ---- Encouragement (good severity) ----
  if (
    snapshot.documents.length > 0 &&
    snapshot.tasks.filter((t) => t.status === 'completed').length >= 5 &&
    alertsToCreate.length === 0
  ) {
    const title = 'Your household is on track';
    if (shouldCreate(title, 'good')) {
      alertsToCreate.push({
        title,
        description: 'Nothing urgent right now. Great job keeping things organized!',
        severity: 'good',
        category: 'good',
      });
    }
  }

  // ---- Persist new alerts ----
  const created: HouseholdAlert[] = [];
  for (const a of alertsToCreate) {
    const alert = await createAlert(householdId, a);
    created.push(alert);
  }
  return created;
}

// ---- Helpers ----

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function normalize(raw: any): HouseholdAlert {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(raw.createdAt),
    dueDate: raw.dueDate instanceof Timestamp ? raw.dueDate.toDate() : raw.dueDate ? new Date(raw.dueDate) : undefined,
  };
}
