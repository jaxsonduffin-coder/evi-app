// =============================================
// EVI - Add / Edit Appliance Screen
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { getHomeProfile, updateHomeProfile } from '../../services/householdService';
import { Appliance } from '../../types';
import { DateInput } from '../../components/common/DateInput';

const COMMON_APPLIANCES = [
  'Refrigerator',
  'Washer',
  'Dryer',
  'Dishwasher',
  'Oven/Range',
  'Microwave',
  'HVAC',
  'Water Heater',
  'Garbage Disposal',
  'TV',
];

export default function AddApplianceScreen({ navigation, route }: any) {
  const { currentHousehold } = useAuth();
  const editingId = route?.params?.applianceId;

  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentHousehold) return;
    (async () => {
      const p = await getHomeProfile(currentHousehold.id);
      setProfile(p);
      if (editingId && p) {
        const existing = p.appliances.find((a) => a.id === editingId);
        if (existing) {
          setName(existing.name);
          setBrand(existing.brand || '');
          setModel(existing.model || '');
          setSerialNumber(existing.serialNumber || '');
          setLocation(existing.location || '');
          setPurchaseDate(existing.purchaseDate?.toISOString().split('T')[0] || '');
          setWarrantyExpiry(existing.warrantyExpiry?.toISOString().split('T')[0] || '');
          setNotes(existing.notes || '');
        }
      }
    })();
  }, [currentHousehold?.id, editingId]);

  const save = async () => {
    if (!profile) return;
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter an appliance name.');
      return;
    }
    setSaving(true);
    try {
      const appliance: Appliance = {
        id: editingId || `app_${Date.now()}`,
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        location: location.trim() || undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
        notes: notes.trim() || undefined,
      };

      const updated = editingId
        ? profile.appliances.map((a: Appliance) => (a.id === editingId ? appliance : a))
        : [...profile.appliances, appliance];

      await updateHomeProfile(profile.id, { appliances: updated });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save appliance');
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
        <Text style={styles.title}>{editingId ? 'Edit Appliance' : 'Add Appliance'}</Text>
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
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Refrigerator"
            value={name}
            onChangeText={setName}
          />

          {!editingId && (
            <View style={styles.chips}>
              {COMMON_APPLIANCES.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={styles.chip}
                  onPress={() => setName(n)}
                >
                  <Text style={styles.chipText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Brand</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Samsung"
            value={brand}
            onChangeText={setBrand}
          />

          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. RF28R7351SR"
            value={model}
            onChangeText={setModel}
          />

          <Text style={styles.label}>Serial number</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            value={serialNumber}
            onChangeText={setSerialNumber}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kitchen"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Purchase date</Text>
          <DateInput value={purchaseDate} onChange={setPurchaseDate} placeholder="Select date" maximumDate={new Date()} />

          <Text style={styles.label}>Warranty expiry</Text>
          <DateInput value={warrantyExpiry} onChange={setWarrantyExpiry} placeholder="Select date" />

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
    marginTop: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight + '20',
  },
  chipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
});
