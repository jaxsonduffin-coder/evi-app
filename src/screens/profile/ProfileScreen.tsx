// =============================================
// EVI - Profile & Settings Screen
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { logOut, updateUserDisplayName } from '../../services/authService';
import { SUBSCRIPTION_TIERS } from '../../types';

export default function ProfileScreen({ navigation }: any) {
  const { userProfile, currentHousehold, refreshProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const openEditName = () => {
    setNameDraft(userProfile?.displayName || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameDraft.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    setSavingName(true);
    try {
      await updateUserDisplayName(nameDraft.trim());
      await refreshProfile();
      setEditingName(false);
    } catch (e) {
      Alert.alert('Could not update name', 'Please try again.');
    } finally {
      setSavingName(false);
    }
  };

  const currentTier = SUBSCRIPTION_TIERS.find(
    (t) => t.id === (userProfile?.subscriptionTier || 'free')
  );

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logOut();
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const menuSections = [
    {
      title: 'Household',
      items: [
        { icon: 'home-outline', label: 'Home Details', subtitle: 'Edit your home profile', route: 'HomeDetails' },
        { icon: 'people-outline', label: 'Members', subtitle: `${currentHousehold?.members?.length || 1} member(s)`, route: 'Members' },
        { icon: 'car-outline', label: 'Vehicles', subtitle: 'Manage vehicles', route: 'Vehicles' },
        { icon: 'hardware-chip-outline', label: 'Appliances', subtitle: 'Track your appliances', route: 'Appliances' },
        { icon: 'flash-outline', label: 'Utilities', subtitle: 'Providers and bills', route: 'Utilities' },
        { icon: 'gift-outline', label: 'Important Dates', subtitle: 'Birthdays & anniversaries', route: 'ImportantDates' },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: 'star-outline', label: 'Subscription', subtitle: `${currentTier?.name} Plan - $${currentTier?.price}/mo`, route: 'Paywall' },
        { icon: 'gift-outline', label: 'Invite Friends', subtitle: 'Get a free month for each', route: 'Referrals' },
        { icon: 'notifications-outline', label: 'Notifications', subtitle: 'Manage alerts', route: null },
        { icon: 'shield-checkmark-outline', label: 'Privacy & Security', subtitle: 'Data, delete account, export', route: 'PrivacySecurity' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', subtitle: 'FAQ & guides', route: null },
        { icon: 'chatbox-outline', label: 'Contact Support', subtitle: 'Get help', route: null },
        { icon: 'star-outline', label: 'Rate EVI', subtitle: 'Leave a review', route: null },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{userProfile?.email}</Text>
          </View>
          <TouchableOpacity onPress={openEditName}>
            <Ionicons name="create-outline" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <Modal visible={editingName} transparent animationType="fade" onRequestClose={() => setEditingName(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit name</Text>
              <TextInput
                style={styles.modalInput}
                value={nameDraft}
                onChangeText={setNameDraft}
                placeholder="Your name"
                placeholderTextColor={Colors.textTertiary}
                autoFocus
              />
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditingName(false)}
                  disabled={savingName}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveName}
                  disabled={savingName}
                >
                  {savingName ? (
                    <ActivityIndicator size="small" color={Colors.textInverse} />
                  ) : (
                    <Text style={styles.modalSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Subscription Banner */}
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => navigation.navigate('Paywall')}
        >
          <View style={styles.subBannerLeft}>
            <Ionicons name="diamond-outline" size={24} color={Colors.accent} />
            <View>
              <Text style={styles.subBannerTitle}>
                {currentTier?.id === 'free' ? 'Upgrade to Solo' : `${currentTier?.name} Plan`}
              </Text>
              <Text style={styles.subBannerSubtitle}>
                {currentTier?.id === 'free'
                  ? 'Unlock AI document intelligence & more'
                  : currentTier?.description}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => item.route && navigation.navigate(item.route)}
                  style={[
                    styles.menuItem,
                    index < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                >
                  <Ionicons
                    name={item.icon as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={Colors.primary}
                  />
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.urgent} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>EVI v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  subBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  subBannerTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  subBannerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuSection: {
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  menuSectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  menuItemSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.urgent + '10',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.urgent,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  modalInput: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalCancelButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalCancelText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  modalSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minWidth: 72,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textInverse,
  },
});
