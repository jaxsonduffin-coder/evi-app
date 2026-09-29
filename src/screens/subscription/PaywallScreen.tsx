// =============================================
// EVI - Paywall / Upgrade Screen
// =============================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import {
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  SubscriptionTierId,
  BillingInterval,
  getEffectiveMonthly,
  getAnnualSavingsPercent,
} from '../../types';
import {
  getAvailableOfferings,
  purchasePackage,
  restorePurchases,
} from '../../services/subscriptionService';
import { Analytics } from '../../services/analyticsService';

const TERMS_URL = 'https://jdnorth.co/evi/terms';
const PRIVACY_URL = 'https://jdnorth.co/evi/privacy';

export default function PaywallScreen({ navigation, route }: any) {
  const { userProfile, refreshProfile } = useAuth();
  const [interval, setInterval] = useState<BillingInterval>('annual');
  const [selectedTierId, setSelectedTierId] = useState<SubscriptionTierId>('household');
  const [offerings, setOfferings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    (async () => {
      const o = await getAvailableOfferings();
      setOfferings(o);
      setLoading(false);
    })();
    Analytics.paywallViewed(route?.params?.trigger || 'unknown');
  }, []);

  // Tiers shown (never the free tier on the paywall)
  const shownTiers = SUBSCRIPTION_TIERS.filter((t) => t.id !== 'free');

  const selectedTier =
    shownTiers.find((t) => t.id === selectedTierId) || shownTiers[0];

  // The actual RevenueCat package for the selected tier/interval, if the
  // offering is configured. Never assume a package exists — the "Coming
  // soon" fallback below is what protects us from a dead Buy button if
  // App Store Connect / RevenueCat isn't fully wired for this combo.
  const selectedPkg = offerings?.[`${selectedTier.id}_${interval}`];

  // Only claim a free trial when the resolved StoreKit product actually has
  // an introductory offer configured. Advertising "7 days free" when the
  // underlying product has no trial configured in App Store Connect charges
  // the user immediately and contradicts the paywall copy — this exact
  // mismatch is a common App Store rejection reason (Guideline 3.1.2 /
  // 2.3.1 Accurate Metadata).
  const hasIntroOffer = !!selectedPkg?.product?.introPrice;

  // Prefer RevenueCat's live, localized price string (what the user will
  // actually be charged) over the static SUBSCRIPTION_TIERS numbers, which
  // are only a fallback for when offerings haven't loaded yet.
  const livePriceString: string | undefined = selectedPkg?.product?.priceString;

  const handleUpgrade = async () => {
    if (!userProfile || !selectedTier) return;

    // Map to RC package name — configure these in RevenueCat dashboard
    const pkg = selectedPkg;

    if (!pkg) {
      Alert.alert(
        'Coming soon',
        'This subscription option is being finalized. Check back shortly!'
      );
      return;
    }

    setPurchasing(true);
    try {
      if (hasIntroOffer) {
        Analytics.trialStarted(selectedTier.id, interval);
      }
      const tier = await purchasePackage(userProfile.id, pkg);
      if (tier) {
        Analytics.subscriptionStarted(selectedTier.id, interval);
        await refreshProfile();
        Alert.alert('Welcome!', `Your ${selectedTier.name} plan is active.`);
        navigation.goBack();
      } else {
        // purchasePackage returns null on any non-cancel failure. Leaving
        // the user with silent nothing after tapping Buy is itself a
        // faulty-payment-flow pattern — always tell them what happened.
        Alert.alert(
          'Purchase not completed',
          "We couldn't complete that purchase. Please check your payment method and try again."
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (!userProfile) return;
    setPurchasing(true);
    try {
      const tier = await restorePurchases(userProfile.id);
      await refreshProfile();
      if (tier === 'free') {
        Alert.alert('No purchase found', 'No previous subscription to restore.');
      } else {
        Alert.alert('Restored', 'Your subscription has been restored.');
        navigation.goBack();
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Ionicons name="diamond" size={48} color={Colors.accent} />
          </View>
          {hasIntroOffer ? (
            <>
              <View style={styles.trialBadge}>
                <Ionicons name="gift" size={16} color={Colors.good} />
                <Text style={styles.trialBadgeText}>7 days free · cancel anytime</Text>
              </View>
              <Text style={styles.title}>Start your free trial</Text>
              <Text style={styles.subtitle}>
                Try every AI feature for 7 days. You won&apos;t be charged if you cancel before day 7.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>Upgrade your household</Text>
              <Text style={styles.subtitle}>
                Unlock every AI feature for your household.
              </Text>
            </>
          )}
        </View>

        {/* Interval Toggle */}
        <View style={styles.intervalToggle}>
          <IntervalOption
            label="Monthly"
            active={interval === 'monthly'}
            onPress={() => setInterval('monthly')}
          />
          <IntervalOption
            label="Annual"
            badge="SAVE 17%"
            active={interval === 'annual'}
            onPress={() => setInterval('annual')}
          />
        </View>

        {/* Tier Cards */}
        <View style={styles.tiers}>
          {shownTiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              interval={interval}
              selected={selectedTierId === tier.id}
              onSelect={() => setSelectedTierId(tier.id)}
              livePriceString={offerings?.[`${tier.id}_${interval}`]?.product?.priceString}
            />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleUpgrade}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.ctaText}>
                  {hasIntroOffer ? 'Start 7-Day Free Trial' : `Subscribe to ${selectedTier.name}`}
                </Text>
                <Text style={styles.ctaSubtext}>
                  {hasIntroOffer ? 'Then ' : ''}
                  {formatPrice(selectedTier, interval, livePriceString)} · Cancel anytime
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.fine}>
          Auto-renews {interval}. Cancel anytime from your App Store or Play Store settings.
        </Text>

        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.legalLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
          <Text style={styles.restore}>Restore purchases</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function IntervalOption({
  label,
  badge,
  active,
  onPress,
}: {
  label: string;
  badge?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.intervalOption, active && styles.intervalOptionActive]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.intervalOptionText,
          active && styles.intervalOptionTextActive,
        ]}
      >
        {label}
      </Text>
      {badge && (
        <View style={styles.intervalBadge}>
          <Text style={styles.intervalBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TierCard({
  tier,
  interval,
  selected,
  onSelect,
  livePriceString,
}: {
  tier: SubscriptionTier;
  interval: BillingInterval;
  selected: boolean;
  onSelect: () => void;
  livePriceString?: string;
}) {
  const effMonthly = getEffectiveMonthly(tier, interval);
  // The card's big monthly-equivalent number stays a display estimate from
  // SUBSCRIPTION_TIERS (safe across currencies/locales). The actual charged
  // total — sourced from RevenueCat's live price when available — is shown
  // on the annual note below and, most importantly, on the CTA button right
  // before the user commits to the purchase (see formatPrice in the parent).
  return (
    <TouchableOpacity
      style={[styles.tierCard, selected && styles.tierCardActive]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {tier.highlight && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tier.highlight}</Text>
        </View>
      )}
      <View style={styles.tierHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tierName}>{tier.name}</Text>
          <Text style={styles.tierDesc}>{tier.description}</Text>
        </View>
        <View style={styles.tierPriceWrap}>
          <Text style={styles.tierPrice}>${effMonthly.toFixed(2)}</Text>
          <Text style={styles.tierPeriod}>/mo</Text>
        </View>
      </View>
      {interval === 'annual' && tier.annualPrice && (
        <Text style={styles.annualNote}>
          Billed {livePriceString ? `${livePriceString}/year` : `$${tier.annualPrice}/year`} · save{' '}
          {getAnnualSavingsPercent(tier)}%
        </Text>
      )}

      <View style={styles.features}>
        {tier.features.slice(0, 5).map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.good} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function formatPrice(
  tier: SubscriptionTier,
  interval: BillingInterval,
  livePriceString?: string
): string {
  // Prefer RevenueCat's live, localized price string — it reflects the
  // actual App Store/Play Store price (currency, regional pricing, any
  // price changes) and is what the user will really be charged. The
  // static SUBSCRIPTION_TIERS numbers are only a fallback for before
  // offerings have loaded.
  if (livePriceString) {
    return `${livePriceString}/${interval === 'annual' ? 'year' : 'mo'}`;
  }
  if (interval === 'annual' && tier.annualPrice) {
    return `$${tier.annualPrice.toFixed(2)}/year`;
  }
  return `$${tier.price}/mo`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.sm },
  hero: { alignItems: 'center', marginBottom: Spacing.xl },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.good + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  trialBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.good,
  },
  intervalToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  intervalOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  intervalOptionActive: {
    backgroundColor: Colors.textPrimary,
  },
  intervalOptionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  intervalOptionTextActive: {
    color: Colors.textInverse,
  },
  intervalBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  intervalBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.5,
  },
  tiers: { gap: Spacing.md, marginBottom: Spacing.xl },
  tierCard: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  tierCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  tierName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  tierDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tierPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tierPrice: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
  },
  tierPeriod: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginLeft: 4,
  },
  annualNote: {
    fontSize: FontSizes.xs,
    color: Colors.good,
    fontWeight: FontWeights.semibold,
    marginTop: 4,
  },
  features: {
    marginTop: Spacing.md,
    gap: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeights.extrabold,
    color: '#fff',
    letterSpacing: 1,
  },
  ctaBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  ctaText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  ctaSubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textInverse,
    opacity: 0.85,
    marginTop: 2,
  },
  fine: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  restore: {
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
    marginTop: Spacing.lg,
    fontSize: FontSizes.sm,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  legalLink: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalDot: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
});
