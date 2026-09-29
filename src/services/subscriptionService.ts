// =============================================
// EVI - Subscription Service (RevenueCat)
// =============================================
//
// SETUP INSTRUCTIONS (do these before shipping):
//
// 1. Create RevenueCat account: https://app.revenuecat.com
// 2. Create two apps (iOS + Android) linked to your Apple + Google Play accounts
// 3. Create products in App Store Connect + Google Play:
//    - com.jdnorth.evi.solo.monthly ($9.99/mo)
//    - com.jdnorth.evi.household.monthly ($19.99/mo)
//    - com.jdnorth.evi.pro.monthly ($39.99/mo)
// 4. Add them to RevenueCat as offerings named "default"
// 5. Get your public API keys from RevenueCat settings and set them below.
// 6. Run: npx expo install react-native-purchases
// 7. Import initSubscriptions() in App.tsx and call it after auth.
//
// =============================================

import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SubscriptionTier } from '../types';
import { markReferralConverted } from './referralService';

const REVENUECAT_IOS_API_KEY = 'appl_AjMSCfHhvzppoyZiBlLxrYhJPMK';
const REVENUECAT_ANDROID_API_KEY = 'goog_HCREPgGkvgyiFpTOLQmYtCZViTt';

let PurchasesLib: any = null;

// Lazy-load react-native-purchases so app builds without it during dev
async function getPurchases() {
  if (PurchasesLib) return PurchasesLib;
  try {
    PurchasesLib = require('react-native-purchases').default;
    return PurchasesLib;
  } catch (e) {
    console.warn('react-native-purchases not installed. Run: npx expo install react-native-purchases');
    return null;
  }
}

/**
 * Initialize RevenueCat SDK. Call this once after user logs in.
 */
export async function initSubscriptions(userId: string): Promise<void> {
  const Purchases = await getPurchases();
  if (!Purchases) return;

  const key = Platform.OS === 'ios' ? REVENUECAT_IOS_API_KEY : REVENUECAT_ANDROID_API_KEY;
  if (key.startsWith('REPLACE_')) {
    console.log('RevenueCat not configured yet — skipping.');
    return;
  }

  try {
    await Purchases.configure({ apiKey: key, appUserID: userId });
    // Sync entitlement to our Firestore record
    await syncSubscriptionStatus(userId);
  } catch (e) {
    console.error('RevenueCat init failed:', e);
  }
}

/**
 * Get the current available subscription offerings (products).
 */
export async function getAvailableOfferings(): Promise<any | null> {
  const Purchases = await getPurchases();
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (e) {
    console.error('getOfferings failed:', e);
    return null;
  }
}

/**
 * Purchase a subscription package (Solo or Household).
 * Returns the tier granted or null if failed.
 */
export async function purchasePackage(
  userId: string,
  pkg: any
): Promise<SubscriptionTier['id'] | null> {
  const Purchases = await getPurchases();
  if (!Purchases) return null;

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return await syncFromCustomerInfo(userId, customerInfo);
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error('Purchase failed:', e);
    }
    return null;
  }
}

/**
 * Restore purchases (used on new device / reinstall).
 */
export async function restorePurchases(userId: string): Promise<SubscriptionTier['id']> {
  const Purchases = await getPurchases();
  if (!Purchases) return 'free';

  try {
    const customerInfo = await Purchases.restorePurchases();
    return (await syncFromCustomerInfo(userId, customerInfo)) || 'free';
  } catch (e) {
    console.error('Restore failed:', e);
    return 'free';
  }
}

/**
 * Sync current subscription status from RevenueCat to Firestore.
 */
export async function syncSubscriptionStatus(userId: string): Promise<SubscriptionTier['id']> {
  const Purchases = await getPurchases();
  if (!Purchases) return 'free';

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return (await syncFromCustomerInfo(userId, customerInfo)) || 'free';
  } catch (e) {
    console.error('Sync failed:', e);
    return 'free';
  }
}

// ---- Helpers ----

async function syncFromCustomerInfo(
  userId: string,
  customerInfo: any
): Promise<SubscriptionTier['id']> {
  // RevenueCat entitlements: configure 'pro', 'household', and 'solo'
  // entitlements in the dashboard, one per paid tier.
  const entitlements = customerInfo.entitlements.active || {};

  let tier: SubscriptionTier['id'] = 'free';
  if (entitlements.pro) tier = 'pro';
  else if (entitlements.household) tier = 'household';
  else if (entitlements.solo) tier = 'solo';

  // Write to Firestore
  try {
    await updateDoc(doc(db, 'users', userId), {
      subscriptionTier: tier,
      subscriptionUpdatedAt: new Date(),
    });
  } catch (e) {
    console.warn('Failed to persist subscription tier:', e);
  }

  // If this user was referred and just went paid, mark the referral converted
  // (this earns their referrer a free month).
  if (tier !== 'free') {
    markReferralConverted(userId).catch((e) => console.warn('markReferralConverted failed:', e));
  }

  return tier;
}
