// =============================================
// EVI - Utilities Screen
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
import { Utility, HomeProfile } from '../../types';

const UTILITY_ICONS: Record<Utility['type'], string> = {
  electricity: 'flash',
  water: 'water',
  gas: 'flame',
  internet: 'wifi',
  phone: 'call',
  trash: 'trash',
  sewer: 'water-outline',
  other: 'ellipsis-horizontal-circle',
};

export default function UtilitiesScreen({ navigation }: any) {
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

  const deleteUtility = async (id: string) => {
    if (!profile) return;
    Alert.alert('Delete utility', 'Remove this utility?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = profile.utilities.filter((u) => u.id !== id);
          await updateHomeProfile(profile.id, { utilities: updated });
          setProfile({ ...profile, utilities: updated });
        },
      },
    ]);
  };

  const renderUtility = ({ item }: { item: Utility }) => (
    <TouchableOpacity
      style={styles.card}
      onLongPress={() => deleteUtility(item.id)}
      onPress={() => navigation.navigate('AddUtility', { utilityId: item.id })}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={UTILITY_ICONS[item.type] as any}
          size={22}
          color={Colors.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.provider}</Text>
        <Text style={styles.sub}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          {item.autopay && ' · Autopay'}
        </Text>
        {item.monthlyEstimate ? (
          <Text style={styles.amount}>~${item.monthlyEstimate.toFixed(2)}/mo</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Utilities</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddUtility')}
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
          data={profile?.utilities || []}
          renderItem={renderUtility}
          keyExtractor={(u) => u.id}
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
              <Ionicons name="flash-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>No utilities yet</Text>
              <Text style={styles.emptyText}>
                Add your electric, water, internet, and other utility providers to keep bills
                and account numbers in one place.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddUtility')}
              >
                <Text style={styles.emptyBtnText}>Add Utility</Text>
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
  amount: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: 2,
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
