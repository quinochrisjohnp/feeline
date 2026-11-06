import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import ModalSurface from "@/components/common/ModalSurface";
import Button from "@/components/common/Button";
import { dailyEmotion } from "@/utils/calendarEmotion";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenContainer from "@/components/common/ScreenContainer";
import WellnessCalendarSection from "@/components/wellness/WellnessCalendarSection";
import { useWellness, useWellnessNavigationSafety } from "@/context/WellnessContext";
import { remindersForDate } from "@/utils/wellnessState";
import CalendarHeader from "@/components/calendar/CalendarHeader";
import CalendarDay from "@/components/calendar/CalendarDay";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CalendarSwipeArea, CalendarDragHandle, CalendarWeek, useCalendarPanel } from "@/components/calendar/CalendarDragPanel";
import DetectionListRow from "@/components/calendar/DetectionListRow";
import CatFilterModal from "@/components/calendar/CatFilterModal";
import EmptyState from "@/components/common/EmptyState";
import { useCatData } from "@/context/CatDataContext";
import { selectCalendarRecordsForDate, selectCalendarRecords, selectCalendarFilterOptions,
  selectBirthdayCatsForDate, selectCatForDetection } from "@/context/catDataSelectors";
import { formatFullDate, formatTime, getMonthMatrix, isSameDay, monthLabel } from "@/utils/date";
import { colors, getTabBarClearance, radii, shadows, spacing, typography } from "@/constants/theme";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar() {
  const router = useRouter();
  const { state, refreshDetections } = useCatData();
  const wellness = useWellness();

  useFocusEffect(
    useCallback(() => {
      void refreshDetections();
    }, [refreshDetections])
  );
  const filterOptions = selectCalendarFilterOptions(state);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => new Date());
  useWellnessNavigationSafety(filterVisible || datePickerOpen);
  // Keep the original day sizing on every phone: 60-point cell + theme row gap.
  const rowHeight = 60 + spacing.xs;
  const panel = useCalendarPanel(rowHeight * 5);

  // Derive the fallback immediately, including the render before the effect runs.
  const filterId = filterOptions.some((option) => option.id === selectedCatId) ? selectedCatId : null;
  useEffect(() => { if (selectedCatId !== filterId) setSelectedCatId(filterId); }, [selectedCatId, filterId]);
  const selectedCatName = filterOptions.find((option) => option.id === filterId)?.name ?? "All Cats";
  const cells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const selectedWeek = Math.floor(cells.findIndex(cell => isSameDay(cell.date, selectedDate)) / 7);
  const records = selectCalendarRecordsForDate(state, selectedDate, filterId);
  const birthdays = selectBirthdayCatsForDate(state, selectedDate, filterId);
  const hasHistory = selectCalendarRecords(state, filterId).length > 0;
  const activityForDate = (date: Date) => {
    const daily = selectCalendarRecordsForDate(state, date, filterId);
    return { emotion: dailyEmotion(daily, date), recordCount: daily.length,
      birthdayCount: selectBirthdayCatsForDate(state, date, filterId).length,
      reminderCount: remindersForDate(wellness.state, date, filterId).filter(r => state.cats.some(c => c.id === r.catId)).length };
  };
  const handleExpand = () => panel.snap(0);
  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setMonthDate(new Date(date.getFullYear(), date.getMonth(), 1));
  };
  const chooseDate = () => {
    if (Platform.OS === "web") return;
    setPickerDate(selectedDate);
    setDatePickerOpen(true);
    if (Platform.OS === "android") DateTimePickerAndroid.open({ value: selectedDate, mode: "date",
      onChange: (event, date) => { setDatePickerOpen(false); if (event.type === "set" && date) selectDate(date); },
      onError: () => setDatePickerOpen(false),
    });
  };
  const moveMonth = (offset: number) => {
    selectDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1));
    handleExpand();
  };
  const swipeCalendar = (offset: number) => {
    if (panel.settledExpanded) {
      selectDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + offset * 7));
    } else {
      moveMonth(offset);
    }
  };
  const goToToday = () => { selectDate(new Date()); handleExpand(); };
  const dateHeading = isSameDay(selectedDate, new Date()) ? "TODAY" : formatFullDate(selectedDate.toISOString()).toUpperCase();

  return (
    <ScreenContainer module="calendar" padded={false}>
      <GestureHandlerRootView style={styles.root}>
          <View style={styles.calendarSection}>
            <View style={styles.headerPadding}>
              <CalendarHeader onChooseDate={chooseDate} label={monthLabel(monthDate)} onPrev={() => moveMonth(-1)} onNext={() => moveMonth(1)} onToday={goToToday} />
            </View>
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => <Text key={day} style={styles.weekdayLabel}>{day}</Text>)}
            </View>
            <CalendarSwipeArea onSwipe={swipeCalendar}>
            <View style={styles.grid}>
              {Array.from({ length: cells.length / 7 }, (_, week) => {
                if (panel.settledExpanded && week !== selectedWeek) return null;
                const active = week === selectedWeek;
                return <CalendarWeek key={week} active={active} height={rowHeight} progress={panel.progress}>
                  {cells.slice(week * 7, week * 7 + 7).map(({ date, inCurrentMonth }) => <CalendarDay key={date.toISOString()} day={date.getDate()}
                    dateLabel={date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    inCurrentMonth={inCurrentMonth} isSelected={isSameDay(date, selectedDate)} isToday={isSameDay(date, new Date())}
                    {...activityForDate(date)} onPress={() => selectDate(date)} />)}
                </CalendarWeek>;
              })}
            </View>
            </CalendarSwipeArea>
          </View>
          <View style={styles.recordsSheet}>
            <CalendarDragHandle panel={panel} label="Expand events or show full calendar month" />
            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: getTabBarClearance(0) + spacing.lg }}>
            <View style={styles.recordsHeader}>
              <Text style={styles.recordsHeading}>{dateHeading}</Text>
              <TouchableOpacity style={styles.filterChip} onPress={() => setFilterVisible(true)} accessibilityRole="button"
                accessibilityLabel={`Filter calendar: ${selectedCatName}`} accessibilityState={{ expanded: filterVisible }}>
                <Text style={styles.filterChipLabel} numberOfLines={1} ellipsizeMode="tail">{selectedCatName}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <WellnessCalendarSection date={selectedDate} catId={filterId} blocked={filterVisible}
              onOpenContext={(date, catId) => { selectDate(date); setSelectedCatId(catId); }} />
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
            {records.length === 0 && birthdays.length === 0 && remindersForDate(wellness.state, selectedDate, filterId).length === 0 ? <EmptyState icon="calendar-clear-outline"
              title={hasHistory ? "No events for this date" : "No detections yet"}
              message={hasHistory ? "Choose another date to view saved detections." : `Saved detections${filterId ? ` for ${selectedCatName}` : ""} will appear here.`} /> : null}
            </ScrollView>
          </View>
      </GestureHandlerRootView>
      {Platform.OS === "ios" && datePickerOpen ? <ModalSurface visible onClose={() => setDatePickerOpen(false)}>
        <DateTimePicker value={pickerDate} mode="date" display="spinner" onChange={(_, date) => { if (date) setPickerDate(date); }} />
        <Button label="Done" onPress={() => { selectDate(pickerDate); setDatePickerOpen(false); }} />
      </ModalSurface> : null}
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
  grid: { marginTop: spacing.sm },
  recordsSheet: { backgroundColor: colors.white, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl,
    flex: 1, marginTop: spacing.md, overflow: "hidden", ...shadows.floating },
  recordsHeader: { flexDirection: "row", flexWrap: "nowrap", gap: spacing.xs, justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  recordsHeading: { ...typography.label, color: colors.textPrimary, letterSpacing: 1, flex: 1, minWidth: 0 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "60%", minWidth: 0, flexShrink: 1, minHeight: 44,
    backgroundColor: colors.background, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  filterChipLabel: { ...typography.label, color: colors.textPrimary, flexShrink: 1, minWidth: 0 },
  birthday: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingVertical: spacing.sm },
  birthdayText: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  birthdayName: { ...typography.body, color: colors.textSecondary, flexShrink: 1 },
  birthdayLabel: { ...typography.bodyMedium, color: colors.textPrimary },
  allDay: { ...typography.caption, color: colors.textSecondary },
  stickyOverlay: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
});
