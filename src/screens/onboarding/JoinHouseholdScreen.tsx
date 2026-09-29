// =============================================
// EVI - Join Household Screen
// Redeem an invite code to join an existing household
// =============================================

import React, { useEffect, useState } from 'react';
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
import { joinHouseholdByCode } from '../../services/inviteService';

export default function JoinHouseholdScreen({ navigation, route }: any) {
  const { refreshProfile } = useAuth();
  const [code, setCode] = useState<string>(route?.params?.code || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we arrived via a deep link with a code already filled in, let the
    // person confirm rather than auto-submitting.
  }, []);

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert('Enter a code', 'Please enter the invite code you were given.');
      return;
    }
    setLoading(true);
    try {
      const result = await joinHouseholdByCode(code);
      await refreshProfile();
      if (result.alreadyMember) {
        Alert.alert('Already a member', "You're already part of this household.");
      } else {
        Alert.alert('Welcome!', `You've joined ${result.householdName || 'the household'}.`);
      }
      // Navigation to Main happens automatically once userProfile.onboardingComplete is true
    } catch (e: any) {
      Alert.alert('Could not join', e.message || 'That code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <Ionicons name="people-circle-outline" size={56} color={Colors.primary} style={{ marginBottom: Spacing.lg }} />
        <Text style={styles.title}>Join a household</Text>
        <Text style={styles.subtitle}>
          Enter the invite code a household member shared with you.
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="ABC123"
            placeholderTextColor={Colors.textTertiary}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.joinButton, (!code.trim() || loading) && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={!code.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <Text style={styles.joinButtonText}>Join Household</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxxl,
  },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xxl,
  },
  input: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: 6,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
});
