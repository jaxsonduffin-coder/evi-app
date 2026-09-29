// =============================================
// EVI - Tasks Screen (full list)
// Check off, edit, or delete household tasks.
// =============================================

import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { HouseholdTask } from '../../types';
import { getHouseholdTasks, completeTask, deleteTask } from '../../services/taskService';

const PRIORITY_COLOR: Record<string, string> = {
  urgent: Colors.urgent,
  high: Colors.warning,
  medium: Colors.info,
  low: Colors.textTertiary,
};

export default function TasksScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const load = useCallback(async () => {
    if (!currentHousehold?.id) return;
    try {
      const data = await getHouseholdTasks(currentHousehold.id, {
        status: showCompleted
          ? ['pending', 'in_progress', 'completed']
          : ['pending', 'in_progress', 'overdue'],
      });
      setTasks(data);
    } catch (e) {
      console.warn('Tasks load error:', e);
    } finally {
      setLoading(false);
    }
  }, [currentHousehold?.id, showCompleted]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleToggleComplete = async (task: HouseholdTask) => {
    const wasCompleted = task.status === 'completed';
    // Optimistic update
    setTasks((prev) =>
      wasCompleted
        ? prev.filter((t) => t.id !== task.id)
        : prev.map((t) => (t.id === task.id ? { ...t, status: 'completed' } : t))
    );
    try {
      if (!wasCompleted) {
        await completeTask(task.id);
      }
    } catch (e) {
      Alert.alert('Could not update task', 'Please try again.');
      load();
    }
  };

  const handleDelete = (task: HouseholdTask) => {
    Alert.alert('Delete task', `Remove "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          try {
            await deleteTask(task.id);
          } catch (e) {
            Alert.alert('Could not delete', 'Please try again.');
            load();
          }
        },
      },
    ]);
  };

  const renderTask = ({ item }: { item: HouseholdTask }) => {
    const isCompleted = item.status === 'completed';
    return (
      <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item)}>
        <TouchableOpacity
          style={[styles.checkbox, isCompleted && styles.checkboxChecked]}
          onPress={() => handleToggleComplete(item)}
        >
          {isCompleted && <Ionicons name="checkmark" size={16} color={Colors.textInverse} />}
        </TouchableOpacity>
        <View style={styles.info}>
          <Text style={[styles.title, isCompleted && styles.titleCompleted]}>{item.title}</Text>
          {item.dueDate ? (
            <Text style={styles.due}>Due {item.dueDate.toLocaleDateString()}</Text>
          ) : null}
        </View>
        {!isCompleted && (
          <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLOR[item.priority] + '20' }]}>
            <Text style={[styles.priorityText, { color: PRIORITY_COLOR[item.priority] }]}>
              {item.priority}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title2}>Tasks</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddTask')}>
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, !showCompleted && styles.filterChipActive]}
          onPress={() => setShowCompleted(false)}
        >
          <Text style={[styles.filterChipText, !showCompleted && styles.filterChipTextActive]}>
            Open
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, showCompleted && styles.filterChipActive]}
          onPress={() => setShowCompleted(true)}
        >
          <Text style={[styles.filterChipText, showCompleted && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(t) => t.id}
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
              <Ionicons name="checkmark-done-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyTitle}>
                {showCompleted ? 'No tasks yet' : "You're all caught up"}
              </Text>
              <Text style={styles.emptyText}>
                {showCompleted
                  ? 'Tap the + button to add your first task.'
                  : 'No open tasks right now.'}
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
  title2: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  filterChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.good,
    borderColor: Colors.good,
  },
  info: { flex: 1 },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  due: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  priorityText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    textTransform: 'capitalize',
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
