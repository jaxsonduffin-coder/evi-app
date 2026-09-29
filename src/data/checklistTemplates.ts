// =============================================
// EVI - Checklist Templates
// Guided checklists (Move-In, Move-Out, Adulting 101)
// that get turned into real HouseholdTask records.
// =============================================

export interface ChecklistItemTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  // Days relative to the checklist's anchor date (move date, or "today" for
  // templates with no move date). Negative = before, positive = after.
  dayOffset: number;
  priority?: 'urgent' | 'high' | 'medium' | 'low';
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  subtitle: string;
  icon: string; // Ionicons name
  color: string;
  // Whether this template is anchored to a move-in/move-out date the user
  // picks, vs. just "today" (e.g. the Adulting checklist).
  usesMoveDate: boolean;
  items: ChecklistItemTemplate[];
}

export const CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'move_in',
    title: 'Move-In Checklist',
    subtitle: 'Everything to handle before and right after you move in',
    icon: 'log-in-outline',
    color: '#10B981',
    usesMoveDate: true,
    items: [
      { id: 'mi_photos', title: 'Photograph the condition of every room', description: 'Do this before you move furniture in — protects your security deposit later.', category: 'home', dayOffset: -3, priority: 'high' },
      { id: 'mi_insurance', title: 'Set up renters or homeowners insurance', category: 'insurance', dayOffset: -3, priority: 'high' },
      { id: 'mi_utilities', title: 'Set up electric, gas, water & internet', category: 'utility', dayOffset: -2, priority: 'high' },
      { id: 'mi_address_usps', title: 'Update your mailing address (USPS forwarding)', category: 'personal', dayOffset: 0, priority: 'medium' },
      { id: 'mi_license', title: 'Update address on driver\'s license / state ID', category: 'identification', dayOffset: 7, priority: 'medium' },
      { id: 'mi_vehicle', title: 'Update vehicle registration address', category: 'vehicle', dayOffset: 14, priority: 'medium' },
      { id: 'mi_lease_upload', title: 'Upload signed lease or closing documents to your Vault', category: 'contract', dayOffset: 0, priority: 'high' },
      { id: 'mi_landlord_contact', title: 'Save landlord / property manager contact info', category: 'personal', dayOffset: 0, priority: 'low' },
      { id: 'mi_rent_reminder', title: 'Set up a recurring rent or mortgage payment reminder', category: 'financial', dayOffset: 0, priority: 'medium' },
      { id: 'mi_safety', title: 'Test smoke detectors & locate the fire extinguisher', category: 'home', dayOffset: 1, priority: 'high' },
      { id: 'mi_shutoffs', title: 'Locate the water shutoff valve and breaker box', category: 'home', dayOffset: 1, priority: 'medium' },
      { id: 'mi_locks', title: 'Change or rekey the locks', category: 'home', dayOffset: 2, priority: 'medium' },
      { id: 'mi_trash', title: 'Find your trash & recycling pickup schedule', category: 'utility', dayOffset: 3, priority: 'low' },
    ],
  },
  {
    id: 'move_out',
    title: 'Move-Out Checklist',
    subtitle: 'Wrap things up cleanly and get your deposit back',
    icon: 'log-out-outline',
    color: '#F59E0B',
    usesMoveDate: true,
    items: [
      { id: 'mo_notice', title: 'Give written notice to your landlord', description: 'Check your lease for the required notice period.', category: 'contract', dayOffset: -30, priority: 'urgent' },
      { id: 'mo_walkthrough', title: 'Schedule your move-out walkthrough / inspection', category: 'home', dayOffset: -3, priority: 'high' },
      { id: 'mo_photos', title: 'Photograph every room before you leave', category: 'home', dayOffset: -1, priority: 'high' },
      { id: 'mo_utilities', title: 'Schedule utility cancellation / transfer for move-out day', category: 'utility', dayOffset: -3, priority: 'high' },
      { id: 'mo_usps', title: 'Submit a USPS forwarding address', category: 'personal', dayOffset: -2, priority: 'medium' },
      { id: 'mo_keys', title: 'Return keys, fobs & garage remotes', category: 'home', dayOffset: 0, priority: 'high' },
      { id: 'mo_deposit', title: 'Request your security deposit back in writing', category: 'financial', dayOffset: 1, priority: 'high' },
      { id: 'mo_insurance', title: 'Cancel or transfer renters insurance', category: 'insurance', dayOffset: 1, priority: 'medium' },
      { id: 'mo_bank', title: 'Update your address with your bank & employer', category: 'financial', dayOffset: 2, priority: 'medium' },
      { id: 'mo_dmv', title: 'Update your address with the DMV & voter registration', category: 'identification', dayOffset: 7, priority: 'low' },
      { id: 'mo_clean', title: 'Deep clean per your lease\'s move-out requirements', category: 'home', dayOffset: -1, priority: 'medium' },
    ],
  },
  {
    id: 'adulting',
    title: 'Adulting 101',
    subtitle: 'A gentle on-ramp to managing your own life admin',
    icon: 'school-outline',
    color: '#8B5CF6',
    usesMoveDate: false,
    items: [
      { id: 'ad_bank', title: 'Open a checking & savings account', category: 'financial', dayOffset: 0, priority: 'high' },
      { id: 'ad_budget', title: 'Build a simple starter budget', description: 'Rent, food, transportation, and a little for savings.', category: 'financial', dayOffset: 1, priority: 'high' },
      { id: 'ad_autopay', title: 'Set up autopay for recurring bills', category: 'financial', dayOffset: 3, priority: 'medium' },
      { id: 'ad_credit_card', title: 'Get a credit card & note your statement due date', description: 'EVI can remind you before it\'s due once you add the card to your Vault.', category: 'financial', dayOffset: 5, priority: 'medium' },
      { id: 'ad_insurance', title: 'Get a renters or health insurance quote', category: 'insurance', dayOffset: 5, priority: 'medium' },
      { id: 'ad_id_docs', title: 'Save your ID, Social Security card & passport in your Vault', description: 'So you can find them instantly and get renewal reminders.', category: 'identification', dayOffset: 2, priority: 'high' },
      { id: 'ad_vote', title: 'Register to vote at your current address', category: 'personal', dayOffset: 7, priority: 'low' },
      { id: 'ad_car', title: 'Track your car registration & insurance renewal dates', category: 'vehicle', dayOffset: 2, priority: 'medium' },
      { id: 'ad_emergency_fund', title: 'Set a starter emergency fund goal', description: 'Even $500 makes a difference.', category: 'financial', dayOffset: 10, priority: 'low' },
      { id: 'ad_doctor', title: 'Find & schedule a doctor and dentist near you', category: 'medical', dayOffset: 14, priority: 'low' },
      { id: 'ad_bills_checkin', title: 'Set a recurring monthly "check my bills" reminder', category: 'financial', dayOffset: 1, priority: 'medium' },
    ],
  },
];

export function getChecklistTemplate(id: string): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES.find((t) => t.id === id);
}
