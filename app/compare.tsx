/**
 * Multi-report Compare screen.
 * Select up to 4 reports from a history list to view Grouped Bar charts, Radar charts, and a Delta table.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { format, parseISO } from "date-fns";
import { BarChart, RadarChart } from "react-native-gifted-charts";

import { useReportStore } from "../store/reportStore";
import Theme, { Colors, Spacing, Radius, Typography, Shadow } from "../theme";
import type { InBodyReport, InBodyReportSummary } from "../types/report";

const REPORT_COLORS = ["#00E5FF", "#FF6B35", "#9D4EDD", "#00C97B"]; // cyan, orange, purple, green

export default function CompareScreen() {
  const { reports, loadReports, fetchReportById } = useReportStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedFull, setSelectedFull] = useState<InBodyReport[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  // Handle selection toggling
  const toggleReport = async (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      setSelectedFull((prev) => prev.filter((x) => x.id !== id));
    } else {
      if (selectedIds.length >= 4) return; // Max 4

      setSelectedIds((prev) => [...prev, id]);
      setLoadingIds((prev) => new Set(prev).add(id));

      const full = await fetchReportById(id);
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      if (full) {
        setSelectedFull((prev) => [...prev, full]);
      }
    }
  };

  // Sort chronologically ascending (oldest to newest) for the comparison panel
  const sortedReports = [...selectedFull].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // ─── 1. Grouped Bar Chart Data ───────────────────────────────────────────────
  const barMetrics = [
    { key: "weight", label: "Weight" },
    { key: "skeletalMuscleMass", label: "SMM" },
    { key: "bodyFatMass", label: "BFM" },
    { key: "percentBodyFat", label: "PBF" },
  ] as const;

  const barData: any[] = [];
  barMetrics.forEach((m) => {
    sortedReports.forEach((report, index) => {
      barData.push({
        value: report[m.key],
        frontColor: REPORT_COLORS[index],
        spacing: index === sortedReports.length - 1 ? 24 : 4,
        label: index === Math.floor(sortedReports.length / 2) ? m.label : "",
        labelTextStyle: { color: Colors.textSecondary, fontSize: 12 },
      });
    });
  });

  const generateMaxBarValue = () => {
    if (sortedReports.length === 0) return 100;
    const maxWeight = Math.max(...sortedReports.map((r) => r.weight));
    return Math.ceil(maxWeight * 1.1);
  };

  // ─── 2. Delta Table Data ──────────────────────────────────────────────────────
  const tableMetrics = [
    { key: "inbodyScore", label: "Score" },
    { key: "weight", label: "Weight (kg)" },
    { key: "skeletalMuscleMass", label: "SMM (kg)" },
    { key: "percentBodyFat", label: "Fat (%)" },
    { key: "visceralFatLevel", label: "Visceral" },
  ] as const;

  const renderDeltaCell = (val: number, earliestVal: number, index: number) => {
    if (index === 0)
      return (
        <Text style={[Typography.body, styles.cellText]}>{val.toFixed(1)}</Text>
      );

    const delta = val - earliestVal;
    if (Math.abs(delta) < 0.1) {
      return (
        <Text
          style={[
            Typography.body,
            styles.cellText,
            { color: Colors.textDisabled },
          ]}
        >
          {val.toFixed(1)} -
        </Text>
      );
    }

    const isPositive = delta > 0;
    // For weight/fat, down is generally "good" (green), for muscle/score, up is "good"
    // We'll just use primary cyan for up, and warning orange for down, to be neutral but distinct
    const color = isPositive ? REPORT_COLORS[0] : REPORT_COLORS[1];
    const arrow = isPositive ? "↑" : "↓";

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={[Typography.heading3, styles.cellText]}>
          {val.toFixed(1)}
        </Text>
        <Text style={[Typography.caption, { color, marginLeft: 2 }]}>
          {arrow}
        </Text>
      </View>
    );
  };

  // ─── Render Checkbox Row ────────────────────────────────────────────────────
  const renderListRow = ({ item }: { item: InBodyReportSummary }) => {
    const isSelected = selectedIds.includes(item.id);
    const isDisabled = !isSelected && selectedIds.length >= 4;
    const isLoading = loadingIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.listRow,
          isSelected && styles.listRowSelected,
          isDisabled && { opacity: 0.5 },
        ]}
        onPress={() => toggleReport(item.id)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={isSelected ? Colors.textInverse : Colors.primary}
            />
          ) : isSelected ? (
            <Text style={{ color: Colors.textInverse, fontWeight: "bold" }}>
              ✓
            </Text>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={Typography.heading3}>
            {format(parseISO(item.date), "MMM d, yyyy")}
          </Text>
          <Text style={Typography.caption}>
            Score: {Math.round(item.inbodyScore)} · Wt: {item.weight.toFixed(1)}
            kg
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Top half: Selection List */}
      <View style={styles.listSection}>
        <View style={styles.listHeader}>
          <Text style={Typography.heading2}>Compare Reports</Text>
          <Text style={Typography.bodySmall}>
            Select up to 4 to compare ({selectedIds.length}/4)
          </Text>
        </View>
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderListRow}
          contentContainerStyle={{
            padding: Spacing.xl,
            paddingTop: Spacing.xs,
          }}
          showsVerticalScrollIndicator={false}
          style={{
            maxHeight: 220,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          }}
        />
      </View>

      {/* Bottom half: Comparison Panel */}
      <ScrollView bounces={false} style={{ flex: 1 }}>
        {sortedReports.length >= 2 ? (
          <View style={styles.panel}>
            {/* Legend */}
            <View style={styles.legendRow}>
              {sortedReports.map((r, i) => (
                <View key={r.id} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: REPORT_COLORS[i] },
                    ]}
                  />
                  <Text style={Typography.caption}>
                    {format(parseISO(r.date), "MMM d")}
                  </Text>
                </View>
              ))}
            </View>

            {/* Grouped Bar Chart */}
            <View style={[Theme.CardStyle, styles.card]}>
              <Text style={[Typography.heading3, { marginBottom: Spacing.xl }]}>
                Core Metrics
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={barData}
                  barWidth={18}
                  noOfSections={4}
                  maxValue={generateMaxBarValue()}
                  barBorderRadius={2}
                  frontColor="lightgray"
                  yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                  xAxisLabelTextStyle={{
                    color: Colors.textSecondary,
                    fontSize: 10,
                  }}
                  rulesColor={Colors.border}
                  yAxisColor={Colors.border}
                  xAxisColor={Colors.border}
                  hideRules={false}
                />
              </ScrollView>
            </View>

            {/* Delta Table */}
            <View style={[Theme.CardStyle, styles.card]}>
              <Text style={[Typography.heading3, { marginBottom: Spacing.lg }]}>
                Delta Analysis
              </Text>

              <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <View style={styles.tableColHeader}>
                    <Text style={Typography.caption}>Metric</Text>
                  </View>
                  {sortedReports.map((r) => (
                    <View key={r.id} style={styles.tableColData}>
                      <Text
                        style={[Typography.caption, { textAlign: "center" }]}
                      >
                        {format(parseISO(r.date), "MMM d")}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Table Body */}
                {tableMetrics.map((m, i) => (
                  <View
                    key={m.key}
                    style={[
                      styles.tableRow,
                      i !== tableMetrics.length - 1 && styles.tableBorder,
                    ]}
                  >
                    <View style={styles.tableColHeader}>
                      <Text style={[Typography.heading3, { fontSize: 13 }]}>
                        {m.label}
                      </Text>
                    </View>
                    {sortedReports.map((r, rIdx) => (
                      <View key={r.id} style={styles.tableColData}>
                        {renderDeltaCell(
                          Number(r[m.key as keyof InBodyReport]),
                          Number(sortedReports[0][m.key as keyof InBodyReport]),
                          rIdx,
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Segmental Radar Chart */}
            <View style={[Theme.CardStyle, styles.card]}>
              <Text style={[Typography.heading3, { marginBottom: Spacing.xl }]}>
                Segmental Lean (%)
              </Text>
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 300,
                    height: 300,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {sortedReports[0] && (
                    <RadarChart
                      labels={["L.Arm", "R.Arm", "Trunk", "L.Leg", "R.Leg"]}
                      data={[
                        sortedReports[0].segLeanLeftArmPct,
                        sortedReports[0].segLeanRightArmPct,
                        sortedReports[0].segLeanTrunkPct,
                        sortedReports[0].segLeanLeftLegPct,
                        sortedReports[0].segLeanRightLegPct,
                      ]}
                      {...({ color: REPORT_COLORS[0] } as any)}
                      strokeWidth={2}
                      labelColor={Colors.textSecondary}
                      hideTitle
                      gridColor={Colors.border}
                      gridType="polygon"
                      strokeLinecap="round"
                    />
                  )}
                  {sortedReports[1] && (
                    <View style={StyleSheet.absoluteFill}>
                      {/* @ts-ignore: gifted-charts lacks full typing */}
                      <RadarChart
                        data={[
                          sortedReports[1].segLeanLeftArmPct,
                          sortedReports[1].segLeanRightArmPct,
                          sortedReports[1].segLeanTrunkPct,
                          sortedReports[1].segLeanLeftLegPct,
                          sortedReports[1].segLeanRightLegPct,
                        ]}
                        {...({ color: REPORT_COLORS[1] } as any)}
                        strokeWidth={2}
                        hideTitle
                        hideGrid
                        hideLabels
                      />
                    </View>
                  )}
                  {sortedReports[2] && (
                    <View style={StyleSheet.absoluteFill}>
                      {/* @ts-ignore: gifted-charts lacks full typing */}
                      <RadarChart
                        data={[
                          sortedReports[2].segLeanLeftArmPct,
                          sortedReports[2].segLeanRightArmPct,
                          sortedReports[2].segLeanTrunkPct,
                          sortedReports[2].segLeanLeftLegPct,
                          sortedReports[2].segLeanRightLegPct,
                        ]}
                        {...({ color: REPORT_COLORS[2] } as any)}
                        strokeWidth={2}
                        hideTitle
                        hideGrid
                        hideLabels
                      />
                    </View>
                  )}
                  {sortedReports[3] && (
                    <View style={StyleSheet.absoluteFill}>
                      {/* @ts-ignore: gifted-charts lacks full typing */}
                      <RadarChart
                        data={[
                          sortedReports[3].segLeanLeftArmPct,
                          sortedReports[3].segLeanRightArmPct,
                          sortedReports[3].segLeanTrunkPct,
                          sortedReports[3].segLeanLeftLegPct,
                          sortedReports[3].segLeanRightLegPct,
                        ]}
                        {...({ color: REPORT_COLORS[3] } as any)}
                        strokeWidth={2}
                        hideTitle
                        hideGrid
                        hideLabels
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </View>
        ) : (
          <View style={styles.emptyPanel}>
            <Text style={[Typography.body, { color: Colors.textDisabled }]}>
              Select at least 2 reports to see comparison
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  listSection: {
    backgroundColor: Colors.surface,
  },
  listHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  panel: {
    padding: Spacing.xl,
  },
  emptyPanel: {
    padding: Spacing["4xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  table: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  tableHeaderRow: {
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceElevated,
  },
  tableColHeader: {
    flex: 1.5,
    paddingLeft: Spacing.sm,
  },
  tableColData: {
    flex: 1,
    alignItems: "center",
  },
  cellText: {
    textAlign: "center",
  },
});
