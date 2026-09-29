// =============================================
// EVI - Referrals Screen
// =============================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import {
  getOrCreateReferralCode,
  getReferralStats,
  buildReferralLink,
  buildReferralMessage,
  ReferralStats,
} from '../../services/referralService';
import { Analytics } from '../../services/analyticsService';

export default function ReferralsScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = async () => {
    if (!userProfile) return;
    setLoading(true);
    setLoadError(false);
    try {
      await getOrCreateReferralCode(userProfile.id, userProfile.displayName);
      const s = await getReferralStats(userProfile.id);
      setStats(s);
    } catch (e) {
      // Without this catch, a failed call here left the screen stuck on
      // the loading spinner forever with no way out but to back out.
      console.warn('Referrals load error:', e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userProfile?.id]);

  const handleShare = async () => {
    if (!stats || !userProfile) return;
    try {
      await Share.share({
        message: buildReferralMessage(stats.code, userProfile.displayName),
      });
      Analytics.referralSent('share_sheet');
    } catch (e) {
      console.error(e);
    }
  };

  const copyCode = async () => {
    if (!stats) return;
    await Clipboard.setStringAsync(stats.code);
    Alert.alert('Copied', 'Your referral code is on your clipboard.');
  };

  const copyLink = async () => {
    if (!stats) return;
    await Clipboard.setStringAsync(buildReferralLink(stats.code));
    Alert.alert('Copied', 'Your referral link is on your clipboard.');
  };

  if (loadError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Invite Friends</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.errorText}>Couldn&apos;t load your referral info.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !stats) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Invite Friends</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Ionicons name="gift" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.heroTitle}>Get a free month.</Text>
          <Text style={styles.heroSubtitle}>
            For every friend who signs up with your code, you both get{' '}
            <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>1 month free</Text>.
          </Text>
        </View>

        {/* Code display */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your referral code</Text>
          <Text style={styles.code}>{stats.code}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={copyCode}>
              <Ionicons name="copy-outline" size={18} color={Colors.primary} />
              <Text style={styles.iconBtnText}>Copy code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={copyLink}>
              <Ionicons name="link-outline" size={18} color={Colors.primary} />
              <Text style={styles.iconBtnText}>Copy link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={22} color={Colors.textInverse} />
          <Text style={styles.shareBtnText}>Share with a friend</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatBox label="Invited" value={stats.totalInvited} />
          <StatBox label="Joined" value={stats.totalConverted} />
          <StatBox
            label="Free months"
            value={stats.freeMonthsRemaining}
            color={Colors.good}
          />
        </View>

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          <Step number={1} text="Share your code or link with friends" />
          <Step number={2} text="They sign up and start their free trial" />
          <Step number={3} text="They subscribe → you both get 1 free month" />
          <Text style={styles.fine}>
            Free months are applied to your next billing cycle. Referrals credited when the
            invited user completes a paid subscription.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  color = Colors.textPrimary,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryBtnText: { color: Colors.textInverse, fontWeight: FontWeights.semibold, fontSize: FontSizes.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  content: { padding: Spacing.lg },
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
  heroTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  codeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  code: {
    fontSize: 42,
    fontWeight: FontWeights.extrabold,
    color: Colors.primary,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  codeActions: { flexDirection: 'row', gap: Spacing.md },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: BorderRadius.md,
  },
  iconBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  shareBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  shareBtnText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  howCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  howTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  fine: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    lineHeight: 16,
  },
});
