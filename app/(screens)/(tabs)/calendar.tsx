import React, { useEffect, useMemo, useRef, useState } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarDay from "@/components/calendar/CalendarDay";
import CompactWeekStrip from "@/components/calendar/CompactWeekStrip";
import DetectionListRow from "@/components/calendar/DetectionListRow";
import CatFilterModal from "@/components/calendar/CatFilterModal";
import EmptyState from "@/components/common/EmptyState";
import { useCatData } from "@/context/CatDataContext";
import { selectCalendarRecordsForDate, selectCalendarRecords, selectCalendarFilterOptions,
  selectBirthdayCatsForDate, selectCatForDetection } from "@/context/catDataSelectors";
import { formatFullDate, formatTime, getMonthMatrix, getWeekDates, isSameDay, monthLabel } from "@/utils/date";
import { colors, getTabBarClearance, radii, shadows, spacing, typography } from "@/constants/theme";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const router = useRouter();
  const { state } = useCatData();
  const filterOptions = selectCalendarFilterOptions(state);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(500);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [stripHeight, setStripHeight] = useState(170);
  const scrollRef = useRef<ScrollView>(null);

  // Derive the fallback immediately, including the render before the effect runs.
  const filterId = filterOptions.some((option) => option.id === selectedCatId) ? selectedCatId : null;
  useEffect(() => { if (selectedCatId !== filterId) setSelectedCatId(filterId); }, [selectedCatId, filterId]);
  const selectedCatName = filterOptions.find((option) => option.id === filterId)?.name ?? "All Cats";
  const cells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const records = selectCalendarRecordsForDate(state, selectedDate, filterId);
  const birthdays = selectBirthdayCatsForDate(state, selectedDate, filterId);
  const hasHistory = selectCalendarRecords(state, filterId).length > 0;
  const activityForDate = (date: Date) => {
    const daily = selectCalendarRecordsForDate(state, date, filterId);
    return { emotion: daily[daily.length - 1]?.emotion, recordCount: daily.length,
      birthdayCount: selectBirthdayCatsForDate(state, date, filterId).length };
  };
  const handleExpand = () => {
    setCollapsed(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
    if (collapsed) scrollRef.current?.scrollTo({ y: Math.max(0, calendarHeight - stripHeight), animated: false });
  };
  const moveMonth = (offset: number) => {
    selectDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1));
    handleExpand();
  };
  const goToToday = () => { selectDate(new Date()); handleExpand(); };
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Keep the full grid's height stable; the overlay takes over as the grid leaves view.
    // A small hysteresis avoids flicker around the transition on native scroll bounce.
    const threshold = Math.max(60, calendarHeight - stripHeight);
    const y = event.nativeEvent.contentOffset.y;
    if (!collapsed && y >= threshold) setCollapsed(true);
    else if (collapsed && y < threshold - 24) setCollapsed(false);
  };
  const dateHeading = isSameDay(selectedDate, new Date()) ? "TODAY" : formatFullDate(selectedDate.toISOString()).toUpperCase();

  return (
    <ScreenContainer padded={false}>
      <View style={styles.root} onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}>
        <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16}
          showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: getTabBarClearance(0) }}>
          <View style={styles.calendarSection} onLayout={(event) => setCalendarHeight(event.nativeEvent.layout.height)}
            aria-hidden={collapsed}
            accessibilityElementsHidden={collapsed} importantForAccessibility={collapsed ? "no-hide-descendants" : "auto"}>
            <View style={styles.headerPadding}>
              <CalendarHeader label={monthLabel(monthDate)} onPrev={() => moveMonth(-1)} onNext={() => moveMonth(1)} onToday={goToToday} />
            </View>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => <Text key={day} style={styles.weekdayLabel}>{day}</Text>)}
            </View>
            <View style={styles.grid}>
              {cells.map(({ date, inCurrentMonth }) => (
                <CalendarDay key={date.toISOString()} day={date.getDate()}
                  disabled={collapsed}
                  dateLabel={date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  inCurrentMonth={inCurrentMonth} isSelected={isSameDay(date, selectedDate)} isToday={isSameDay(date, new Date())}
                  {...activityForDate(date)} onPress={() => selectDate(date)} />
              ))}
            </View>
          </View>
          <View style={[styles.recordsSheet, { minHeight: Math.max(200, viewportHeight - stripHeight) }]}>
            <View style={styles.recordsHeader}>
              <Text style={styles.recordsHeading}>{dateHeading}</Text>
              <TouchableOpacity style={styles.filterChip} onPress={() => setFilterVisible(true)} accessibilityRole="button"
                accessibilityLabel={`Filter calendar: ${selectedCatName}`} accessibilityState={{ expanded: filterVisible }}>
                <Text style={styles.filterChipLabel}>{selectedCatName}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {birthdays.map((cat) => (
              <View key={cat.id} style={styles.birthday} accessible accessibilityLabel={`${cat.name}, Birthday, All Day`}>
                <Ionicons name="gift-outline" size={22} color={colors.textPrimary} />
                <View style={styles.birthdayText}><Text style={styles.birthdayName}>{cat.name}</Text><Text style={styles.birthdayLabel}>Birthday</Text></View>
                <Text style={styles.allDay}>All Day</Text>
              </View>
            ))}
            {records.map((record) => (
              <DetectionListRow key={record.id} catName={selectCatForDetection(state, record)?.name ?? "Unknown Cats"}
                emotion={record.emotion} time={formatTime(record.recordedAt)}
                onPress={() => router.push({ pathname: "/album-photo", params: { imageId: record.imageId, from: "calendar" } })} />
            ))}
            {records.length === 0 && birthdays.length === 0 ? <EmptyState icon="calendar-clear-outline"
              title={hasHistory ? "No events for this date" : "No detections yet"}
              message={hasHistory ? "Choose another date to view saved detections." : `Saved mock detections${filterId ? ` for ${selectedCatName}` : ""} will appear here.`} /> : null}
          </View>
        </ScrollView>
        {collapsed && <View style={styles.stickyOverlay} onLayout={(event) => setStripHeight(event.nativeEvent.layout.height)}>
          <CompactWeekStrip weekDates={weekDates} selectedDate={selectedDate} monthLabel={monthLabel(monthDate)}
            activityForDate={activityForDate} onSelectDate={selectDate} onExpand={handleExpand} />
        </View>}
      </View>
      <CatFilterModal visible={filterVisible} options={filterOptions} selectedCatId={filterId}
        onSelect={setSelectedCatId} onClose={() => setFilterVisible(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  calendarSection: { paddingHorizontal: spacing.xxs },
  headerPadding: { paddingHorizontal: spacing.md },
  weekdayRow: { flexDirection: "row" },
  weekdayLabel: { ...typography.caption, color: colors.textSecondary, width: `${100 / 7}%`, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: spacing.sm },
  recordsSheet: { backgroundColor: colors.white, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    padding: spacing.lg, marginTop: spacing.md, ...shadows.floating },
  recordsHeader: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  recordsHeading: { ...typography.label, color: colors.textPrimary, letterSpacing: 1, flexShrink: 1 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "100%", minHeight: 44,
    backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  filterChipLabel: { ...typography.label, color: colors.textPrimary, flexShrink: 1 },
  birthday: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  birthdayText: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  birthdayName: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  birthdayLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  allDay: { ...typography.caption, color: colors.textSecondary },
  stickyOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
});
