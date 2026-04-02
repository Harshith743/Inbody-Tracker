/**
 * Calendar screen
 * Displays a unified calendar marking dates that possess an active InBody scan.
 * Tapping a marked date presents a BottomSheet revealing that date's distinct score and key measurements.
 */

import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { Calendar } from "react-native-calendars";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format, parseISO } from "date-fns";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

import { useReportStore } from "../store/reportStore";
import Theme, { Colors, Spacing, Radius, Typography, Shadow } from "../theme";
import type { InBodyReportSummary } from "../types/report";
import type { RootStackParamList } from "../App";

type CalendarNav = NativeStackNavigationProp<RootStackParamList, "MainTabs">;

export default function CalendarScreen() {
  const navigation = useNavigation<CalendarNav>();
  const { reports, loadReports, updateDate } = useReportStore();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [currentMonthStr, setCurrentMonthStr] = useState(
    format(new Date(), "yyyy-MM"),
  );
  const [selectedReport, setSelectedReport] =
    useState<InBodyReportSummary | null>(null);

  // Date Picker Modal State
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // Derived variables
  const currentMonthReportsCount = useMemo(() => {
    return reports.filter((r) => r.date.startsWith(currentMonthStr)).length;
  }, [reports, currentMonthStr]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    reports.forEach((r) => {
      marks[r.date] = {
        marked: true,
        dotColor: Colors.primary,
        selectedColor: Colors.surfaceElevated,
      };
    });

    // Highlight currently selected date actively
    if (selectedReport) {
      marks[selectedReport.date] = {
        ...(marks[selectedReport.date] || {}),
        selected: true,
        selectedColor: Colors.primary,
      };
    }
    return marks;
  }, [reports, selectedReport]);

  const handleDayPress = useCallback(
    (day: any) => {
      const dateStr = day.dateString;
      const foundReports = reports.filter((r) => r.date === dateStr);

      if (foundReports.length > 0) {
        setSelectedReport(foundReports[0]);
        bottomSheetRef.current?.present();
      } else {
        setSelectedReport(null);
        bottomSheetRef.current?.dismiss();
      }
    },
    [reports],
  );

  // Custom Backdrop for Bottom Sheet
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
      />
    ),
    [],
  );

  const viewFullReport = () => {
    if (!selectedReport) return;
    bottomSheetRef.current?.dismiss();
    navigation.navigate("ReportDetail", { id: selectedReport.id });
  };

  const submitDateChange = async (newDate: string) => {
    if (!selectedReport) return;
    try {
      await updateDate(selectedReport.id, newDate);
      setShowDatePicker(false);
      bottomSheetRef.current?.dismiss();
      setSelectedReport(null);
    } catch {
      Alert.alert('Error', 'Failed to update date. Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      {/* Dynamic Header */}
      <View style={styles.header}>
        <Text style={Typography.heading2}>
          {format(parseISO(`${currentMonthStr}-01`), "MMMM yyyy")}
        </Text>
        <Text style={Typography.bodySmall}>
          {currentMonthReportsCount} scan
          {currentMonthReportsCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Main Calendar View */}
      <View style={styles.calendarWrapper}>
        <Calendar
          current={format(new Date(), "yyyy-MM-dd")}
          onMonthChange={(month: any) =>
            setCurrentMonthStr(month.dateString.substring(0, 7))
          }
          markedDates={markedDates}
          onDayPress={handleDayPress}
          hideExtraDays
          theme={{
            backgroundColor: Colors.background,
            calendarBackground: Colors.background,
            monthTextColor: Colors.textPrimary,
            textMonthFontFamily: "SpaceGrotesk_600SemiBold",
            textMonthFontSize: 18,
            dayTextColor: Colors.textPrimary,
            todayTextColor: Colors.textInverse,
            todayBackgroundColor: Colors.surfaceElevated,
            arrowColor: Colors.primary,
            textDisabledColor: Colors.textDisabled,
            dotColor: Colors.primary,
            selectedDayBackgroundColor: Colors.primary,
            selectedDayTextColor: Colors.textInverse,
            textDayFontFamily: "SpaceGrotesk_400Regular",
            textDayHeaderFontFamily: "SpaceGrotesk_600SemiBold",
          }}
        />
      </View>

      {/* Stats Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={["38%", "45%"]}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBg}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
        onDismiss={() => setSelectedReport(null)}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedReport && (
            <>
              <View style={styles.sheetHeader}>
                <Text style={Typography.heading3}>
                  {format(parseISO(selectedReport.date), "MMMM d, yyyy")}
                </Text>
                <View style={styles.scoreBadge}>
                  <Text
                    style={[Typography.heading3, { color: Colors.primary }]}
                  >
                    Score: {Math.round(selectedReport.inbodyScore)}
                  </Text>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={Typography.caption}>Weight</Text>
                  <Text style={[Typography.heading3, { fontSize: 16 }]}>
                    {selectedReport.weight.toFixed(1)}kg
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={Typography.caption}>SMM</Text>
                  <Text style={[Typography.heading3, { fontSize: 16 }]}>
                    {selectedReport.skeletalMuscleMass.toFixed(1)}kg
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={Typography.caption}>Body Fat</Text>
                  <Text style={[Typography.heading3, { fontSize: 16 }]}>
                    {selectedReport.percentBodyFat.toFixed(1)}%
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: "auto", gap: Spacing.md }}>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={viewFullReport}
                >
                  <Text style={styles.actionBtnPrimaryText}>
                    View Full Report {">"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.actionBtnSecondaryText}>Change Date</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>

      {/* Date Picker Modal for Date Reassignment */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            <Text
              style={[
                Typography.heading3,
                { marginBottom: Spacing.md, textAlign: "center" },
              ]}
            >
              Reassign Report
            </Text>
            <Calendar
              current={selectedReport?.date || undefined}
              theme={{
                backgroundColor: Colors.surface,
                calendarBackground: Colors.surface,
                monthTextColor: Colors.textPrimary,
                dayTextColor: Colors.textPrimary,
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
                textDisabledColor: Colors.textDisabled,
              }}
              onDayPress={(day: any) => submitDateChange(day.dateString)}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowDatePicker(false)}
            >
              <Text
                style={[Typography.heading3, { color: Colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  calendarWrapper: {
    paddingHorizontal: Spacing.sm,
  },
  bottomSheetBg: {
    backgroundColor: Colors.surfaceElevated,
  },
  sheetContent: {
    flex: 1,
    padding: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  scoreBadge: {
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 4,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: "center",
    ...Shadow.sm,
  },
  actionBtnPrimaryText: {
    ...Typography.heading3,
    color: Colors.textInverse,
  },
  actionBtnSecondary: {
    backgroundColor: "transparent",
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: "center",
  },
  actionBtnSecondaryText: {
    ...Typography.heading3,
    color: Colors.textSecondary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  closeBtn: {
    marginTop: Spacing.xl,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
});
