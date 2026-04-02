/**
 * Reports list screen
 * Sorted list of all reports (newest first), showing date, badge, weight, SMM, PBF.
 * Features Swipeable rows to delete, tapping a row routes to Report Detail.
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format, parseISO } from "date-fns";
import { Swipeable } from "react-native-gesture-handler";

import { useReportStore } from "../store/reportStore";
import Theme, {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
  FontSize,
} from "../theme";
import type { InBodyReportSummary } from "../types/report";
import type { RootStackParamList } from "../App";

type ReportsNav = NativeStackNavigationProp<RootStackParamList, "MainTabs">;

function scoreColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.primary;
  if (score >= 40) return Colors.warning;
  return Colors.error;
}

export default function ReportsScreen() {
  const navigation = useNavigation<ReportsNav>();
  const { reports, isLoading, loadReports, removeReport } = useReportStore();

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const onRefresh = useCallback(() => {
    void loadReports();
  }, [loadReports]);

  const confirmDelete = (id: string, date: string) => {
    Alert.alert(
      "Delete Report",
      `Are you sure you want to delete the report from ${format(parseISO(date), "MMM d, yyyy")}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeReport(id),
        },
      ],
    );
  };

  const renderRightActions = (id: string, date: string) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => confirmDelete(id, date)}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: InBodyReportSummary }) => (
    <Swipeable
      renderRightActions={() => renderRightActions(item.id, item.date)}
      friction={2}
    >
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate("ReportDetail", { id: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.rowLeft}>
          <Text style={Typography.heading3}>
            {format(parseISO(item.date), "MMM d, yyyy")}
          </Text>
          <View style={styles.statsRow}>
            <Text style={Typography.bodySmall}>
              <Text style={{ color: Colors.textPrimary }}>
                {item.weight.toFixed(1)}
              </Text>{" "}
              kg
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={Typography.bodySmall}>
              <Text style={{ color: Colors.textPrimary }}>
                {item.skeletalMuscleMass.toFixed(1)}
              </Text>{" "}
              kg SMM
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={Typography.bodySmall}>
              <Text style={{ color: Colors.textPrimary }}>
                {item.percentBodyFat.toFixed(1)}
              </Text>
              % PBF
            </Text>
          </View>
        </View>

        <View style={styles.rowRight}>
          <View
            style={[
              styles.badge,
              { borderColor: scoreColor(item.inbodyScore) },
            ]}
          >
            <Text
              style={[
                Typography.heading3,
                { color: scoreColor(item.inbodyScore), marginBottom: -2 },
              ]}
            >
              {Math.round(item.inbodyScore)}
            </Text>
            <Text
              style={[
                Typography.caption,
                { color: scoreColor(item.inbodyScore) },
              ]}
            >
              Score
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  if (isLoading && reports.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={Typography.heading2}>History</Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={Typography.bodySmall}>
              No reports found. Add one to start tracking!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  rowLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dot: {
    color: Colors.textDisabled,
    fontWeight: "bold",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    minWidth: 54,
    backgroundColor: Colors.surfaceElevated,
  },
  chevron: {
    fontSize: FontSize.xl,
    color: Colors.textDisabled,
    marginTop: -4, // Optical alignment
  },
  deleteButton: {
    backgroundColor: Colors.error,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  deleteText: {
    ...Typography.heading3,
    color: Colors.textInverse,
  },
  empty: {
    alignItems: "center",
    marginTop: Spacing["4xl"],
  },
});
