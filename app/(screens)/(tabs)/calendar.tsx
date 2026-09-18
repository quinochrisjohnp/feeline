import React, { useMemo, useRef, useState } from "react";
import {
  LayoutAnimation,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarDay from "@/components/calendar/CalendarDay";
import CompactWeekStrip from "@/components/calendar/CompactWeekStrip";
import DetectionListRow from "@/components/calendar/DetectionListRow";
import CatFilterModal from "@/components/calendar/CatFilterModal";
import EmotionResultCard from "@/components/camera/EmotionResultCard";
import EmptyState from "@/components/common/EmptyState";
import { useCatData } from "@/context/CatDataContext";
import { UNKNOWN_ALBUM_ID } from "@/types/models";
import { selectCalendarRecordsForDate, selectCalendarFilterOptions, selectCatById, selectCatForDetection, selectImageById } from "@/context/catDataSelectors";
import MockPhoto from "@/components/common/MockPhoto";
import type { EmotionKey } from "@/types/models";
import { formatFullDate, formatTime, getMonthMatrix, getWeekDates, isSameDay, monthLabel } from "@/utils/date";
import { colors, radii, shadows, spacing, typography } from "@/constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAYS = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
const COLLAPSE_THRESHOLD = 60;

export default function Calendar() {
  const { state } = useCatData();
  const filterOptions = selectCalendarFilterOptions(state);

  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const cells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const dominantEmotionFor = (date: Date): EmotionKey | undefined => {
    const records = selectCalendarRecordsForDate(state, date);
    return records[records.length - 1]?.emotion;
  };

  const recordsForSelectedDate = useMemo(
    () => selectCalendarRecordsForDate(state, selectedDate, selectedCatId),
    [state, selectedDate, selectedCatId]
  );

  const goToPrevMonth = () => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const goToNextMonth = () => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const catNameFor = (catId: string) => catId === UNKNOWN_ALBUM_ID ? "Unknown Cats" : selectCatById(state, catId)?.name ?? "Cat";
  const selectedCatName = selectedCatId ? catNameFor(selectedCatId) : "All Cats";
  const dateHeading = isSameDay(selectedDate, new Date())
    ? "TODAY"
    : formatFullDate(selectedDate.toISOString()).toUpperCase();

  const activeRecord = state.detectionRecords.find((record) => record.id === activeRecordId) ?? null;

  const setCollapsedAnimated = (value: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed(value);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    if (y > COLLAPSE_THRESHOLD && !collapsed) {
      setCollapsedAnimated(true);
    } else if (y <= COLLAPSE_THRESHOLD && collapsed) {
      setCollapsedAnimated(false);
    }
  };

  const handleExpand = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.tabBarClearance }}
        >
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
              recordsForSelectedDate.map((record) => (
                <DetectionListRow
                  key={record.id}
                  catName={selectCatForDetection(state, record)?.name ?? "Unknown Cats"}
                  emotion={record.emotion}
                  time={formatTime(record.recordedAt)}
                  onPress={() => setActiveRecordId(record.id)}
                />
              ))
            )}
          </View>
        </ScrollView>

        {collapsed && (
          <View style={styles.stickyOverlay}>
            <CompactWeekStrip
              weekDates={weekDates}
              selectedDate={selectedDate}
              monthLabel={monthLabel(monthDate)}
              emotionForDate={dominantEmotionFor}
              onSelectDate={setSelectedDate}
              onExpand={handleExpand}
            />
          </View>
        )}
      </View>

      <CatFilterModal
        visible={filterVisible}
        options={filterOptions}
        selectedCatId={selectedCatId}
        onSelect={setSelectedCatId}
        onClose={() => setFilterVisible(false)}
      />

      <Modal visible={!!activeRecord} transparent animationType="fade" onRequestClose={() => setActiveRecordId(null)}>
        <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={() => setActiveRecordId(null)}>
          <View style={styles.detailCard}>
            <View style={styles.detailPhoto}>
              <MockPhoto imageUri={activeRecord ? selectImageById(state, activeRecord.imageId)?.imageUri : null} size={40} />
            </View>
            {activeRecord ? <EmotionResultCard emotionKey={activeRecord.emotion} confidence={activeRecord.confidence} /> : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  calendarSection: { paddingHorizontal: spacing.lg },
  weekdayRow: { flexDirection: "row" },
  weekdayLabel: { ...typography.caption, color: colors.textSecondary, width: `${100 / 7}%`, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  recordsSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    marginTop: spacing.md,
    minHeight: 200,
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
  stickyOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  detailOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: "center", paddingHorizontal: spacing.lg },
  detailCard: { backgroundColor: colors.white, borderRadius: radii.lg, overflow: "hidden", ...shadows.floating },
  detailPhoto: { height: 220, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" },
});