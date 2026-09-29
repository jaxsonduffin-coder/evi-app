// =============================================
// EVI - Checklists Screen
// Browse guided checklists (Move-In, Move-Out, Adulting 101)
// =============================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { CHECKLIST_TEMPLATES } from '../../data/checklistTemplates';

export default function ChecklistsScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checklists</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Guided checklists that turn into real tasks and reminders in EVI — pick one to get started.
        </Text>

        {CHECKLIST_TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.card}
            onPress={() => navigation.navigate('ChecklistDetail', { templateId: template.id })}
          >
            <View style={[styles.iconWrap, { backgroundColor: template.color + '18' }]}>
              <Ionicons name={template.icon as any} size={26} color={template.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{template.title}</Text>
              <Text style={styles.cardSubtitle}>{template.subtitle}</Text>
              <Text style={styles.cardMeta}>{template.items.length} steps</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  intro: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: FontSizes.xs, color: Colors.textTertiary, marginTop: 6, fontWeight: FontWeights.medium },
});
