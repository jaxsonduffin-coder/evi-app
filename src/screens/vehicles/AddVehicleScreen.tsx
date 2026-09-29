// =============================================
// EVI - Add Vehicle Screen
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
import { createVehicle, updateVehicle, deleteVehicle, getVehicle } from '../../services/vehicleService';
import { DateInput } from '../../components/common/DateInput';

export default function AddVehicleScreen({ navigation, route }: any) {
  const { currentHousehold } = useAuth();
  const editingId: string | undefined = route?.params?.vehicleId;
  const isEditing = !!editingId;

  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [color, setColor] = useState('');
  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [mileage, setMileage] = useState('');
  const [registrationExpiry, setRegistrationExpiry] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    (async () => {
      try {
        const vehicle = await getVehicle(editingId);
        if (vehicle) {
          setYear(String(vehicle.year || ''));
          setMake(vehicle.make || '');
          setModel(vehicle.model || '');
          setTrim(vehicle.trim || '');
          setColor(vehicle.color || '');
          setVin(vehicle.vin || '');
          setLicensePlate(vehicle.licensePlate || '');
          setMileage(vehicle.mileage ? String(vehicle.mileage) : '');
          setRegistrationExpiry(
            vehicle.registrationExpiry ? vehicle.registrationExpiry.toISOString().slice(0, 10) : ''
          );
          setInsuranceProvider(vehicle.insuranceProvider || '');
          setInsurancePolicyNumber(vehicle.insurancePolicyNumber || '');
          setInsuranceExpiry(
            vehicle.insuranceExpiry ? vehicle.insuranceExpiry.toISOString().slice(0, 10) : ''
          );
        }
      } catch (e) {
        console.warn('Failed to load vehicle:', e);
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [editingId]);

  const save = async () => {
    if (!currentHousehold) return;
    if (!year || !make || !model) {
      Alert.alert('Missing info', 'Please fill in year, make, and model.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        year: Number(year),
        make,
        model,
        trim: trim || undefined,
        color: color || undefined,
        vin: vin || undefined,
        licensePlate: licensePlate || undefined,
        mileage: mileage ? Number(mileage) : undefined,
        registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : undefined,
        insuranceProvider: insuranceProvider || undefined,
        insurancePolicyNumber: insurancePolicyNumber || undefined,
        insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
      };
      if (isEditing && editingId) {
        await updateVehicle(editingId, payload);
      } else {
        await createVehicle(currentHousehold.id, payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editingId) return;
    Alert.alert('Delete vehicle', 'Remove this vehicle and its records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVehicle(editingId);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not delete vehicle');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</Text>
        <TouchableOpacity onPress={save} disabled={saving || loadingExisting}>
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
          <Text style={styles.sectionTitle}>Basics</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="Year *"
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              maxLength={4}
            />
            <TextInput
              style={[styles.input, styles.flex2]}
              placeholder="Make *"
              value={make}
              onChangeText={setMake}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Model *"
            value={model}
            onChangeText={setModel}
          />
          <TextInput
            style={styles.input}
            placeholder="Trim (optional)"
            value={trim}
            onChangeText={setTrim}
          />
          <TextInput
            style={styles.input}
            placeholder="Color"
            value={color}
            onChangeText={setColor}
          />
          <TextInput
            style={styles.input}
            placeholder="VIN"
            value={vin}
            onChangeText={setVin}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            placeholder="License plate"
            value={licensePlate}
            onChangeText={setLicensePlate}
            autoCapitalize="characters"
          />
          <TextInput
            style={styles.input}
            placeholder="Current mileage"
            value={mileage}
            onChangeText={setMileage}
            keyboardType="number-pad"
          />

          <Text style={styles.sectionTitle}>Registration</Text>
          <DateInput value={registrationExpiry} onChange={setRegistrationExpiry} placeholder="Registration expiry date" />

          <Text style={styles.sectionTitle}>Insurance</Text>
          <TextInput
            style={styles.input}
            placeholder="Insurance provider"
            value={insuranceProvider}
            onChangeText={setInsuranceProvider}
          />
          <TextInput
            style={styles.input}
            placeholder="Policy number"
            value={insurancePolicyNumber}
            onChangeText={setInsurancePolicyNumber}
          />
          <Text style={{ fontSize: FontSizes.sm, color: Colors.textTertiary, marginBottom: Spacing.xs }}>Expiry date</Text>
          <DateInput value={insuranceExpiry} onChange={setInsuranceExpiry} placeholder="Insurance expiry date" />

          {isEditing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Vehicle</Text>
            </TouchableOpacity>
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
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
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
  row: { flexDirection: 'row', gap: Spacing.md },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  deleteBtn: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: Colors.urgent,
    fontWeight: FontWeights.semibold,
    fontSize: FontSizes.md,
  },
});
