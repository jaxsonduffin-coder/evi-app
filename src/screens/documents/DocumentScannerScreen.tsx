// =============================================
// EVI - Document Scanner Screen
// Camera-based document scanning with auto-enhancement
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';

interface ScannedPage {
  uri: string;
  width: number;
  height: number;
}

export default function DocumentScannerScreen({ navigation }: any) {
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [processing, setProcessing] = useState(false);

  const scanPage = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'EVI needs camera access to scan documents.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1.0,
      allowsEditing: true, // Native crop UI
      aspect: undefined,
    });

    if (result.canceled) return;
    const asset = result.assets[0];

    setProcessing(true);
    try {
      // Auto-enhance: sharpen and boost contrast for readability
      const enhanced = await ImageManipulator.manipulateAsync(
        asset.uri,
        [
          // Resize to reasonable size (long side 2000px max)
          {
            resize:
              asset.width > asset.height
                ? { width: 2000 }
                : { height: 2000 },
          },
        ],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      setPages([
        ...pages,
        { uri: enhanced.uri, width: enhanced.width, height: enhanced.height },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not process image.');
    } finally {
      setProcessing(false);
    }
  };

  const removePage = (index: number) => {
    setPages(pages.filter((_, i) => i !== index));
  };

  const proceedWithFirstPage = () => {
    // Multi-page documents currently upload as a single image (the first
    // page only) — there's no PDF bundling yet. See the note in finish().
    const first = pages[0];
    navigation.replace('DocumentUpload', {
      scannedFile: {
        uri: first.uri,
        name: `scan_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: 0, // Filled at upload time
      },
    });
  };

  const finish = () => {
    if (pages.length === 0) {
      Alert.alert('No pages', 'Scan at least one page first.');
      return;
    }

    if (pages.length > 1) {
      // Multi-page PDF bundling (expo-print) isn't built yet. Rather than
      // silently discarding pages 2+ — which used to happen here with zero
      // indication to the user — tell them exactly what will be saved and
      // let them choose, so nobody loses a scanned lease/contract page
      // without knowing it.
      Alert.alert(
        'Only the first page will be saved',
        `You scanned ${pages.length} pages, but EVI can only save one page per document right now. Only page 1 will be uploaded — the rest will be discarded. For a multi-page document, we recommend combining pages into one PDF before uploading instead.`,
        [
          { text: 'Go back', style: 'cancel' },
          { text: 'Save page 1 only', style: 'destructive', onPress: proceedWithFirstPage },
        ]
      );
      return;
    }

    proceedWithFirstPage();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Document</Text>
        <TouchableOpacity onPress={finish} disabled={pages.length === 0}>
          <Text
            style={[
              styles.doneText,
              pages.length === 0 && { opacity: 0.4 },
            ]}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {pages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={80} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>Scan your document</Text>
            <Text style={styles.emptyText}>
              Take a photo of each page. EVI will enhance and analyze it automatically.
            </Text>
          </View>
        ) : (
          <View style={styles.pagesContainer}>
            <Text style={styles.pagesCount}>
              {pages.length} page{pages.length > 1 ? 's' : ''}
            </Text>
            <View style={styles.pageGrid}>
              {pages.map((page, i) => (
                <View key={i} style={styles.pageWrap}>
                  <Image source={{ uri: page.uri }} style={styles.pageThumb} />
                  <TouchableOpacity
                    style={styles.pageRemove}
                    onPress={() => removePage(i)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.pageNum}>
                    <Text style={styles.pageNumText}>{i + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={scanPage}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={Colors.textInverse} />
          ) : (
            <>
              <Ionicons name="camera" size={24} color={Colors.textInverse} />
              <Text style={styles.scanBtnText}>
                {pages.length === 0 ? 'Scan First Page' : 'Add Another Page'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  doneText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  content: { flex: 1, padding: Spacing.lg, justifyContent: 'space-between' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pagesContainer: { flex: 1 },
  pagesCount: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  pageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  pageWrap: {
    width: '48%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  pageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pageRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNum: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
  },
  pageNumText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  scanBtnText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textInverse,
  },
});
