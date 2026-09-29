// =============================================
// EVI - Document Intelligence Service
// OCR + AI-powered extraction of dates, amounts, and key info
// =============================================

import { ExtractedDate, ExtractedAmount, DocumentCategory, DocumentSubcategory } from '../types';
import { updateDocument } from './documentService';

// Uses a Firebase Cloud Function that wraps Google Vision + OpenAI GPT-4 Vision
const ANALYZE_ENDPOINT = 'https://us-central1-evi-house-manager.cloudfunctions.net/analyzeDocument';

export interface DocumentAnalysis {
  summary: string;
  suggestedTitle: string;
  suggestedCategory: DocumentCategory;
  suggestedSubcategory?: DocumentSubcategory;
  keyDates: ExtractedDate[];
  keyAmounts: ExtractedAmount[];
  extractedText: string;
  extractedData: Record<string, any>;
  confidence: number;
}

/**
 * Analyzes a document and extracts structured data.
 * Runs the Cloud Function that combines Google Vision OCR and GPT-4 analysis.
 */
export async function analyzeDocument(
  fileURL: string,
  mimeType: string,
  hint?: {
    category?: DocumentCategory;
    subcategory?: string;
  }
): Promise<DocumentAnalysis> {
  try {
    const response = await fetch(ANALYZE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileURL, mimeType, hint }),
    });

    if (!response.ok) {
      throw new Error(`Analysis error: ${response.status}`);
    }

    const data = await response.json();
    return normalizeAnalysis(data);
  } catch (err) {
    console.warn('Document analysis failed, using fallback:', err);
    return emptyAnalysis();
  }
}

/**
 * Runs analysis and updates the Firestore document with extracted data.
 */
export async function analyzeAndUpdateDocument(
  documentId: string,
  fileURL: string,
  mimeType: string,
  hint?: { category?: DocumentCategory }
): Promise<DocumentAnalysis> {
  const analysis = await analyzeDocument(fileURL, mimeType, hint);

  await updateDocument(documentId, {
    summary: analysis.summary,
    keyDates: analysis.keyDates,
    keyAmounts: analysis.keyAmounts,
    extractedData: analysis.extractedData,
    ...(analysis.suggestedCategory ? { category: analysis.suggestedCategory } : {}),
    ...(analysis.suggestedSubcategory ? { subcategory: analysis.suggestedSubcategory } : {}),
  });

  return analysis;
}

// ---- Helpers ----

function normalizeAnalysis(raw: any): DocumentAnalysis {
  return {
    summary: raw.summary || '',
    suggestedTitle: raw.suggestedTitle || '',
    suggestedCategory: raw.suggestedCategory || 'other',
    suggestedSubcategory: raw.suggestedSubcategory || undefined,
    keyDates: (raw.keyDates || []).map((d: any) => ({
      label: d.label,
      date: new Date(d.date),
      isDeadline: !!d.isDeadline,
      reminderCreated: !!d.reminderCreated,
    })),
    keyAmounts: (raw.keyAmounts || []).map((a: any) => ({
      label: a.label,
      amount: Number(a.amount),
      currency: a.currency || 'USD',
    })),
    extractedText: raw.extractedText || '',
    extractedData: raw.extractedData || {},
    confidence: raw.confidence ?? 0,
  };
}

function emptyAnalysis(): DocumentAnalysis {
  return {
    summary: '',
    suggestedTitle: '',
    suggestedCategory: 'other',
    keyDates: [],
    keyAmounts: [],
    extractedText: '',
    extractedData: {},
    confidence: 0,
  };
}
