// =============================================
// EVI - Checklist Detail Screen
// Pick items (and a move date, if relevant) then generate real tasks.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { DateInput } from '../../components/common/DateInput';
import { getChecklistTemplate } from '../../data/checklistTemplates';
import { applyChecklistTemplate } from '../../services/checklistService';
import { useAuth } from '../../context/AuthContext';

export default function ChecklistDetailScreen({ route, navigation }: any) {
  const { templateId } = route.params;
  const template = getChecklistTemplate(templateId);
  const { userProfile, currentHousehold } = useAuth();

  const [dateStr, setDateStr] = useState('');
  const [checked, setChecked] = useState<Set<string>>(
    new Set(template?.items.map((i) => i.id) || [])
  );
  const [submitting, setSubmitting] = useState(false);

  if (!template) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.cardTitle}>Checklist not found</Text>
      </SafeAreaView>
    );
  }

  const toggleItem = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = checked.size;

  const handleCreate = async () => {
    if (!currentHousehold?.id || !userProfile?.id) return;
    if (selectedCount === 0) {
      Alert.alert('Select at least one item', 'Pick the steps you want EVI to remind you about.');
      return;
    }
    if (template.usesMoveDate && !dateStr) {
      Alert.alert('Pick a date', `Set your ${template.id === 'move_out' ? 'move-out' : 'move-in'} date so EVI can schedule reminders around it.`);
      return;
    }

    setSubmitting(true);
    try {
      const anchorDate = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
      const created = await applyChecklistTemplate(currentHousehold.id, userProfile.id, template.id, {
        anchorDate,
        selectedItemIds: Array.from(checked),
      });
      Alert.alert(
        'Checklist added',
        `${created.length} task${created.length === 1 ? '' : 's'} added to your list with reminders.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.warn('applyChecklistTemplate failed:', e);
      Alert.alert('Something went wrong', 'Could not create these tasks. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{template.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{template.subtitle}</Text>

        {template.usesMoveDate && (
          <View style={styles.dateSection}>
            <Text style={styles.label}>
              {template.id === 'move_out' ? 'Move-out date' : 'Move-in date'}
            </Text>
            <DateInput value={dateStr} onChange={setDateStr} placeholder="Select date" />
          </View>
        )}

        <Text style={styles.label}>
          Steps ({selectedCount}/{template.items.length} selected)
        </Text>

        {template.items.map((item) => {
          const isChecked = checked.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggleItem(item.id)}
            >
              <View style={[styles.checkbox, isChecked && { backgroundColor: template.color, borderColor: template.color }]}>
                {isChecked && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: template.color }, submitting && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>
              Add {selectedCount} task{selectedCount === 1 ? '' : 's'} to EVI
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  subtitle: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: 20 },
  dateSection: { marginBottom: Spacing.xl },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary },
  itemDesc: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  createButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  createButtonText: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.bold },
});
