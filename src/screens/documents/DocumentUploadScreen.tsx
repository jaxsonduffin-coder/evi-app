// =============================================
// EVI - Document Upload Screen
// Upload documents to Firebase Storage + trigger AI analysis
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { uploadDocument, UploadProgress, getDocumentStats } from '../../services/documentService';
import { analyzeAndUpdateDocument } from '../../services/documentIntelligenceService';
import { DocumentCategory, SUBSCRIPTION_TIERS } from '../../types';
import { Analytics } from '../../services/analyticsService';
import { isOnline } from '../../hooks/useNetworkStatus';

const CATEGORIES: { id: DocumentCategory; label: string; icon: string; color: string }[] = [
  { id: 'home', label: 'Home', icon: 'home', color: '#3B82F6' },
  { id: 'vehicle', label: 'Vehicle', icon: 'car', color: '#EF4444' },
  { id: 'utility', label: 'Utility', icon: 'flash', color: '#F59E0B' },
  { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark', color: '#8B5CF6' },
  { id: 'warranty', label: 'Warranty', icon: 'ribbon', color: '#EC4899' },
  { id: 'receipt', label: 'Receipt', icon: 'receipt', color: '#10B981' },
  { id: 'contract', label: 'Contract', icon: 'document-text', color: '#6366F1' },
  { id: 'identification', label: 'ID / Card', icon: 'card', color: '#DB2777' },
  { id: 'personal', label: 'Personal', icon: 'person', color: '#F97316' },
  { id: 'financial', label: 'Financial', icon: 'wallet', color: '#14B8A6' },
  { id: 'other', label: 'Other', icon: 'folder', color: '#6B7280' },
];

export default function DocumentUploadScreen({ navigation, route }: any) {
  const { userProfile, currentHousehold } = useAuth();
  const preselectedCategory = route?.params?.category as DocumentCategory | undefined;
  const scannedFile = route?.params?.scannedFile as
    | { uri: string; name: string; type: string; size: number }
    | undefined;

  const [pickedFile, setPickedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size: number;
  } | null>(scannedFile || null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(preselectedCategory || 'other');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [pickSource, setPickSource] = useState<'camera' | 'library' | 'scanner'>(
    scannedFile ? 'scanner' : 'library'
  );

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size || 0,
      });
      if (!title) {
        setTitle(asset.name.replace(/\.[^/.]+$/, ''));
      }
      setPickSource('library');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not pick document');
    }
  };

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0,
      });
      setPickSource('library');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: `scan_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: asset.fileSize || 0,
      });
      setPickSource('camera');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not take photo');
    }
  };

  const upload = async () => {
    if (!pickedFile || !userProfile || !currentHousehold) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please give this document a title.');
      return;
    }
    if (!isOnline()) {
      Alert.alert(
        "You're offline",
        'Document uploads need an internet connection. Reconnect and try again.'
      );
      return;
    }

    // Enforce the plan's document/storage limits before uploading. Without
    // this, the "X documents / Y GB" numbers on the pricing page are just
    // marketing copy with nothing backing them — every tier behaves like
    // unlimited, which removes any reason to upgrade for storage.
    const tier = SUBSCRIPTION_TIERS.find((t) => t.id === (userProfile.subscriptionTier || 'free'));
    if (tier) {
      try {
        const stats = await getDocumentStats(currentHousehold.id);
        const maxBytes = tier.maxStorage * 1024 * 1024 * 1024;
        const overCount = stats.totalCount >= tier.maxDocuments;
        const overStorage = stats.totalSize + pickedFile.size > maxBytes;
        if (overCount || overStorage) {
          Alert.alert(
            'Storage limit reached',
            overCount
              ? `Your ${tier.name} plan supports up to ${tier.maxDocuments} documents. Upgrade to store more.`
              : `Your ${tier.name} plan supports up to ${tier.maxStorage} GB of documents. Upgrade for more storage.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Upgrade', onPress: () => navigation.navigate('Paywall', { trigger: 'document_limit' }) },
            ]
          );
          return;
        }
      } catch (e) {
        // If the limit check itself fails (offline blip, etc.), don't block
        // the upload on it — fail open rather than trap the user.
        console.warn('Document limit check failed:', e);
      }
    }

    setUploading(true);
    setProgress(null);
    try {
      const doc = await uploadDocument(
        currentHousehold.id,
        userProfile.id,
        pickedFile,
        { title: title.trim(), category, notes: notes.trim() || undefined },
        (p) => setProgress(p)
      );

      Analytics.documentUploaded(category, pickSource);

      // Fire and forget AI analysis
      analyzeAndUpdateDocument(doc.id, doc.fileURL, pickedFile.type, { category }).catch(console.warn);

      Alert.alert('Uploaded', 'Your document is saved. EVI is analyzing it in the background.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isImage = pickedFile?.type.startsWith('image/');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Upload Document</Text>
        <TouchableOpacity onPress={upload} disabled={!pickedFile || uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={[styles.saveText, !pickedFile && { opacity: 0.4 }]}>Upload</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!pickedFile ? (
          <View style={styles.pickerRow}>
            <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument}>
              <Ionicons name="document-attach" size={32} color={Colors.primary} />
              <Text style={styles.pickerLabel}>File</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={pickImage}>
              <Ionicons name="image" size={32} color={Colors.primary} />
              <Text style={styles.pickerLabel}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pickerBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={32} color={Colors.primary} />
              <Text style={styles.pickerLabel}>Scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.preview}>
            {isImage ? (
              <Image source={{ uri: pickedFile.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewFile}>
                <Ionicons name="document" size={48} color={Colors.primary} />
                <Text style={styles.previewName} numberOfLines={2}>
                  {pickedFile.name}
                </Text>
                <Text style={styles.previewSize}>{formatSize(pickedFile.size)}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => setPickedFile(null)} style={styles.replaceBtn}>
              <Text style={styles.replaceText}>Replace</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2024 Lease Agreement"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.categories}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.categoryChip,
                category === c.id && { backgroundColor: c.color },
              ]}
              onPress={() => setCategory(c.id)}
            >
              <Ionicons
                name={c.icon as any}
                size={16}
                color={category === c.id ? '#fff' : c.color}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  category === c.id && { color: '#fff' },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Any additional info..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress.percent.toFixed(0)}% • {formatSize(progress.bytesTransferred)} of{' '}
              {formatSize(progress.totalBytes)}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  pickerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pickerLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  preview: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
  },
  previewFile: {
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  previewName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  previewSize: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  replaceBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  replaceText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.lg,
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
    color: Colors.textPrimary,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  progressContainer: {
    marginTop: Spacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
