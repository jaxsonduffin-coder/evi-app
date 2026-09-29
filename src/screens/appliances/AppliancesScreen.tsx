// =============================================
// EVI - Appliances Screen
// Manages appliance list within the home profile
// =============================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { getHomeProfile, updateHomeProfile } from '../../services/householdService';
import { Appliance, HomeProfile } from '../../types';

export default function AppliancesScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentHousehold?.id) load();
  }, [currentHousehold?.id]);

  const load = async () => {
    if (!currentHousehold) return;
    const p = await getHomeProfile(currentHousehold.id);
    setProfile(p);
    setLoading(false);
  };

  const deleteAppliance = async (id: string) => {
    if (!profile) return;
    Alert.alert('Delete appliance', 'Remove this appliance?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = profile.appliances.filter((a) => a.id !== id);
          await updateHomeProfile(profile.id, { appliances: updated });
          setProfile({ ...profile, appliances: updated });
        },
      },
    ]);
  };

  const renderAppliance = ({ item }: { item: Appliance }) => {
    const daysToWarranty = item.warrantyExpiry
      ? Math.ceil((item.warrantyExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => deleteAppliance(item.id)}
        onPress={() => navigation.navigate('AddAppliance', { applianceId: item.id })}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="hardware-chip" size={22} color={Colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {item.brand ? (
            <Text style={styles.sub}>
              {item.brand}
              {item.model ? ` · ${item.model}` : ''}
            </Text>
          ) : null}
          {daysToWarranty !== null && daysToWarranty > 0 && (
            <Text
              style={[
                styles.warranty,
                daysToWarranty <= 60 && { color: Colors.warning },
              ]}
            >
              Warranty · {daysToWarranty}d left
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Appliances</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddAppliance')}
        >
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={profile?.appliances || []}
          renderItem={renderAppliance}
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
              <Ionicons name="hardware-chip-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No appliances yet</Text>
              <Text style={styles.emptyText}>
                Track your washer, dryer, fridge, HVAC, and more. EVI will remind you when
                warranties are about to expire.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddAppliance')}
              >
                <Text style={styles.emptyBtnText}>Add Appliance</Text>
              </TouchableOpacity>
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
  title: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  sub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  warranty: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: FontWeights.semibold,
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
    marginBottom: Spacing.xl,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: {
    color: Colors.textInverse,
    fontWeight: FontWeights.semibold,
  },
});
