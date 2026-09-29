// =============================================
// EVI - Alerts Screen (full list)
// All active proactive alerts for the household; dismiss or tap through.
// =============================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { HouseholdAlert, AlertSeverity } from '../../types';
import { getActiveAlerts, dismissAlert } from '../../services/alertService';

const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  urgent: { color: Colors.urgent, icon: 'alert-circle', bg: '#FEF2F2' },
  warning: { color: Colors.warning, icon: 'warning', bg: '#FFFBEB' },
  info: { color: Colors.info, icon: 'information-circle', bg: '#EFF6FF' },
  good: { color: Colors.good, icon: 'checkmark-circle', bg: '#ECFDF5' },
};

export default function AlertsScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [alerts, setAlerts] = useState<HouseholdAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentHousehold?.id) return;
    try {
      const data = await getActiveAlerts(currentHousehold.id);
      setAlerts(data);
    } catch (e) {
      console.warn('Alerts load error:', e);
    } finally {
      setLoading(false);
    }
  }, [currentHousehold?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleDismiss = async (alert: HouseholdAlert) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    try {
      await dismissAlert(alert.id);
    } catch (e) {
      load();
    }
  };

  const handlePress = (alert: HouseholdAlert) => {
    if (alert.actionRoute) {
      navigation.navigate(alert.actionRoute);
    } else if (alert.relatedDocumentId) {
      navigation.navigate('DocumentDetail', { documentId: alert.relatedDocumentId });
    }
  };

  const renderAlert = ({ item }: { item: HouseholdAlert }) => {
    const config = SEVERITY_CONFIG[item.severity];
    const isActionable = !!(item.actionRoute || item.relatedDocumentId);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: config.bg }]}
        onPress={() => handlePress(item)}
        disabled={!isActionable}
        activeOpacity={isActionable ? 0.7 : 1}
      >
        <Ionicons name={config.icon} size={22} color={config.color} />
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.description}</Text>
        </View>
        <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(item)}>
          <Ionicons name="close" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alerts}
          renderItem={renderAlert}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.good} />
              <Text style={styles.emptyTitle}>Nothing urgent right now</Text>
              <Text style={styles.emptyText}>
                EVI will let you know here when something needs your attention — renewals,
                deadlines, or anything else worth flagging.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
  headerTitle: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  content: { flex: 1 },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  desc: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dismissBtn: {
    padding: Spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});
