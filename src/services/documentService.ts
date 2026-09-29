// =============================================
// EVI - Document Service
// Handles upload, retrieval, and management of household documents
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
  limit as fsLimit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './firebase';
import { HouseholdDocument, DocumentCategory, DocumentSubcategory } from '../types';

const DOCUMENTS_COLLECTION = 'documents';

// ---- Upload ----

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percent: number;
}

export async function uploadDocument(
  householdId: string,
  userId: string,
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  },
  metadata: {
    title: string;
    category: DocumentCategory;
    subcategory?: DocumentSubcategory;
    tags?: string[];
    notes?: string;
  },
  onProgress?: (progress: UploadProgress) => void
): Promise<HouseholdDocument> {
  // 1. Upload file to Firebase Storage
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `households/${householdId}/documents/${timestamp}_${cleanName}`;
  const fileRef = storageRef(storage, path);

  // Fetch the file as blob (React Native uri → blob)
  const response = await fetch(file.uri);
  const blob = await response.blob();

  const uploadTask = uploadBytesResumable(fileRef, blob, {
    contentType: file.type,
    customMetadata: {
      householdId,
      uploadedBy: userId,
      originalName: file.name,
    },
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress({
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percent: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          });
        }
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  const fileURL = await getDownloadURL(uploadTask.snapshot.ref);

  // 2. Create Firestore document
  const docData = {
    householdId,
    uploadedBy: userId,
    title: metadata.title,
    category: metadata.category,
    subcategory: metadata.subcategory || null,
    fileURL,
    mimeType: file.type,
    fileSize: file.size,
    tags: metadata.tags || [],
    notes: metadata.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), docData);

  return {
    id: docRef.id,
    ...docData,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as HouseholdDocument;
}

// ---- Retrieval ----

export async function getDocument(documentId: string): Promise<HouseholdDocument | null> {
  const snap = await getDoc(doc(db, DOCUMENTS_COLLECTION, documentId));
  if (!snap.exists()) return null;
  return normalizeDocument({ id: snap.id, ...snap.data() });
}

export async function getHouseholdDocuments(
  householdId: string,
  category?: DocumentCategory,
  limitCount: number = 100
): Promise<HouseholdDocument[]> {
  const constraints: any[] = [
    where('householdId', '==', householdId),
    orderBy('createdAt', 'desc'),
    fsLimit(limitCount),
  ];
  if (category) {
    constraints.splice(1, 0, where('category', '==', category));
  }
  const q = query(collection(db, DOCUMENTS_COLLECTION), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeDocument({ id: d.id, ...d.data() }));
}

export async function searchDocuments(
  householdId: string,
  searchText: string
): Promise<HouseholdDocument[]> {
  // Firestore doesn't support full-text search; get all and filter client-side
  const all = await getHouseholdDocuments(householdId);
  const needle = searchText.toLowerCase();
  return all.filter(
    (d) =>
      d.title.toLowerCase().includes(needle) ||
      d.notes?.toLowerCase().includes(needle) ||
      d.tags.some((t) => t.toLowerCase().includes(needle)) ||
      d.summary?.toLowerCase().includes(needle)
  );
}

// ---- Update ----

export async function updateDocument(
  documentId: string,
  updates: Partial<Omit<HouseholdDocument, 'id' | 'householdId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, DOCUMENTS_COLLECTION, documentId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// ---- Delete ----

export async function deleteDocument(documentId: string): Promise<void> {
  const document = await getDocument(documentId);
  if (!document) return;

  // Delete from Storage
  try {
    const fileRef = storageRef(storage, document.fileURL);
    await deleteObject(fileRef);
  } catch (e) {
    // File may already be gone; continue with Firestore deletion
    console.warn('Storage delete failed:', e);
  }

  // Delete Firestore doc
  await deleteDoc(doc(db, DOCUMENTS_COLLECTION, documentId));
}

// ---- Stats ----

export async function getDocumentStats(householdId: string): Promise<{
  totalCount: number;
  totalSize: number;
  byCategory: Record<string, number>;
}> {
  const docs = await getHouseholdDocuments(householdId);
  const byCategory: Record<string, number> = {};
  let totalSize = 0;

  for (const d of docs) {
    byCategory[d.category] = (byCategory[d.category] || 0) + 1;
    totalSize += d.fileSize;
  }

  return {
    totalCount: docs.length,
    totalSize,
    byCategory,
  };
}

// ---- Helpers ----

function normalizeDocument(raw: any): HouseholdDocument {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Timestamp ? raw.createdAt.toDate() : new Date(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Timestamp ? raw.updatedAt.toDate() : new Date(raw.updatedAt),
    keyDates: raw.keyDates?.map((d: any) => ({
      ...d,
      date: d.date instanceof Timestamp ? d.date.toDate() : new Date(d.date),
    })),
  };
}
