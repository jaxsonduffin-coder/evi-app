// =============================================
// EVI - DateInput
// Wraps @react-native-community/datetimepicker as a text-input-like button
// =============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';

interface Props {
  value: string; // ISO date string YYYY-MM-DD or empty
  onChange: (val: string) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DateInput({ value, onChange, placeholder, minimumDate, maximumDate }: Props) {
  const [showing, setShowing] = useState(false);

  const asDate = value ? new Date(value + 'T00:00:00') : new Date();
  const display = value
    ? asDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : placeholder || 'Select date';

  const isPlaceholder = !value;

  const onChangePicker = (_event: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowing(false);
    }
    if (selected) {
      const iso = selected.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setShowing(true)}>
        <Text style={[styles.text, isPlaceholder && styles.placeholder]}>{display}</Text>
      </TouchableOpacity>

      {showing && Platform.OS === 'android' && (
        <DateTimePicker
          value={asDate}
          mode="date"
          display="default"
          onChange={onChangePicker}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {showing && Platform.OS === 'ios' && (
        <Modal transparent animationType="fade" visible={showing}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setShowing(false)}
          >
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={() => setShowing(false)}>
                  <Text style={styles.sheetAction}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowing(false)}>
                  <Text style={[styles.sheetAction, { color: Colors.primary, fontWeight: '700' }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={asDate}
                mode="date"
                display="spinner"
                onChange={(_e, d) => d && onChange(d.toISOString().split('T')[0])}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={Colors.textPrimary}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  text: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetAction: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
});
