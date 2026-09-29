// =============================================
// EVI - Document Detail Screen
// View a document's AI-extracted summary, key dates & amounts,
// open the original file, edit notes/tags, or delete it.
// =============================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { HouseholdDocument, DocumentSubcategory } from '../../types';
import { getDocument, updateDocument, deleteDocument } from '../../services/documentService';

const SUBCATEGORY_LABELS: Partial<Record<DocumentSubcategory, string>> = {
  drivers_license: "Driver's License",
  passport: 'Passport',
  state_id: 'State ID',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  vehicle_registration: 'Vehicle Registration',
  social_security_card: 'Social Security Card',
  lease: 'Lease',
  mortgage: 'Mortgage',
  inspection: 'Inspection',
  insurance: 'Insurance',
  warranty: 'Warranty',
  repair: 'Repair',
  contractor: 'Contractor',
  registration: 'Registration',
  maintenance: 'Maintenance',
  purchase: 'Purchase',
  employment: 'Employment',
  school: 'School',
  tax: 'Tax',
  other: 'Other',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function daysUntil(date: Date): number {
  const now = new Date();
  const d = new Date(date);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DocumentDetailScreen({ route, navigation }: any) {
  const { documentId } = route.params;
  const [document, setDocument] = useState<HouseholdDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDocument(documentId).then((doc) => {
      if (cancelled) return;
      setDocument(doc);
      setNotesDraft(doc?.notes || '');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const handleOpenFile = () => {
    if (!document?.fileURL) return;
    Linking.openURL(document.fileURL).catch(() => {
      Alert.alert('Could not open file', 'The file link may have expired.');
    });
  };

  const handleSaveNotes = async () => {
    if (!document) return;
    setSavingNotes(true);
    try {
      await updateDocument(document.id, { notes: notesDraft });
      setDocument({ ...document, notes: notesDraft });
      setEditingNotes(false);
    } catch (e) {
      Alert.alert('Could not save notes', 'Please try again.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = () => {
    if (!document) return;
    Alert.alert(
      'Delete this document?',
      `"${document.title}" will be permanently removed from your vault.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteDocument(document.id);
              navigation.goBack();
            } catch (e) {
              setDeleting(false);
              Alert.alert('Could not delete', 'Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="document-text-outline" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>Document not found</Text>
          <Text style={styles.emptySubtitle}>It may have been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const subcategoryLabel = document.subcategory
    ? SUBCATEGORY_LABELS[document.subcategory] || document.subcategory
    : undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {document.title}
        </Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color={Colors.urgent} />
          ) : (
            <Ionicons name="trash-outline" size={22} color={Colors.urgent} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title & meta card */}
        <View style={styles.card}>
          <View style={styles.docIconRow}>
            <View style={styles.docIconWrap}>
              <Ionicons name="document-text" size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>{document.title}</Text>
              <Text style={styles.docMeta}>
                {subcategoryLabel ? `${subcategoryLabel} · ` : ''}
                {formatFileSize(document.fileSize)} · {document.createdAt.toLocaleDateString()}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.openButton} onPress={handleOpenFile}>
            <Ionicons name="open-outline" size={18} color={Colors.primary} />
            <Text style={styles.openButtonText}>Open original file</Text>
          </TouchableOpacity>
        </View>

        {/* AI Summary */}
        {document.summary ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="sparkles" size={18} color={Colors.secondary} />
              <Text style={styles.cardHeaderText}>AI Summary</Text>
            </View>
            <Text style={styles.summaryText}>{document.summary}</Text>
          </View>
        ) : null}

        {/* Key Dates */}
        {document.keyDates && document.keyDates.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="calendar" size={18} color={Colors.warning} />
              <Text style={styles.cardHeaderText}>Key Dates</Text>
            </View>
            {document.keyDates.map((d, i) => {
              const days = daysUntil(d.date);
              const isPast = days < 0;
              const isSoon = !isPast && days <= 30;
              return (
                <View key={i} style={styles.dateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dateLabel}>{d.label}</Text>
                    <Text style={styles.dateValue}>
                      {new Date(d.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  {d.isDeadline ? (
                    <View
                      style={[
                        styles.dateBadge,
                        isPast
                          ? styles.dateBadgeUrgent
                          : isSoon
                          ? styles.dateBadgeWarning
                          : styles.dateBadgeGood,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateBadgeText,
                          isPast
                            ? styles.dateBadgeTextUrgent
                            : isSoon
                            ? styles.dateBadgeTextWarning
                            : styles.dateBadgeTextGood,
                        ]}
                      >
                        {isPast ? 'Expired' : isSoon ? `${days}d left` : 'Upcoming'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Key Amounts */}
        {document.keyAmounts && document.keyAmounts.length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="cash" size={18} color={Colors.good} />
              <Text style={styles.cardHeaderText}>Key Amounts</Text>
            </View>
            {document.keyAmounts.map((a, i) => (
              <View key={i} style={styles.amountRow}>
                <Text style={styles.dateLabel}>{a.label}</Text>
                <Text style={styles.amountValue}>
                  {a.currency === 'USD' ? '$' : `${a.currency} `}
                  {a.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Extracted data (misc key/value) */}
        {document.extractedData && Object.keys(document.extractedData).length > 0 ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="list" size={18} color={Colors.info} />
              <Text style={styles.cardHeaderText}>Extracted Details</Text>
            </View>
            {Object.entries(document.extractedData).map(([key, value]) => (
              <View key={key} style={styles.amountRow}>
                <Text style={styles.dateLabel}>{key}</Text>
                <Text style={styles.dateValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Notes (editable) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="create-outline" size={18} color={Colors.textSecondary} />
            <Text style={styles.cardHeaderText}>Notes</Text>
            {!editingNotes ? (
              <TouchableOpacity onPress={() => setEditingNotes(true)} style={styles.editNotesButton}>
                <Text style={styles.editNotesButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {editingNotes ? (
            <>
              <TextInput
                style={styles.notesInput}
                value={notesDraft}
                onChangeText={setNotesDraft}
                multiline
                placeholder="Add a note about this document..."
                placeholderTextColor={Colors.textTertiary}
              />
              <View style={styles.notesActionRow}>
                <TouchableOpacity
                  style={styles.notesCancelButton}
                  onPress={() => {
                    setNotesDraft(document.notes || '');
                    setEditingNotes(false);
                  }}
                >
                  <Text style={styles.notesCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.notesSaveButton}
                  onPress={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? (
                    <ActivityIndicator size="small" color={Colors.textInverse} />
                  ) : (
                    <Text style={styles.notesSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.notesText}>
              {document.notes && document.notes.trim().length > 0
                ? document.notes
                : 'No notes yet.'}
            </Text>
          )}
        </View>

        {document.tags && document.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {document.tags.map((t) => (
              <View key={t} style={styles.tagChip}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    padding: Spacing.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginHorizontal: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  docIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  docIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  docTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
  },
  openButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  summaryText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  dateLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  dateBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  dateBadgeUrgent: { backgroundColor: Colors.urgent + '15' },
  dateBadgeWarning: { backgroundColor: Colors.warning + '15' },
  dateBadgeGood: { backgroundColor: Colors.good + '15' },
  dateBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  dateBadgeTextUrgent: { color: Colors.urgent },
  dateBadgeTextWarning: { color: Colors.warning },
  dateBadgeTextGood: { color: Colors.good },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  amountValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  editNotesButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  editNotesButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  notesText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  notesInput: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  notesActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  notesCancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  notesCancelText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  notesSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minWidth: 64,
    alignItems: 'center',
  },
  notesSaveText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textInverse,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tagChip: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
