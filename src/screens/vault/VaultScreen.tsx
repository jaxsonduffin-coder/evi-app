// =============================================
// EVI - Document Vault Screen
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { DocumentCategory, HouseholdDocument, SUBSCRIPTION_TIERS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getHouseholdDocuments, searchDocuments } from '../../services/documentService';
import { useFocusEffect } from '@react-navigation/native';
import { useDebounce } from '../../hooks/useDebounce';

interface VaultCategory {
  id: DocumentCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  color: string;
}

const VAULT_CATEGORIES: VaultCategory[] = [
  { id: 'home', label: 'Home', icon: 'home-outline', count: 0, color: Colors.primary },
  { id: 'vehicle', label: 'Vehicles', icon: 'car-outline', count: 0, color: '#8B5CF6' },
  { id: 'utility', label: 'Utilities', icon: 'flash-outline', count: 0, color: '#F59E0B' },
  { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', count: 0, color: '#10B981' },
  { id: 'warranty', label: 'Warranties', icon: 'ribbon-outline', count: 0, color: '#EC4899' },
  { id: 'receipt', label: 'Receipts', icon: 'receipt-outline', count: 0, color: '#6366F1' },
  { id: 'contract', label: 'Contracts', icon: 'document-text-outline', count: 0, color: '#14B8A6' },
  { id: 'identification', label: 'ID & Cards', icon: 'card-outline', count: 0, color: '#DB2777' },
  { id: 'personal', label: 'Personal', icon: 'person-outline', count: 0, color: '#F97316' },
  { id: 'financial', label: 'Financial', icon: 'wallet-outline', count: 0, color: '#059669' },
  { id: 'other', label: 'Other', icon: 'folder-outline', count: 0, color: '#6B7280' },
];

export default function VaultScreen({ navigation }: any) {
  const { currentHousehold, userProfile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [documents, setDocuments] = useState<HouseholdDocument[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HouseholdDocument[] | null>(null);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const load = useCallback(async () => {
    if (!currentHousehold?.id) return;
    try {
      const docs = await getHouseholdDocuments(currentHousehold.id);
      setDocuments(docs);
    } catch (e) {
      console.warn('Vault load error:', e);
    }
  }, [currentHousehold?.id]);

  // Reload on tab focus (so newly uploaded docs show immediately)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Run search whenever the debounced query changes
  useEffect(() => {
    if (!currentHousehold?.id) return;
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchDocuments(currentHousehold.id, trimmed)
      .then((results) => {
        if (!cancelled) setSearchResults(results);
      })
      .catch((e) => console.warn('Vault search error:', e))
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, currentHousehold?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const closeSearch = () => {
    setSearchActive(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  // Count docs per category
  const categoryCounts: Record<string, number> = {};
  for (const d of documents) categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;

  const isSearching = searchActive && searchQuery.trim().length > 0;

  const baseDocs = isSearching ? searchResults ?? [] : documents;

  const filteredDocs =
    !isSearching && selectedCategory
      ? baseDocs.filter((d) => d.category === selectedCategory)
      : baseDocs;

  const handleUpload = () => {
    navigation.navigate('DocumentUpload', {
      category: selectedCategory || undefined,
    });
  };

  const currentTier = SUBSCRIPTION_TIERS.find(
    (t) => t.id === (userProfile?.subscriptionTier || 'free')
  );
  const docCount = documents.length;
  const docLimit = currentTier?.maxDocuments ?? 10;
  const nearLimit = docLimit > 0 && docCount / docLimit >= 0.8;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Household Vault</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your documents..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onFocus={() => setSearchActive(true)}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searching ? (
          <ActivityIndicator size="small" color={Colors.textTertiary} />
        ) : searchQuery.length > 0 || searchActive ? (
          <TouchableOpacity onPress={closeSearch}>
            <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {nearLimit && !isSearching && (
        <TouchableOpacity
          style={styles.usageBanner}
          onPress={() => navigation.navigate('Paywall', { trigger: 'vault_usage' })}
        >
          <Ionicons name="cloud-outline" size={16} color={Colors.warning} />
          <Text style={styles.usageBannerText}>
            {docCount} of {docLimit} documents used on your {currentTier?.name} plan
          </Text>
          <Text style={styles.usageBannerLink}>Upgrade</Text>
        </TouchableOpacity>
      )}

      {/* Categories Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {!isSearching && (
          <>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.categoryGrid}>
              {VAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.id && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(
                    selectedCategory === cat.id ? null : cat.id
                  )}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                    <Ionicons name={cat.icon} size={28} color={cat.color} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.label}</Text>
                  <Text style={styles.categoryCount}>{categoryCounts[cat.id] || 0} docs</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Documents list */}
        <Text style={styles.sectionTitle}>
          {isSearching
            ? `Results for "${searchQuery.trim()}"`
            : selectedCategory
            ? `${VAULT_CATEGORIES.find((c) => c.id === selectedCategory)?.label} Documents`
            : 'All Documents'}
        </Text>

        {filteredDocs.length === 0 ? (
          isSearching ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No matches found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different word, or search by title, tag, or category.
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySubtitle}>
                Upload your first document and EVI will automatically organize and analyze it for you.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleUpload}>
                <Ionicons name="cloud-upload-outline" size={20} color={Colors.textInverse} />
                <Text style={styles.emptyButtonText}>Upload Document</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          filteredDocs.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.docRow}
              onPress={() => navigation.navigate('DocumentDetail', { documentId: doc.id })}
            >
              <View style={styles.docIconWrap}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {doc.title}
                </Text>
                <Text style={styles.docMeta}>
                  {doc.category} · {(doc.fileSize / 1024).toFixed(0)}KB · {doc.createdAt.toLocaleDateString()}
                </Text>
                {doc.summary ? (
                  <Text style={styles.docSummary} numberOfLines={2}>
                    {doc.summary}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  uploadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  searchText: {
    fontSize: FontSizes.md,
    color: Colors.textTertiary,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  usageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '12',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  usageBannerText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  usageBannerLink: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.warning,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  categoryCard: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: Colors.primary,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  categoryCount: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  docIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: { flex: 1 },
  docTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  docMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  docSummary: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  emptyButtonText: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
