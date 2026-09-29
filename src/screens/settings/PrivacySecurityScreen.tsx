// =============================================
// EVI - Privacy & Security Screen
// Includes Delete Account (Apple mandate)
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { deleteAccount, exportUserData } from '../../services/accountService';
import { isOnline } from '../../hooks/useNetworkStatus';

export default function PrivacySecurityScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!isOnline()) {
      Alert.alert("You're offline", 'Data export needs an internet connection.');
      return;
    }
    setExporting(true);
    try {
      const { downloadUrl } = await exportUserData();
      Alert.alert(
        'Your data is ready',
        "We've prepared a JSON file with everything EVI has stored about you. Open it now to download or share it — the link expires in 24 hours.",
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Open', onPress: () => Linking.openURL(downloadUrl) },
        ]
      );
    } catch (e: any) {
      Alert.alert('Export failed', e.message || 'Please try again or email support@jdnorth.co');
    } finally {
      setExporting(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      "This will permanently delete your account and ALL your data — documents, tasks, calendar events, everything. This cannot be undone.\n\nAre you absolutely sure?",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => secondConfirmation(),
        },
      ]
    );
  };

  const secondConfirmation = () => {
    Alert.alert(
      'Final Confirmation',
      `To confirm, we'll delete the account for ${userProfile?.email}. Type "DELETE" is not required — just tap below.`,
      [
        { text: 'Nevermind, keep my account', style: 'cancel' },
        {
          text: 'Yes, delete forever',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // The Cloud Function signs the user out and auth context will detect it
      Alert.alert('Account Deleted', 'Your account and all your data have been removed. Thanks for trying EVI.');
    } catch (e: any) {
      Alert.alert('Delete failed', e.message || 'Please try again or email support@jdnorth.co');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Data & Privacy */}
        <Section title="Your Data">
          <Row
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://jdnorth.co/evi/privacy')}
          />
          <Row
            icon="reader-outline"
            label="Terms of Service"
            onPress={() => Linking.openURL('https://jdnorth.co/evi/terms')}
          />
          <Row
            icon="download-outline"
            label={exporting ? 'Preparing export...' : 'Export My Data'}
            subtitle="Download a copy of all your data (JSON)"
            onPress={handleExport}
            disabled={exporting}
            loading={exporting}
          />
        </Section>

        {/* Account */}
        <Section title="Account">
          <Row
            icon="mail-outline"
            label="Contact Support"
            subtitle="Get help with your account"
            onPress={() => Linking.openURL('mailto:support@jdnorth.co?subject=EVI%20Support')}
          />
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone">
          <TouchableOpacity style={styles.dangerBtn} onPress={confirmDeleteAccount} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator color={Colors.urgent} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={22} color={Colors.urgent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dangerLabel}>Delete Account</Text>
                  <Text style={styles.dangerSubtitle}>
                    Permanently remove your account and all data
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  subtitle,
  onPress,
  disabled,
  loading,
}: {
  icon: any;
  label: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textTertiary} />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  content: { padding: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  rowSub: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.urgent + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.urgent + '30',
  },
  dangerLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.urgent,
  },
  dangerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.urgent + 'AA',
    marginTop: 2,
  },
});
