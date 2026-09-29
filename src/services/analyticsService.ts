// =============================================
// EVI - Analytics Service
// Wraps Firebase Analytics so the rest of the app never touches
// the native module directly, and never crashes if analytics
// isn't available (e.g. running in Expo Go without a dev build).
// =============================================

import { Platform } from 'react-native';

let analyticsModule: any = null;
try {
  // Native module — only present in a dev/production build, not Expo Go.
  analyticsModule = require('@react-native-firebase/analytics').default;
} catch {
  analyticsModule = null;
}

function getAnalytics() {
  try {
    return analyticsModule ? analyticsModule() : null;
  } catch {
    return null;
  }
}

/** Log a custom analytics event. Safe to call anywhere — no-ops if unavailable. */
export function logEvent(name: string, params?: Record<string, any>): void {
  const instance = getAnalytics();
  if (!instance) return;
  instance.logEvent(name, params).catch(() => {});
}

/** Associate all future events with the signed-in user. */
export function setAnalyticsUser(userId: string | null): void {
  const instance = getAnalytics();
  if (!instance) return;
  instance.setUserId(userId).catch(() => {});
}

export function setUserProperty(name: string, value: string | null): void {
  const instance = getAnalytics();
  if (!instance) return;
  instance.setUserProperty(name, value).catch(() => {});
}

// ---- Funnel events (names match Firebase's recommended conventions where they exist) ----

export const Analytics = {
  signUp: (method: string) => logEvent('sign_up', { method }),
  login: (method: string) => logEvent('login', { method }),
  householdCreated: (type: string) => logEvent('household_created', { household_type: type }),
  householdJoined: () => logEvent('household_joined'),
  onboardingCompleted: () => logEvent('onboarding_completed'),
  documentUploaded: (category: string, source: 'camera' | 'library' | 'scanner') =>
    logEvent('document_uploaded', { category, source }),
  documentAnalyzed: (category: string) => logEvent('document_analyzed', { category }),
  taskCreated: (category: string) => logEvent('task_created', { category }),
  taskCompleted: (category: string) => logEvent('task_completed', { category }),
  askQuestion: () => logEvent('ask_evi_question'),
  paywallViewed: (trigger: string) => logEvent('paywall_viewed', { trigger }),
  trialStarted: (tier: string, interval: string) =>
    logEvent('trial_started', { tier, interval }),
  subscriptionStarted: (tier: string, interval: string) =>
    logEvent('subscription_started', { tier, interval, platform: Platform.OS }),
  subscriptionCancelled: (tier: string) => logEvent('subscription_cancelled', { tier }),
  referralSent: (channel: string) => logEvent('referral_sent', { channel }),
  referralRedeemed: () => logEvent('referral_redeemed'),
  inviteCreated: () => logEvent('household_invite_created'),
  inviteRedeemed: () => logEvent('household_invite_redeemed'),
  accountDeleted: () => logEvent('account_deleted'),
  importantDateAdded: (type: string) => logEvent('important_date_added', { type }),
};
