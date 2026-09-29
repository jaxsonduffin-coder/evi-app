// =============================================
// EVI - Add Important Date Screen
// Birthdays, anniversaries, and other yearly dates
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { createImportantDate, updateImportantDate } from '../../services/importantDateService';
import { ImportantDateType, ImportantDate } from '../../types';
import { DateInput } from '../../components/common/DateInput';

function monthDayToDateStr(month: number, day: number): string {
  const now = new Date();
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

const TYPE_OPTIONS: { value: ImportantDateType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'birthday', label: 'Birthday', icon: 'gift-outline' },
  { value: 'anniversary', label: 'Anniversary', icon: 'heart-outline' },
  { value: 'other', label: 'Other', icon: 'star-outline' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Same day' },
  { value: 1, label: '1 day before' },
  { value: 3, label: '3 days before' },
  { value: 7, label: '1 week before' },
];

export default function AddImportantDateScreen({ navigation, route }: any) {
  const { userProfile, currentHousehold } = useAuth();
  const editing: ImportantDate | undefined = route?.params?.editing;
  const isEditing = !!editing;

  const [personName, setPersonName] = useState(editing?.personName || '');
  const [type, setType] = useState<ImportantDateType>(editing?.type || 'birthday');
  const [label, setLabel] = useState(editing?.label || '');
  const [dateStr, setDateStr] = useState(
    editing ? monthDayToDateStr(editing.month, editing.day) : ''
  ); // month/day picked via DateInput
  const [yearStr, setYearStr] = useState(editing?.year ? String(editing.year) : ''); // optional birth/event year
  const [notes, setNotes] = useState(editing?.notes || '');
  const [remindDaysBefore, setRemindDaysBefore] = useState(editing?.remindDaysBefore ?? 3);
  const [saving, setSaving] = useState(false);

  const yearLabel = type === 'birthday' ? 'Birth year (optional)' : 'Year (optional)';
  const yearHint =
    type === 'birthday'
      ? "So EVI can tell you what age they're turning"
      : type === 'anniversary'
      ? 'So EVI can tell you what anniversary it is'
      : undefined;

  const save = async () => {
    if (!currentHousehold?.id || !userProfile) return;
    if (!personName.trim()) {
      Alert.alert('Missing name', 'Please enter a name for this date.');
      return;
    }
    if (!dateStr) {
      Alert.alert('Missing date', 'Please pick a month and day.');
      return;
    }
    if (type === 'other' && !label.trim()) {
      Alert.alert('Missing label', 'Please describe what this date is (e.g. "Adoption Day").');
      return;
    }

    const picked = new Date(dateStr);
    const year = yearStr.trim() ? Number(yearStr.trim()) : undefined;
    if (year && (year < 1900 || year > new Date().getFullYear())) {
      Alert.alert('Invalid year', 'Please enter a valid year.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        personName: personName.trim(),
        type,
        label: type === 'other' ? label.trim() : undefined,
        month: picked.getMonth() + 1,
        day: picked.getDate(),
        year,
        notes: notes.trim() || undefined,
        remindDaysBefore,
      };
      if (isEditing) {
        await updateImportantDate(editing!.id, payload);
      } else {
        await createImportantDate(currentHousehold.id, userProfile.id, payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save this date');
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
        <Text style={styles.title}>{isEditing ? 'Edit Important Date' : 'Add Important Date'}</Text>
        <TouchableOpacity onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Type</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.typeCard, type === opt.value && styles.typeCardSelected]}
                onPress={() => setType(opt.value)}
              >
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={type === opt.value ? Colors.primary : Colors.textSecondary}
                />
                <Text style={[styles.typeLabel, type === opt.value && styles.typeLabelSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Details</Text>
          <TextInput
            style={styles.input}
            placeholder={type === 'anniversary' ? "Whose anniversary? (e.g. Mom & Dad)" : "Person's name"}
            value={personName}
            onChangeText={setPersonName}
          />

          {type === 'other' && (
            <TextInput
              style={styles.input}
              placeholder="What is this date? (e.g. Adoption Day)"
              value={label}
              onChangeText={setLabel}
            />
          )}

          <Text style={styles.fieldLabel}>Date</Text>
          <DateInput value={dateStr} onChange={setDateStr} placeholder="Month and day" />

          <View style={{ height: Spacing.md }} />
          <TextInput
            style={styles.input}
            placeholder={yearLabel}
            value={yearStr}
            onChangeText={setYearStr}
            keyboardType="number-pad"
            maxLength={4}
          />
          {yearHint && <Text style={styles.hint}>{yearHint}</Text>}

          <Text style={styles.sectionTitle}>Remind me</Text>
          <View style={styles.reminderRow}>
            {REMINDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.reminderChip,
                  remindDaysBefore === opt.value && styles.reminderChipSelected,
                ]}
                onPress={() => setRemindDaysBefore(opt.value)}
              >
                <Text
                  style={[
                    styles.reminderChipText,
                    remindDaysBefore === opt.value && styles.reminderChipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Gift ideas, favorite restaurant, anything to remember..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

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
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  saveText: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.primary },
  content: { padding: Spacing.lg },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.md },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  typeLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  typeLabelSelected: { color: Colors.primary },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  reminderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reminderChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  reminderChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  reminderChipText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  reminderChipTextSelected: {
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
});
