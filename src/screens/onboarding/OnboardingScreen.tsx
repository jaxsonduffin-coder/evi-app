// =============================================
// EVI - Onboarding Screen (Household Setup)
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { createHousehold } from '../../services/householdService';

type HouseholdType = 'rent' | 'own' | 'other';

export default function OnboardingScreen({ navigation }: any) {
  const { firebaseUser, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [householdName, setHouseholdName] = useState('');
  const [householdType, setHouseholdType] = useState<HouseholdType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateHousehold = async () => {
    if (!householdName.trim() || !householdType) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await createHousehold(
        firebaseUser!.uid,
        firebaseUser!.displayName || 'User',
        householdName.trim(),
        householdType
      );
      await refreshProfile();
      // Navigation handled by AuthContext
    } catch (error) {
      console.error('Error creating household:', error);
      Alert.alert('Error', 'Could not create household. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions: { type: HouseholdType; icon: keyof typeof Ionicons.glyphMap; label: string; desc: string }[] = [
    {
      type: 'rent',
      icon: 'key-outline',
      label: 'I Rent',
      desc: 'Apartment, house, or condo',
    },
    {
      type: 'own',
      icon: 'home-outline',
      label: 'I Own',
      desc: 'House, condo, or townhome',
    },
    {
      type: 'other',
      icon: 'people-outline',
      label: 'Other',
      desc: 'Living with family, etc.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {step === 1 ? (
          // Step 1: What's your situation?
          <View style={styles.stepContent}>
            <Text style={styles.welcomeText}>
              Welcome to EVI{firebaseUser?.displayName ? `, ${firebaseUser.displayName.split(' ')[0]}` : ''}!
            </Text>
            <Text style={styles.stepTitle}>What's your living situation?</Text>
            <Text style={styles.stepSubtitle}>
              This helps EVI personalize your experience
            </Text>

            <View style={styles.typeOptions}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  style={[
                    styles.typeCard,
                    householdType === option.type && styles.typeCardSelected,
                  ]}
                  onPress={() => setHouseholdType(option.type)}
                >
                  <Ionicons
                    name={option.icon}
                    size={32}
                    color={householdType === option.type ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      householdType === option.type && styles.typeLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={styles.typeDesc}>{option.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.nextButton, !householdType && styles.nextButtonDisabled]}
              onPress={() => householdType && setStep(2)}
              disabled={!householdType}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.joinLink}
              onPress={() => navigation.navigate('JoinHousehold')}
            >
              <Text style={styles.joinLinkText}>Have an invite code? Join a household instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Step 2: Name your household
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Name your household</Text>
            <Text style={styles.stepSubtitle}>
              This is how your home will appear in EVI
            </Text>

            <View style={styles.nameInputWrapper}>
              <Ionicons name="home" size={24} color={Colors.primary} />
              <TextInput
                style={styles.nameInput}
                placeholder="e.g. Our Apartment, Smith Home..."
                placeholderTextColor={Colors.textTertiary}
                value={householdName}
                onChangeText={setHouseholdName}
                autoFocus
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep(1)}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!householdName.trim() || loading) && styles.nextButtonDisabled,
                ]}
                onPress={handleCreateHousehold}
                disabled={!householdName.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.textInverse} />
                ) : (
                  <Text style={styles.createButtonText}>Create Household</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 2,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  welcomeText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  stepTitle: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  typeOptions: {
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  typeCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  typeLabel: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  typeLabelSelected: {
    color: Colors.primary,
  },
  typeDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    flex: 1,
    textAlign: 'right',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  joinLink: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  joinLinkText: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  nameInput: {
    flex: 1,
    paddingVertical: Spacing.lg,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  createButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  createButtonText: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
});
