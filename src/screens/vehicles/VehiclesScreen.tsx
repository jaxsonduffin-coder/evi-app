// =============================================
// EVI - Vehicles Screen
// List and manage household vehicles
// =============================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { getHouseholdVehicles } from '../../services/vehicleService';
import { Vehicle } from '../../types';

export default function VehiclesScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentHousehold) return;
    try {
      const list = await getHouseholdVehicles(currentHousehold.id);
      setVehicles(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentHousehold?.id]);

  useEffect(() => {
    if (currentHousehold?.id) load();
  }, [currentHousehold?.id, load]);

  const renderVehicle = ({ item }: { item: Vehicle }) => {
    const regDays = item.registrationExpiry
      ? Math.ceil((item.registrationExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    const insDays = item.insuranceExpiry
      ? Math.ceil((item.insuranceExpiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => navigation.navigate('AddVehicle', { vehicleId: item.id })}
      >
        <View style={styles.vehicleIcon}>
          <Ionicons name="car" size={28} color={Colors.primary} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {item.year} {item.make} {item.model}
          </Text>
          {item.color && item.licensePlate ? (
            <Text style={styles.vehicleSub}>
              {item.color} • {item.licensePlate}
            </Text>
          ) : null}
          {regDays !== null && regDays <= 45 && regDays > 0 && (
            <View style={styles.badge}>
              <Ionicons name="warning" size={12} color={Colors.warning} />
              <Text style={styles.badgeText}>
                Registration in {regDays}d
              </Text>
            </View>
          )}
          {insDays !== null && insDays <= 45 && insDays > 0 && (
            <View style={styles.badge}>
              <Ionicons name="warning" size={12} color={Colors.warning} />
              <Text style={styles.badgeText}>Insurance in {insDays}d</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Vehicles</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddVehicle')}
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
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyText}>
                Add your vehicles to track registration, insurance, and maintenance.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddVehicle')}
              >
                <Text style={styles.emptyBtnText}>Add Vehicle</Text>
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
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: {
    padding: Spacing.lg,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  vehicleSub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    color: Colors.warning,
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
