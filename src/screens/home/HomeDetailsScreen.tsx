// =============================================
// EVI - Home Details Screen
// Edit home profile (adapts for rent vs own)
// =============================================

import React, { useState, useEffect } from 'react';
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
import { HomeProfile, Address } from '../../types';
import { DateInput } from '../../components/common/DateInput';

export default function HomeDetailsScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<HomeProfile | null>(null);

  const [address, setAddress] = useState<Address>({
    street: '',
    unit: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
  });

  // Rent fields
  const [monthlyRent, setMonthlyRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordEmail, setLandlordEmail] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');

  // Own fields
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [lotSize, setLotSize] = useState('');

  const isRent = profile?.type === 'rent';

  useEffect(() => {
    if (currentHousehold?.id) load();
  }, [currentHousehold?.id]);

  const load = async () => {
    if (!currentHousehold) return;
    try {
      const p = await getHomeProfile(currentHousehold.id);
      if (p) {
        setProfile(p);
        if (p.address) setAddress(p.address);
        if (p.monthlyRent) setMonthlyRent(String(p.monthlyRent));
        if (p.securityDeposit) setSecurityDeposit(String(p.securityDeposit));
        if (p.landlordName) setLandlordName(p.landlordName);
        if (p.landlordPhone) setLandlordPhone(p.landlordPhone);
        if (p.landlordEmail) setLandlordEmail(p.landlordEmail);
        if (p.leaseStartDate) setLeaseStartDate(p.leaseStartDate.toISOString().split('T')[0]);
        if (p.leaseEndDate) setLeaseEndDate(p.leaseEndDate.toISOString().split('T')[0]);
        if (p.purchaseDate) setPurchaseDate(p.purchaseDate.toISOString().split('T')[0]);
        if (p.purchasePrice) setPurchasePrice(String(p.purchasePrice));
        if (p.squareFootage) setSquareFootage(String(p.squareFootage));
        if (p.yearBuilt) setYearBuilt(String(p.yearBuilt));
        if (p.lotSize) setLotSize(p.lotSize);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updates: Partial<HomeProfile> = {
        address,
      };

      if (isRent) {
        if (monthlyRent) updates.monthlyRent = Number(monthlyRent);
        if (securityDeposit) updates.securityDeposit = Number(securityDeposit);
        if (landlordName) updates.landlordName = landlordName;
        if (landlordPhone) updates.landlordPhone = landlordPhone;
        if (landlordEmail) updates.landlordEmail = landlordEmail;
        if (leaseStartDate) updates.leaseStartDate = new Date(leaseStartDate);
        if (leaseEndDate) updates.leaseEndDate = new Date(leaseEndDate);
      } else {
        if (purchaseDate) updates.purchaseDate = new Date(purchaseDate);
        if (purchasePrice) updates.purchasePrice = Number(purchasePrice);
        if (squareFootage) updates.squareFootage = Number(squareFootage);
        if (yearBuilt) updates.yearBuilt = Number(yearBuilt);
        if (lotSize) updates.lotSize = lotSize;
      }

      await updateHomeProfile(profile.id, updates);
      Alert.alert('Saved', 'Your home details have been updated.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text>No home profile found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Home Details</Text>
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
          <Text style={styles.sectionTitle}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            value={address.street}
            onChangeText={(t) => setAddress({ ...address, street: t })}
          />
          <TextInput
            style={styles.input}
            placeholder="Apt / Unit (optional)"
            value={address.unit}
            onChangeText={(t) => setAddress({ ...address, unit: t })}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.flex2]}
              placeholder="City"
              value={address.city}
              onChangeText={(t) => setAddress({ ...address, city: t })}
            />
            <TextInput
              style={[styles.input, styles.flex1]}
              placeholder="State"
              value={address.state}
              onChangeText={(t) => setAddress({ ...address, state: t })}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="ZIP code"
            value={address.zip}
            onChangeText={(t) => setAddress({ ...address, zip: t })}
            keyboardType="number-pad"
            maxLength={10}
          />

          {isRent ? (
            <>
              <Text style={styles.sectionTitle}>Lease Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Monthly rent ($)"
                value={monthlyRent}
                onChangeText={setMonthlyRent}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Security deposit ($)"
                value={securityDeposit}
                onChangeText={setSecurityDeposit}
                keyboardType="decimal-pad"
              />
              <Text style={{ fontSize: FontSizes.sm, color: Colors.textTertiary, marginBottom: Spacing.xs }}>Lease start</Text>
              <DateInput value={leaseStartDate} onChange={setLeaseStartDate} placeholder="Lease start date" />
              <View style={{ height: Spacing.md }} />
              <Text style={{ fontSize: FontSizes.sm, color: Colors.textTertiary, marginBottom: Spacing.xs }}>Lease end</Text>
              <DateInput value={leaseEndDate} onChange={setLeaseEndDate} placeholder="Lease end date" />

              <Text style={styles.sectionTitle}>Landlord / Property Manager</Text>
              <TextInput
                style={styles.input}
                placeholder="Landlord name"
                value={landlordName}
                onChangeText={setLandlordName}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                value={landlordPhone}
                onChangeText={setLandlordPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={landlordEmail}
                onChangeText={setLandlordEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Property Details</Text>
              <Text style={{ fontSize: FontSizes.sm, color: Colors.textTertiary, marginBottom: Spacing.xs }}>Purchase date</Text>
              <DateInput value={purchaseDate} onChange={setPurchaseDate} placeholder="Purchase date" maximumDate={new Date()} />
              <View style={{ height: Spacing.md }} />
              <TextInput
                style={styles.input}
                placeholder="Purchase price ($)"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
              />
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.flex1]}
                  placeholder="Sq ft"
                  value={squareFootage}
                  onChangeText={setSquareFootage}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={[styles.input, styles.flex1]}
                  placeholder="Year built"
                  value={yearBuilt}
                  onChangeText={setYearBuilt}
                  keyboardType="number-pad"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Lot size (e.g. 0.25 acres)"
                value={lotSize}
                onChangeText={setLotSize}
              />
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  content: {
    padding: Spacing.lg,
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
});
