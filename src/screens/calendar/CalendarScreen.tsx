// =============================================
// EVI - Calendar Screen
// =============================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '../../theme/colors';
import { format, addDays, startOfWeek, isSameDay, addMonths, subMonths } from 'date-fns';
import { CalendarEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getEventsForMonth } from '../../services/eventService';
import { getImportantDatesForMonth } from '../../services/importantDateService';

const CATEGORY_COLORS: Record<string, string> = {
  maintenance: '#F59E0B',
  appointment: '#3B82F6',
  deadline: '#EF4444',
  bill: '#10B981',
  renewal: '#8B5CF6',
  reminder: '#EC4899',
  other: '#6B7280',
  birthday: '#EC4899',
  anniversary: '#F59E0B',
};

// Important dates are shown alongside calendar events but come from a
// separate collection, so we normalize them into the same shape for
// rendering (day dots, day list, upcoming list).
interface DisplayEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  category: string;
  isRecurring: boolean;
  recurringRule?: string;
  isImportantDate?: boolean;
}

export default function CalendarScreen({ navigation }: any) {
  const { currentHousehold } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [importantDateEvents, setImportantDateEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!currentHousehold?.id) return;
      setLoading(true);
      try {
        const [monthEvents, monthImportantDates] = await Promise.all([
          getEventsForMonth(currentHousehold.id, currentMonth.getFullYear(), currentMonth.getMonth()),
          getImportantDatesForMonth(currentHousehold.id, currentMonth.getFullYear(), currentMonth.getMonth()),
        ]);
        setEvents(monthEvents);
        setImportantDateEvents(
          monthImportantDates.map((d) => ({
            id: `date_${d.id}`,
            title:
              d.type === 'other' && d.label
                ? `${d.personName} — ${d.label}`
                : d.type === 'birthday'
                ? `${d.personName}'s Birthday${d.turningAge ? ` (${d.turningAge})` : ''}`
                : `${d.personName}'s Anniversary${d.turningAge ? ` (${d.turningAge} yrs)` : ''}`,
            description: d.notes,
            startDate: d.occurrenceDate,
            category: d.type,
            isRecurring: true,
            recurringRule: 'yearly',
            isImportantDate: true,
          }))
        );
      } catch (e) {
        console.warn('Calendar load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentHousehold?.id, currentMonth]);

  const allEvents: DisplayEvent[] = useMemo(
    () => [...events, ...importantDateEvents],
    [events, importantDateEvents]
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1));
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, [currentMonth]);

  // Events for selected date
  const selectedDateEvents = allEvents.filter((e) =>
    isSameDay(e.startDate, selectedDate)
  );

  // Upcoming events
  const upcomingEvents = allEvents
    .filter((e) => e.startDate >= new Date())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 5);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('AddTask', {
              selectedDate: format(selectedDate, 'yyyy-MM-dd'),
            })
          }
        >
          <Ionicons name="add" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <Ionicons name="chevron-forward" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Day Names */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((day) => (
            <Text key={day} style={styles.dayName}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(day, new Date());
            const isSelected = isSameDay(day, selectedDate);
            const dayEvents = allEvents.filter((e) => isSameDay(e.startDate, day));

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={[
                  styles.dayNumber,
                  !isCurrentMonth && styles.dayNumberOther,
                  isSelected && styles.dayNumberSelected,
                  isToday && !isSelected && styles.dayNumberToday,
                ]}>
                  {day.getDate()}
                </Text>
                {dayEvents.length > 0 && (
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <View
                        key={i}
                        style={[styles.eventDot, { backgroundColor: CATEGORY_COLORS[e.category] }]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Date Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsSectionTitle}>
            {isSameDay(selectedDate, new Date())
              ? 'Today'
              : format(selectedDate, 'EEEE, MMM d')}
          </Text>

          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventColorBar, { backgroundColor: CATEGORY_COLORS[event.category] }]} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.description && (
                    <Text style={styles.eventDesc}>{event.description}</Text>
                  )}
                  <View style={styles.eventMeta}>
                    <Text style={[styles.eventCategory, { color: CATEGORY_COLORS[event.category] }]}>
                      {event.category}
                    </Text>
                    {event.isRecurring && (
                      <View style={styles.recurringBadge}>
                        <Ionicons name="repeat" size={12} color={Colors.textTertiary} />
                        <Text style={styles.recurringText}>{event.recurringRule}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noEventsText}>No events on this day</Text>
          )}
        </View>

        {/* Upcoming Events */}
        <View style={styles.eventsSection}>
          <Text style={styles.eventsSectionTitle}>Upcoming</Text>
          {upcomingEvents.map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.upcomingCard}
              onPress={() => setSelectedDate(event.startDate)}
            >
              <View style={styles.upcomingDate}>
                <Text style={styles.upcomingMonth}>
                  {format(event.startDate, 'MMM')}
                </Text>
                <Text style={styles.upcomingDay}>
                  {format(event.startDate, 'd')}
                </Text>
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingTitle}>{event.title}</Text>
                <Text style={[styles.upcomingCategory, { color: CATEGORY_COLORS[event.category] }]}>
                  {event.category}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  monthTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  dayNamesRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textTertiary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.primaryLight + '30',
  },
  dayNumber: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  dayNumberOther: {
    color: Colors.textTertiary,
  },
  dayNumberSelected: {
    color: Colors.textInverse,
    fontWeight: FontWeights.bold,
  },
  dayNumberToday: {
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  eventsSectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  eventColorBar: {
    width: 4,
  },
  eventInfo: {
    flex: 1,
    padding: Spacing.lg,
  },
  eventTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  eventDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  eventCategory: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    textTransform: 'capitalize',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recurringText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  noEventsText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xxl,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  upcomingDate: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingMonth: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  upcomingDay: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  upcomingCategory: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    textTransform: 'capitalize',
    marginTop: 2,
  },
});
