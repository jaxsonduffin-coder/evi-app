// =============================================
// EVI - Household Members Screen
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { HouseholdMember, SUBSCRIPTION_TIERS } from '../../types';
import { createHouseholdInvite, buildInviteLink } from '../../services/inviteService';
import { removeMemberFromHousehold } from '../../services/householdService';

export default function MembersScreen({ navigation }: any) {
  const { userProfile, currentHousehold, refreshProfile } = useAuth();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const myRole = currentHousehold?.members?.find((m) => m.userId === userProfile?.id)?.role;
  const isOwner = myRole === 'owner';
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentTier = SUBSCRIPTION_TIERS.find(
    (t) => t.id === (userProfile?.subscriptionTier || 'free')
  );

  const memberCount = currentHousehold?.members?.length || 0;
  const canAddMore = memberCount < (currentTier?.maxMembers || 1);

  const handleInvite = async () => {
    if (!canAddMore) {
      Alert.alert(
        'Upgrade needed',
        `Your ${currentTier?.name} plan supports ${currentTier?.maxMembers} member${currentTier?.maxMembers === 1 ? '' : 's'}. Upgrade to Household to add up to 10 members.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Paywall') },
        ]
      );
      return;
    }
    if (!currentHousehold?.id) return;

    setGeneratingInvite(true);
    try {
      const { code } = await createHouseholdInvite(currentHousehold.id);
      setInviteCode(code);
      setShowInviteModal(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not create an invite code.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleShare = async () => {
    if (!inviteCode) return;
    try {
      await Share.share({
        message: `Join our household "${currentHousehold?.name}" on EVI! Open the app and enter code ${inviteCode}, or tap: ${buildInviteLink(inviteCode)}`,
      });
    } catch {}
  };

  const handleRemove = (member: HouseholdMember) => {
    const isSelf = member.userId === userProfile?.id;
    if (!isSelf && !isOwner) return; // only the owner can remove someone else
    if (member.role === 'owner') {
      Alert.alert('Can’t remove owner', 'The household owner can’t be removed. Transfer ownership isn’t supported yet.');
      return;
    }

    Alert.alert(
      isSelf ? 'Leave household' : `Remove ${member.displayName}`,
      isSelf
        ? 'You’ll lose access to this household’s documents, tasks, and vault.'
        : `${member.displayName} will lose access to this household's documents, tasks, and vault.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isSelf ? 'Leave' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!currentHousehold?.id) return;
            setRemovingId(member.userId);
            try {
              await removeMemberFromHousehold(currentHousehold.id, member.userId);
              await refreshProfile();
              if (isSelf) navigation.goBack();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not remove member.');
            } finally {
              setRemovingId(null);
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: HouseholdMember }) => {
    const isSelf = item.userId === userProfile?.id;
    const canManage = (isSelf || isOwner) && item.role !== 'owner';
    return (
      <View style={styles.memberCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.displayName}
            {isSelf && ' (You)'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={[styles.roleText, item.role === 'owner' && styles.roleOwner]}>
              {item.role}
            </Text>
          </View>
        </View>
        {canManage && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => handleRemove(item)}
            disabled={removingId === item.userId}
          >
            {removingId === item.userId ? (
              <ActivityIndicator size="small" color={Colors.urgent} />
            ) : (
              <Text style={styles.removeBtnText}>{isSelf ? 'Leave' : 'Remove'}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Members</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleInvite} disabled={generatingInvite}>
          {generatingInvite ? (
            <ActivityIndicator size="small" color={Colors.textInverse} />
          ) : (
            <Ionicons name="person-add" size={20} color={Colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.planCard}>
        <Ionicons name="information-circle" size={20} color={Colors.info} />
        <Text style={styles.planText}>
          {currentTier?.name} plan: {memberCount} of {currentTier?.maxMembers} members
        </Text>
      </View>

      <FlatList
        data={currentHousehold?.members || []}
        renderItem={renderMember}
        keyExtractor={(m) => m.userId}
        contentContainerStyle={styles.list}
      />

      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="people-circle-outline" size={48} color={Colors.primary} />
            <Text style={styles.modalTitle}>Invite a member</Text>
            <Text style={styles.modalSubtitle}>
              Share this code — it&apos;s valid for 7 days and can be used once.
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{inviteCode}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={Colors.textInverse} />
              <Text style={styles.shareButtonText}>Share invite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  title: { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.info + '10',
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  planText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  list: { padding: Spacing.lg },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
  memberInfo: { flex: 1 },
  memberName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  roleBadge: {
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
  },
  roleOwner: {
    color: Colors.primary,
  },
  removeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  removeBtnText: {
    color: Colors.urgent,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  codeBox: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  codeText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    width: '100%',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  modalCloseButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  modalCloseText: {
    color: Colors.textTertiary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
