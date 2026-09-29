// =============================================
// EVI - Add / Edit Utility Screen
// =============================================

import React, { useEffect, useState } from 'react';
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
import { getHomeProfile, updateHomeProfile } from '../../services/householdService';
import { Utility } from '../../types';

const TYPES: { value: Utility['type']; label: string; icon: string }[] = [
  { value: 'electricity', label: 'Electric', icon: 'flash' },
  { value: 'water', label: 'Water', icon: 'water' },
  { value: 'gas', label: 'Gas', icon: 'flame' },
  { value: 'internet', label: 'Internet', icon: 'wifi' },
  { value: 'phone', label: 'Phone', icon: 'call' },
  { value: 'trash', label: 'Trash', icon: 'trash' },
  { value: 'sewer', label: 'Sewer', icon: 'water-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle' },
];

export default function AddUtilityScreen({ navigation, route }: any) {
  const { currentHousehold } = useAuth();
  const editingId = route?.params?.utilityId;

  const [profile, setProfile] = useState<any>(null);
  const [type, setType] = useState<Utility['type']>('electricity');
  const [provider, setProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [monthlyEstimate, setMonthlyEstimate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [autopay, setAutopay] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentHousehold) return;
    (async () => {
      const p = await getHomeProfile(currentHousehold.id);
      setProfile(p);
      if (editingId && p) {
        const existing = p.utilities.find((u) => u.id === editingId);
        if (existing) {
          setType(existing.type);
          setProvider(existing.provider);
          setAccountNumber(existing.accountNumber || '');
          setMonthlyEstimate(existing.monthlyEstimate?.toString() || '');
          setDueDate(existing.dueDate?.toString() || '');
          setAutopay(existing.autopay);
          setNotes(existing.notes || '');
        }
      }
    })();
  }, [currentHousehold?.id, editingId]);

  const save = async () => {
    if (!profile) return;
    if (!provider.trim()) {
      Alert.alert('Missing provider', 'Please enter a provider name.');
      return;
    }
    setSaving(true);
    try {
      const utility: Utility = {
        id: editingId || `util_${Date.now()}`,
        type,
        provider: provider.trim(),
        accountNumber: accountNumber.trim() || undefined,
        monthlyEstimate: monthlyEstimate ? Number(monthlyEstimate) : undefined,
        dueDate: dueDate ? Number(dueDate) : undefined,
        autopay,
        notes: notes.trim() || undefined,
      };

      const updated = editingId
        ? profile.utilities.map((u: Utility) => (u.id === editingId ? utility : u))
        : [...profile.utilities, utility];

      await updateHomeProfile(profile.id, { utilities: updated });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save utility');
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
        <Text style={styles.title}>{editingId ? 'Edit Utility' : 'Add Utility'}</Text>
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
          <Text style={styles.label}>Type</Text>
          <View style={styles.chips}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[
                  styles.chip,
                  type === t.value && { backgroundColor: Colors.primary },
                ]}
                onPress={() => setType(t.value)}
              >
                <Ionicons
                  name={t.icon as any}
                  size={16}
                  color={type === t.value ? '#fff' : Colors.primary}
                />
                <Text
                  style={[
                    styles.chipText,
                    type === t.value && { color: '#fff' },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Provider *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Idaho Power"
            value={provider}
            onChangeText={setProvider}
          />

          <Text style={styles.label}>Account number</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            value={accountNumber}
            onChangeText={setAccountNumber}
          />

          <Text style={styles.label}>Monthly estimate ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 125"
            value={monthlyEstimate}
            onChangeText={setMonthlyEstimate}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Due day (1-31)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 15"
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="number-pad"
            maxLength={2}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Autopay on</Text>
            <Switch
              value={autopay}
              onValueChange={setAutopay}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Anything to remember"
            value={notes}
            onChangeText={setNotes}
            multiline
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
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
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
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
});
