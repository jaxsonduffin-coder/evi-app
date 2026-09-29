// =============================================
// EVI - Vehicle Service
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
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Vehicle, MaintenanceRecord } from '../types';

const VEHICLES_COLLECTION = 'vehicles';

export async function createVehicle(
  householdId: string,
  vehicle: Omit<Vehicle, 'id' | 'householdId' | 'maintenanceHistory'>
): Promise<Vehicle> {
  const data: any = {
    householdId,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim || null,
    color: vehicle.color || null,
    vin: vehicle.vin || null,
    licensePlate: vehicle.licensePlate || null,
    registrationExpiry: vehicle.registrationExpiry ? Timestamp.fromDate(vehicle.registrationExpiry) : null,
    insuranceProvider: vehicle.insuranceProvider || null,
    insurancePolicyNumber: vehicle.insurancePolicyNumber || null,
    insuranceExpiry: vehicle.insuranceExpiry ? Timestamp.fromDate(vehicle.insuranceExpiry) : null,
    mileage: vehicle.mileage || null,
    maintenanceHistory: [],
    photoURL: vehicle.photoURL || null,
    notes: vehicle.notes || null,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, VEHICLES_COLLECTION), data);
  return { id: docRef.id, ...data, maintenanceHistory: [] } as Vehicle;
}

export async function getHouseholdVehicles(householdId: string): Promise<Vehicle[]> {
  const q = query(
    collection(db, VEHICLES_COLLECTION),
    where('householdId', '==', householdId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalize({ id: d.id, ...d.data() }));
}

export async function getVehicle(vehicleId: string): Promise<Vehicle | null> {
  const snap = await getDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
  if (!snap.exists()) return null;
  return normalize({ id: snap.id, ...snap.data() });
}

export async function updateVehicle(
  vehicleId: string,
  updates: Partial<Omit<Vehicle, 'id' | 'householdId'>>
): Promise<void> {
  const data: any = { ...updates };
  if (updates.registrationExpiry) data.registrationExpiry = Timestamp.fromDate(updates.registrationExpiry);
  if (updates.insuranceExpiry) data.insuranceExpiry = Timestamp.fromDate(updates.insuranceExpiry);

  await updateDoc(doc(db, VEHICLES_COLLECTION, vehicleId), data);
}

export async function addMaintenanceRecord(
  vehicleId: string,
  record: Omit<MaintenanceRecord, 'id'>
): Promise<void> {
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return;

  const newRecord: MaintenanceRecord = {
    id: `mr_${Date.now()}`,
    ...record,
  };

  const updated = [...(vehicle.maintenanceHistory || []), newRecord];
  await updateDoc(doc(db, VEHICLES_COLLECTION, vehicleId), {
    maintenanceHistory: updated,
  });
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  await deleteDoc(doc(db, VEHICLES_COLLECTION, vehicleId));
}

function normalize(raw: any): Vehicle {
  return {
    ...raw,
    registrationExpiry: raw.registrationExpiry instanceof Timestamp ? raw.registrationExpiry.toDate() : raw.registrationExpiry ? new Date(raw.registrationExpiry) : undefined,
    insuranceExpiry: raw.insuranceExpiry instanceof Timestamp ? raw.insuranceExpiry.toDate() : raw.insuranceExpiry ? new Date(raw.insuranceExpiry) : undefined,
    maintenanceHistory: (raw.maintenanceHistory || []).map((m: any) => ({
      ...m,
      date: m.date instanceof Timestamp ? m.date.toDate() : new Date(m.date),
    })),
  };
}
