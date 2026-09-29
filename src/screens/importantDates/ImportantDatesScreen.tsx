// =============================================
// EVI - Important Dates Screen
// Birthdays, anniversaries, and other yearly dates for the household
// =============================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import {
  getUpcomingImportantDates,
  deleteImportantDate,
  UpcomingImportantDate,
} from '../../services/importantDateService';

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  birthday: 'gift',
  anniversary: 'heart',
  other: 'star',
};

const TYPE_COLOR: Record<string, string> = {
  birthday: '#EC4899',
  anniversary: '#F59E0B',
  other: '#6366F1',
};

function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function ImportantDatesScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [dates, setDates] = useState<UpcomingImportantDate[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentHousehold?.id) return;
    try {
      const upcoming = await getUpcomingImportantDates(currentHousehold.id);
      setDates(upcoming);
    } catch (e) {
      console.warn('Important dates load error:', e);
    }
  }, [currentHousehold?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleDelete = (item: UpcomingImportantDate) => {
    Alert.alert(
      'Remove date',
      `Remove ${item.personName}'s ${item.type === 'other' ? item.label : item.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteImportantDate(item.id);
            load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Important Dates</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddImportantDate')}
        >
          <Ionicons name="add" size={22} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {dates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.border} />
            <Text style={styles.emptyTitle}>No important dates yet</Text>
            <Text style={styles.emptySubtitle}>
              Add birthdays and anniversaries so EVI can remind everyone before they happen.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddImportantDate')}
            >
              <Ionicons name="add" size={20} color={Colors.textInverse} />
              <Text style={styles.emptyButtonText}>Add a Date</Text>
            </TouchableOpacity>
          </View>
        ) : (
          dates.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.dateRow}
              onPress={() => navigation.navigate('AddImportantDate', { editing: item })}
              onLongPress={() => handleDelete(item)}
            >
              <View style={[styles.iconWrap, { backgroundColor: TYPE_COLOR[item.type] + '15' }]}>
                <Ionicons name={TYPE_ICON[item.type]} size={22} color={TYPE_COLOR[item.type]} />
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.personName}>
                  {item.personName}
                  {item.type === 'other' && item.label ? ` — ${item.label}` : ''}
                </Text>
                <Text style={styles.dateMeta}>
                  {item.nextOccurrence.toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                  })}
                  {item.turningAge ? ` · turning ${item.turningAge}` : ''}
                </Text>
                {item.notes ? (
                  <Text style={styles.notes} numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
              <View style={styles.daysBadge}>
                <Text
                  style={[
                    styles.daysBadgeText,
                    item.daysUntil <= 1 && styles.daysBadgeTextUrgent,
                  ]}
                >
                  {formatDaysUntil(item.daysUntil)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  content: { padding: Spacing.lg },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInfo: { flex: 1 },
  personName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  dateMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  notes: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  daysBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  daysBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
  },
  daysBadgeTextUrgent: {
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
