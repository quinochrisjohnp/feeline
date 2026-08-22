import React, { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarDay from "@/components/calendar/CalendarDay";
import DetectionListRow from "@/components/calendar/DetectionListRow";
import CatFilterModal from "@/components/calendar/CatFilterModal";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import EmptyState from "@/components/common/EmptyState";
import { mockCats } from "@/data/mockCats";
import { mockDetectionRecords } from "@/data/mockDetectionRecords";
import type { DetectionRecord, EmotionKey } from "@/types/models";
import { formatFullDate, formatTime, getMonthMatrix, isSameDay, monthLabel } from "@/utils/date";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

const WEEKDAYS = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];

// TODO(backend): replace mockDetectionRecords with a real fetch scoped to
// the visible month once the API is connected.
export default function Calendar() {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

  const cells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);

  const recordsByDay = useMemo(() => {
    const map = new Map<string, DetectionRecord[]>();
    mockDetectionRecords.forEach((record) => {
      const key = new Date(record.recordedAt).toDateString();
      const existing = map.get(key) ?? [];
      existing.push(record);
      map.set(key, existing);
    });
    return map;
  }, []);

  const dominantEmotionFor = (date: Date): EmotionKey | undefined => {
    const records = recordsByDay.get(date.toDateString());
    if (!records || records.length === 0) return undefined;
    return records[records.length - 1].emotion;
  };

  const recordsForSelectedDate = useMemo(() => {
    const records = recordsByDay.get(selectedDate.toDateString()) ?? [];
    const filtered = selectedCatId ? records.filter((r) => r.catId === selectedCatId) : records;
    return filtered.slice().sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }, [recordsByDay, selectedDate, selectedCatId]);

  const goToPrevMonth = () => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const goToNextMonth = () => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const catNameFor = (catId: string) => mockCats.find((cat) => cat.id === catId)?.name ?? "Unknown Cat";
  const selectedCatName = selectedCatId ? catNameFor(selectedCatId) : "All Cats";
  const dateHeading = isSameDay(selectedDate, new Date())
    ? "TODAY"
    : formatFullDate(selectedDate.toISOString()).toUpperCase();

  const activeRecord = mockDetectionRecords.find((record) => record.id === activeRecordId) ?? null;

  return (
    <ScreenContainer padded={false}>
      <View style={styles.calendarSection}>
        <CalendarHeader label={monthLabel(monthDate)} onPrev={goToPrevMonth} onNext={goToNextMonth} />

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((day) => (
            <Text key={day} style={styles.weekdayLabel}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map(({ date, inCurrentMonth }) => (
            <CalendarDay
              key={date.toISOString()}
              day={date.getDate()}
              inCurrentMonth={inCurrentMonth}
              isSelected={isSameDay(date, selectedDate)}
              isToday={isSameDay(date, new Date())}
              emotion={dominantEmotionFor(date)}
              onPress={() => setSelectedDate(date)}
            />
          ))}
        </View>
      </View>

      <View style={styles.recordsSheet}>
        <View style={styles.recordsHeader}>
          <Text style={styles.recordsHeading}>{dateHeading}</Text>
          <TouchableOpacity style={styles.filterChip} onPress={() => setFilterVisible(true)}>
            <Text style={styles.filterChipLabel}>{selectedCatName}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {recordsForSelectedDate.length === 0 ? (
          <EmptyState icon="calendar-clear-outline" title="No detection records for this date" />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}>
            {recordsForSelectedDate.map((record) => (
              <DetectionListRow
                key={record.id}
                catName={catNameFor(record.catId)}
                emotion={record.emotion}
                time={formatTime(record.recordedAt)}
                onPress={() => setActiveRecordId(record.id)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <CatFilterModal
        visible={filterVisible}
        cats={mockCats}
        selectedCatId={selectedCatId}
        onSelect={setSelectedCatId}
        onClose={() => setFilterVisible(false)}
      />

      <Modal visible={!!activeRecord} transparent animationType="fade" onRequestClose={() => setActiveRecordId(null)}>
        <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={() => setActiveRecordId(null)}>
          <View style={styles.detailCard}>
            <View style={styles.detailPhoto}>
              <Ionicons name="image-outline" size={40} color={colors.textMuted} />
            </View>
            {activeRecord ? <EmotionResultCard emotionKey={activeRecord.emotion} confidence={activeRecord.confidence} /> : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  calendarSection: { paddingHorizontal: spacing.lg },
  weekdayRow: { flexDirection: "row" },
  weekdayLabel: { ...typography.caption, color: colors.textSecondary, width: `${100 / 7}%`, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  recordsSheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    ...shadows.floating,
  },
  recordsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  recordsHeading: { ...typography.subheading, color: colors.textPrimary, letterSpacing: 1 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipLabel: { ...typography.label, color: colors.textPrimary },
  detailOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", paddingHorizontal: spacing.lg },
  detailCard: { backgroundColor: colors.white, borderRadius: radii.lg, overflow: "hidden", ...shadows.floating },
  detailPhoto: { height: 220, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
});