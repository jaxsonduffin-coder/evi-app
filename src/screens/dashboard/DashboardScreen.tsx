// =============================================
// EVI - Dashboard Screen (Main Home Screen)
// =============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { HouseholdAlert, HouseholdTask, AlertSeverity } from '../../types';
import { UpcomingImportantDate } from '../../services/importantDateService';
import { completeTask } from '../../services/taskService';

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Severity config
const SEVERITY_CONFIG: Record<AlertSeverity, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  urgent: { color: Colors.urgent, icon: 'alert-circle', bg: '#FEF2F2' },
  warning: { color: Colors.warning, icon: 'warning', bg: '#FFFBEB' },
  info: { color: Colors.info, icon: 'information-circle', bg: '#EFF6FF' },
  good: { color: Colors.good, icon: 'checkmark-circle', bg: '#ECFDF5' },
};

export default function DashboardScreen({ navigation }: any) {
  const { userProfile, currentHousehold } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<HouseholdAlert[]>([]);
  const [tasks, setTasks] = useState<HouseholdTask[]>([]);
  const [upcomingDates, setUpcomingDates] = useState<UpcomingImportantDate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    if (!currentHousehold?.id) return;
    try {
      const [alertsData, tasksData, datesData] = await Promise.all([
        (await import('../../services/alertService')).getActiveAlerts(currentHousehold.id),
        (await import('../../services/taskService')).getHouseholdTasks(currentHousehold.id, {
          status: ['pending', 'in_progress'],
        }),
        (await import('../../services/importantDateService')).getUpcomingImportantDates(
          currentHousehold.id,
          30
        ),
      ]);
      setAlerts(alertsData);
      setTasks(tasksData.slice(0, 5));
      setUpcomingDates(datesData.slice(0, 3));
    } catch (e) {
      console.warn('Dashboard load error:', e);
    }
  }, [currentHousehold?.id]);

  const handleCompleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await completeTask(taskId);
    } catch (e) {
      loadData();
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    })();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const firstName = userProfile?.displayName?.split(' ')[0] || 'there';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
            <View style={styles.householdRow}>
              <Ionicons name="home" size={16} color={Colors.primary} />
              <Text style={styles.householdName}>
                {currentHousehold?.name || 'My Household'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
            {alerts.length > 0 && <View style={styles.notifBadge} />}
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="document-text-outline"
            label="Upload Doc"
            color={Colors.primary}
            onPress={() => navigation.navigate('DocumentUpload')}
          />
          <QuickAction
            icon="add-circle-outline"
            label="Add Task"
            color={Colors.good}
            onPress={() => navigation.navigate('AddTask')}
          />
          <QuickAction
            icon="chatbubble-outline"
            label="Ask EVI"
            color={Colors.secondary}
            onPress={() => navigation.navigate('Ask')}
          />
          <QuickAction
            icon="scan-outline"
            label="Scan"
            color={Colors.accent}
            onPress={() => navigation.navigate('DocumentScanner')}
          />
        </View>

        {/* Checklists Banner */}
        <TouchableOpacity
          style={styles.checklistBanner}
          onPress={() => navigation.navigate('Checklists')}
        >
          <View style={styles.checklistIconWrap}>
            <Ionicons name="school-outline" size={22} color="#8B5CF6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.checklistBannerTitle}>Moving? Adulting?</Text>
            <Text style={styles.checklistBannerSubtitle}>
              Try a guided checklist — Move-In, Move-Out, or Adulting 101
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Household This Week</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {alerts.length === 0 && !loading ? (
            <View style={styles.emptyMini}>
              <Ionicons name="checkmark-circle-outline" size={32} color={Colors.good} />
              <Text style={styles.emptyMiniText}>
                Nothing urgent right now. Add documents or vehicles so EVI can help you track deadlines.
              </Text>
            </View>
          ) : (
            alerts.map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity];
              return (
                <TouchableOpacity
                  key={alert.id}
                  style={[styles.alertCard, { backgroundColor: config.bg }]}
                  onPress={() => {
                    if (alert.actionRoute) {
                      navigation.navigate(alert.actionRoute);
                    } else if (alert.relatedDocumentId) {
                      navigation.navigate('DocumentDetail', { documentId: alert.relatedDocumentId });
                    } else {
                      navigation.navigate('Alerts');
                    }
                  }}
                >
                  <Ionicons name={config.icon} size={22} color={config.color} />
                  <View style={styles.alertContent}>
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 && !loading ? (
            <View style={styles.emptyMini}>
              <Ionicons name="clipboard-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyMiniText}>
                No tasks yet. Tap "Add Task" above to create one.
              </Text>
            </View>
          ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => navigation.navigate('Tasks')}
            >
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => handleCompleteTask(task.id)}
              >
                <View style={styles.checkboxInner} />
              </TouchableOpacity>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.dueDate && (
                  <Text style={styles.taskDue}>
                    Due {task.dueDate.toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: task.priority === 'high' ? Colors.urgent + '20' : Colors.warning + '20' }
              ]}>
                <Text style={[
                  styles.priorityText,
                  { color: task.priority === 'high' ? Colors.urgent : Colors.warning }
                ]}>
                  {task.priority}
                </Text>
              </View>
            </TouchableOpacity>
          ))
          )}
        </View>

        {/* Upcoming Important Dates */}
        {upcomingDates.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Coming Up</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ImportantDates')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {upcomingDates.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.dateCard}
                onPress={() => navigation.navigate('ImportantDates')}
              >
                <View style={styles.dateIconWrap}>
                  <Ionicons
                    name={d.type === 'birthday' ? 'gift' : d.type === 'anniversary' ? 'heart' : 'star'}
                    size={20}
                    color={Colors.accent}
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>
                    {d.personName}
                    {d.type === 'other' && d.label ? ` — ${d.label}` : ''}
                    {d.turningAge ? ` turns ${d.turningAge}` : ''}
                  </Text>
                  <Text style={styles.alertDesc}>
                    {d.daysUntil === 0
                      ? 'Today!'
                      : d.daysUntil === 1
                      ? 'Tomorrow'
                      : `In ${d.daysUntil} days`}{' '}
                    · {d.nextOccurrence.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Home Brain Quick View */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Home</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HomeDetails')}>
              <Text style={styles.seeAll}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.homeGrid}>
            <HomeInfoCard icon="home-outline" label="Type" value={currentHousehold?.type === 'rent' ? 'Rental' : 'Owned'} />
            <HomeInfoCard icon="document-text-outline" label="Documents" value="0" />
            <HomeInfoCard icon="construct-outline" label="Appliances" value="0" />
            <HomeInfoCard icon="car-outline" label="Vehicles" value="0" />
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Quick Action Button
function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionItem} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// Home Info Card
function HomeInfoCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.homeInfoCard}>
      <Ionicons name={icon} size={24} color={Colors.primary} />
      <Text style={styles.homeInfoValue}>{value}</Text>
      <Text style={styles.homeInfoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyMini: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  emptyMiniText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  householdName: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.medium,
  },
  notifButton: {
    padding: Spacing.sm,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.urgent,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
  },
  checklistBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  checklistIconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#8B5CF615',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checklistBannerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  checklistBannerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF4FF',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  dateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  taskDue: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    textTransform: 'capitalize',
  },
  homeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  homeInfoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  homeInfoValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  homeInfoLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
});
