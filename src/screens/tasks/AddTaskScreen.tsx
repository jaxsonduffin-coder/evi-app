// =============================================
// EVI - Add Task Screen
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { createTask } from '../../services/taskService';
import { TaskPriority, HouseholdTask } from '../../types';
import { DateInput } from '../../components/common/DateInput';

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: Colors.urgent },
  { value: 'high', label: 'High', color: Colors.warning },
  { value: 'medium', label: 'Medium', color: Colors.info },
  { value: 'low', label: 'Low', color: Colors.textTertiary },
];

const RECURRING_OPTIONS: { value: HouseholdTask['recurringInterval']; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'annually', label: 'Yearly' },
];

export default function AddTaskScreen({ navigation, route }: any) {
  const { userProfile, currentHousehold } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string>(route?.params?.selectedDate || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<HouseholdTask['recurringInterval']>('monthly');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!userProfile || !currentHousehold) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please give this task a title.');
      return;
    }

    setSaving(true);
    try {
      await createTask(currentHousehold.id, userProfile.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>New Task</Text>
        <TouchableOpacity onPress={save} disabled={saving || !title.trim()}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.saveText, !title.trim() && { opacity: 0.4 }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <TextInput
            style={styles.titleInput}
            placeholder="What needs doing?"
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <TextInput
            style={styles.descInput}
            placeholder="Notes (optional)"
            placeholderTextColor={Colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[
                  styles.priorityChip,
                  priority === p.value && { backgroundColor: p.color, borderColor: p.color },
                ]}
                onPress={() => setPriority(p.value)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === p.value && { color: '#fff' },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Due date</Text>
          <DateInput value={dueDate} onChange={setDueDate} placeholder="No due date" minimumDate={new Date()} />

          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>Recurring</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          {isRecurring && (
            <View style={styles.recurringOptions}>
              {RECURRING_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[
                    styles.recurringChip,
                    recurringInterval === r.value && styles.recurringChipActive,
                  ]}
                  onPress={() => setRecurringInterval(r.value)}
                >
                  <Text
                    style={[
                      styles.recurringChipText,
                      recurringInterval === r.value && styles.recurringChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  saveText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  content: { padding: Spacing.lg },
  titleInput: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  descInput: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    paddingVertical: Spacing.md,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  priorityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  priorityText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  recurringOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  recurringChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  recurringChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  recurringChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  recurringChipTextActive: {
    color: '#fff',
    fontWeight: FontWeights.semibold,
  },
});
