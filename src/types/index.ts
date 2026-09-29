// =============================================
// EVI - Core Type Definitions
// =============================================

// ---- User & Household ----

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  householdIds: string[];
  currentHouseholdId?: string;
  createdAt: Date;
  subscriptionTier: SubscriptionTierId;
  subscriptionInterval?: BillingInterval;
  onboardingComplete: boolean;
}

export interface Household {
  id: string;
  name: string;
  type: 'rent' | 'own' | 'other';
  createdBy: string;
  members: HouseholdMember[];
  createdAt: Date;
  address?: Address;
  photoURL?: string;
}

export interface HouseholdMember {
  userId: string;
  displayName: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  photoURL?: string;
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// ---- Home Brain (Property Profile) ----

export interface HomeProfile {
  id: string;
  householdId: string;
  type: 'rent' | 'own';
  address?: Address;

  // Homeowner fields
  purchaseDate?: Date;
  purchasePrice?: number;
  squareFootage?: number;
  yearBuilt?: number;
  lotSize?: string;

  // Renter fields
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  monthlyRent?: number;
  securityDeposit?: number;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  propertyManager?: string;

  // Systems (homeowner)
  hvacInfo?: SystemInfo;
  waterHeater?: SystemInfo;
  roofInfo?: SystemInfo;
  plumbingNotes?: string;
  electricalNotes?: string;

  // Shared
  utilities: Utility[];
  appliances: Appliance[];
  notes?: string;
}

export interface SystemInfo {
  brand?: string;
  model?: string;
  installDate?: Date;
  lastServiceDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
}

export interface Utility {
  id: string;
  type: 'electricity' | 'water' | 'gas' | 'internet' | 'phone' | 'trash' | 'sewer' | 'other';
  provider: string;
  accountNumber?: string;
  monthlyEstimate?: number;
  dueDate?: number; // day of month
  autopay: boolean;
  notes?: string;
}

export interface Appliance {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  location?: string;
  manualURL?: string;
  photoURL?: string;
  notes?: string;
}

// ---- Document Vault ----

export type DocumentCategory =
  | 'home' | 'vehicle' | 'utility' | 'personal' | 'insurance'
  | 'warranty' | 'receipt' | 'contract' | 'medical' | 'financial'
  | 'identification' | 'other';

export type DocumentSubcategory =
  | 'lease' | 'mortgage' | 'inspection' | 'insurance' | 'warranty'
  | 'repair' | 'contractor' | 'registration' | 'maintenance'
  | 'purchase' | 'employment' | 'school' | 'tax'
  // Identification & personal cards (expiration-tracked)
  | 'drivers_license' | 'passport' | 'state_id' | 'credit_card'
  | 'debit_card' | 'vehicle_registration' | 'social_security_card'
  | 'other';

export interface HouseholdDocument {
  id: string;
  householdId: string;
  uploadedBy: string;
  title: string;
  category: DocumentCategory;
  subcategory?: DocumentSubcategory;
  fileURL: string;
  thumbnailURL?: string;
  mimeType: string;
  fileSize: number;

  // AI-extracted data
  extractedData?: Record<string, any>;
  summary?: string;
  keyDates?: ExtractedDate[];
  keyAmounts?: ExtractedAmount[];

  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExtractedDate {
  label: string;
  date: Date;
  isDeadline: boolean;
  reminderCreated: boolean;
}

export interface ExtractedAmount {
  label: string;
  amount: number;
  currency: string;
}

// ---- Tasks & Reminders ----

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface HouseholdTask {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  category?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  dueDate?: Date;
  completedAt?: Date;
  isRecurring: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
  relatedDocumentId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Alerts (Proactive AI) ----

export type AlertSeverity = 'urgent' | 'warning' | 'info' | 'good';

export interface HouseholdAlert {
  id: string;
  householdId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: string;
  actionLabel?: string;
  actionRoute?: string;
  relatedDocumentId?: string;
  relatedTaskId?: string;
  dueDate?: Date;
  isDismissed: boolean;
  createdAt: Date;
}

// ---- Vehicles ----

export interface Vehicle {
  id: string;
  householdId: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  color?: string;
  vin?: string;
  licensePlate?: string;
  registrationExpiry?: Date;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: Date;
  mileage?: number;
  maintenanceHistory: MaintenanceRecord[];
  photoURL?: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: Date;
  type: string;
  description: string;
  mileage?: number;
  cost?: number;
  provider?: string;
  documentId?: string;
}

// ---- Calendar Events ----

export interface CalendarEvent {
  id: string;
  householdId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  allDay: boolean;
  category: 'maintenance' | 'appointment' | 'deadline' | 'bill' | 'renewal' | 'reminder' | 'other';
  assignedTo?: string;
  relatedTaskId?: string;
  relatedDocumentId?: string;
  isRecurring: boolean;
  recurringRule?: string;
  color?: string;
  createdAt: Date;
}

// ---- Important Dates (Birthdays, Anniversaries, etc.) ----

export type ImportantDateType = 'birthday' | 'anniversary' | 'other';

export interface ImportantDate {
  id: string;
  householdId: string;
  personName: string;
  type: ImportantDateType;
  label?: string; // used when type === 'other', e.g. "Wedding Anniversary"
  month: number; // 1-12
  day: number; // 1-31
  year?: number; // birth/original year, optional — lets EVI say "turning 30"
  notes?: string;
  remindDaysBefore: number; // default 3
  createdBy: string;
  createdAt: Date;
}

// ---- Subscription Tiers ----

export type SubscriptionTierId = 'free' | 'solo' | 'household' | 'pro';
export type BillingInterval = 'monthly' | 'annual';

export interface SubscriptionTier {
  id: SubscriptionTierId;
  name: string;
  price: number; // Monthly price for display comparisons
  annualPrice?: number; // Total for a year (usually monthly * 10 = 2 months free)
  description: string;
  maxMembers: number;
  maxProperties?: number; // For Pro tier
  maxDocuments: number;
  maxStorage: number; // GB
  features: string[];
  highlight?: string; // "MOST POPULAR", "BEST VALUE"
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'A quick look at EVI — upgrade for the full picture',
    maxMembers: 1,
    maxDocuments: 3,
    maxStorage: 0.1,
    features: [
      'Basic dashboard',
      'Up to 3 documents',
      'Task management',
      'Basic reminders',
    ],
  },
  {
    id: 'solo',
    name: 'Solo',
    price: 9.99,
    annualPrice: 99.99, // ~$8.33/mo effective, 2 months free
    description: 'Full AI-powered household management for you',
    maxMembers: 1,
    maxDocuments: 100,
    maxStorage: 5,
    features: [
      'Everything in Free',
      'AI document intelligence',
      'Unlimited tasks & reminders',
      'Ask EVI AI',
      'Proactive alerts',
      'Calendar integration',
      '100 documents · 5 GB',
    ],
  },
  {
    id: 'household',
    name: 'Household',
    price: 19.99,
    annualPrice: 199.99, // ~$16.66/mo effective, 2 months free
    description: 'Manage your entire household together',
    maxMembers: 10,
    maxDocuments: 500,
    maxStorage: 25,
    features: [
      'Everything in Solo',
      'Up to 10 household members',
      'Shared documents & vault',
      'Task assignment & delegation',
      'Family calendar',
      '500 documents · 25 GB',
    ],
    highlight: 'MOST POPULAR',
  },
  {
    id: 'pro',
    name: 'Property Pro',
    price: 39.99,
    annualPrice: 399.99, // ~$33.33/mo effective, 2 months free
    description: 'For landlords and multi-property owners',
    maxMembers: 10,
    maxProperties: 5,
    maxDocuments: 2500,
    maxStorage: 100,
    features: [
      'Everything in Household',
      'Track up to 5 properties',
      'Tenant management tools',
      'Rent collection reminders',
      'Property-level analytics',
      'Priority AI processing',
      '2500 documents · 100 GB',
      'Priority support',
    ],
    highlight: 'FOR LANDLORDS',
  },
];

// Helper: get monthly-equivalent price for annual plans (for display)
export function getEffectiveMonthly(tier: SubscriptionTier, interval: BillingInterval): number {
  if (interval === 'annual' && tier.annualPrice) return tier.annualPrice / 12;
  return tier.price;
}

// Helper: calculate annual savings %
export function getAnnualSavingsPercent(tier: SubscriptionTier): number {
  if (!tier.annualPrice || tier.price === 0) return 0;
  const yearlyIfMonthly = tier.price * 12;
  return Math.round(((yearlyIfMonthly - tier.annualPrice) / yearlyIfMonthly) * 100);
}

// ---- Chat / Ask My Household ----

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: ChatSource[];
}

export interface ChatSource {
  type: 'document' | 'task' | 'appliance' | 'vehicle' | 'calendar';
  id: string;
  title: string;
}
