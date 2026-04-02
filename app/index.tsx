/**
 * Dashboard screen
 *
 * 1. Header: Title + Add Report button
 * 2. Hero card: Latest scan date + InBody Score PieChart
 * 3. Key stats row: Weight | SMM | Body Fat% | Visceral Fat Level
 * 4. Trend chart section: LineChart + Toggle buttons
 * 5. Segmental body summary: 5 rows (horizontal bars)
 */

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { format, parseISO } from "date-fns";
import { PieChart } from "react-native-gifted-charts";

import { useReportStore } from "../store/reportStore";
import { StatCard } from "../components/StatCard";
import { TrendChart } from "../components/TrendChart";
import Theme, {
  Colors,
  FontSize,
  Spacing,
  Radius,
  Shadow,
  Typography,
} from "../theme";
import type { RootStackParamList } from "../App";
import type { InBodyReport } from "../types/report";

type DashboardNav = NativeStackNavigationProp<RootStackParamList, "MainTabs">;

type ChartMetric = "Weight" | "SMM" | "PBF";

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const { reports, isLoading, loadReports, fetchReportById } = useReportStore();

  const [latestReport, setLatestReport] = useState<InBodyReport | null>(null);
  const [prevReport, setPrevReport] = useState<InBodyReport | null>(null);
  const [metric, setMetric] = useState<ChartMetric>("Weight");

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const onRefresh = useCallback(() => {
    void loadReports();
  }, [loadReports]);

  // Fetch full details for the latest and previous reports to populate Visceral Fat and Segmental data
  useEffect(() => {
    if (reports.length > 0) {
      fetchReportById(reports[0].id).then(setLatestReport).catch(() => setLatestReport(null));
    } else {
      setLatestReport(null);
    }

    if (reports.length > 1) {
      fetchReportById(reports[1].id).then(setPrevReport).catch(() => setPrevReport(null));
    } else {
      setPrevReport(null);
    }
  }, [reports, fetchReportById]);

  if (isLoading && reports.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Trend Chart Data ────────────────────────────────────────────────────────
  const trendData = reports
    .slice()
    .reverse()
    .map((r) => {
      let val = 0;
      if (metric === "Weight") val = r.weight;
      if (metric === "SMM") val = r.skeletalMuscleMass;
      if (metric === "PBF") val = r.percentBodyFat;
      return { date: r.date, value: val };
    });

  const getMetricColor = () => {
    if (metric === "Weight") return Colors.info;
    if (metric === "SMM") return Colors.primary;
    return Colors.warning;
  };

  const getMetricUnit = () => (metric === "PBF" ? "%" : "kg");

  // ── Segmental Bar Renderer ──────────────────────────────────────────────────
  const renderSegment = (label: string, leanPct: number, fatPct: number) => (
    <View key={label} style={styles.segmentRow}>
      <Text style={[Typography.label, { width: 50 }]}>{label}</Text>
      <View style={{ flex: 1, gap: Spacing.xs }}>
        <View style={styles.barWrapper}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(leanPct, 100)}%`,
                  backgroundColor: Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={[Typography.caption, { width: 35, textAlign: "right" }]}>
            {leanPct.toFixed(0)}%
          </Text>
        </View>
        <View style={styles.barWrapper}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(fatPct, 100)}%`,
                  backgroundColor: Colors.warning,
                },
              ]}
            />
          </View>
          <Text style={[Typography.caption, { width: 35, textAlign: "right" }]}>
            {fatPct.toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={Typography.heading2}>InBody Tracker</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddReport")}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>Add Report</Text>
          </TouchableOpacity>
        </View>

        {latestReport ? (
          <>
            {/* Hero Card */}
            <View style={[Theme.CardStyleActive, styles.heroCard]}>
              <View style={styles.heroHeader}>
                <Text style={Typography.heading3}>Latest Scan</Text>
                <Text style={Typography.bodySmall}>
                  {format(parseISO(latestReport.date), "MMMM d, yyyy")}
                </Text>
              </View>

              <View style={styles.gaugeContainer}>
                <PieChart
                  donut
                  radius={75}
                  innerRadius={60}
                  data={[
                    { value: latestReport.inbodyScore, color: Colors.primary },
                    {
                      value: 100 - latestReport.inbodyScore,
                      color: "#1E2533",
                    },
                  ]}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                      <Text
                        style={[
                          Typography.statHero,
                          { 
                            fontSize: 48, 
                            lineHeight: 56, 
                            marginTop: 10,
                            color: Colors.primary,
                            textShadowColor: "rgba(0, 229, 255, 0.6)",
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 12
                          },
                        ]}
                      >
                        {Math.round(latestReport.inbodyScore)}
                      </Text>
                      <Text style={[Typography.caption, { fontSize: 14, marginTop: -8 }]}>
                        / 100
                      </Text>
                      <Text style={[Typography.label, { marginTop: -5 }]}>
                        Score
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>

            {/* Key Stats Row */}
            <Text style={[Typography.heading3, styles.sectionTitle]}>
              Key Metrics
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScroll}
            >
              <View style={styles.statCol}>
                <StatCard
                  label="Weight"
                  value={latestReport.weight}
                  unit="kg"
                  delta={
                    prevReport
                      ? latestReport.weight - prevReport.weight
                      : undefined
                  }
                  accentColor={Colors.info}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Muscle Mass"
                  value={latestReport.skeletalMuscleMass}
                  unit="kg"
                  delta={
                    prevReport
                      ? latestReport.skeletalMuscleMass -
                        prevReport.skeletalMuscleMass
                      : undefined
                  }
                  accentColor={Colors.primary}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Body Fat"
                  value={latestReport.percentBodyFat}
                  unit="%"
                  delta={
                    prevReport
                      ? latestReport.percentBodyFat - prevReport.percentBodyFat
                      : undefined
                  }
                  accentColor={Colors.warning}
                />
              </View>
              <View style={styles.statCol}>
                <StatCard
                  label="Visceral Fat"
                  value={latestReport.visceralFatLevel}
                  delta={
                    prevReport
                      ? latestReport.visceralFatLevel -
                        prevReport.visceralFatLevel
                      : undefined
                  }
                  accentColor={Colors.warning}
                />
              </View>
            </ScrollView>

            {/* Trend Chart Section */}
            <View style={[Theme.CardStyle, styles.chartCard]}>
              <View style={styles.chartHeader}>
                <Text style={Typography.heading3}>Trend Map</Text>
                <View style={styles.toggleRow}>
                  {(["Weight", "SMM", "PBF"] as ChartMetric[]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.toggleBtn,
                        metric === m && styles.toggleBtnActive,
                      ]}
                      onPress={() => setMetric(m)}
                    >
                      <Text
                        style={[
                          styles.toggleBtnText,
                          metric === m && styles.toggleBtnTextActive,
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TrendChart
                data={trendData}
                unit={getMetricUnit()}
                color={getMetricColor()}
                height={150}
              />
            </View>

            {/* Segmental Body Summary */}
            <View style={Theme.CardStyle}>
              <Text style={[Typography.heading3, { marginBottom: Spacing.lg }]}>
                Segmental Analysis
              </Text>
              {renderSegment(
                "R.Arm",
                latestReport.segLeanRightArmPct,
                latestReport.segFatRightArmPct,
              )}
              {renderSegment(
                "L.Arm",
                latestReport.segLeanLeftArmPct,
                latestReport.segFatLeftArmPct,
              )}
              {renderSegment(
                "Trunk",
                latestReport.segLeanTrunkPct,
                latestReport.segFatTrunkPct,
              )}
              {renderSegment(
                "R.Leg",
                latestReport.segLeanRightLegPct,
                latestReport.segFatRightLegPct,
              )}
              {renderSegment(
                "L.Leg",
                latestReport.segLeanLeftLegPct,
                latestReport.segFatLeftLegPct,
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[Typography.heading3, { marginBottom: Spacing.sm }]}>
              No reports yet
            </Text>
            <Text style={Typography.bodySmall}>
              Add your first InBody measurement to see your dashboard.
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
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
  scroll: { padding: Spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadow.sm,
  },
  addButtonText: {
    ...Typography.label,
    color: Colors.textInverse,
    marginVertical: 0,
    fontWeight: "700",
  },
  heroCard: {
    marginBottom: Spacing.xl,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  gaugeContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  statsScroll: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statCol: {
    width: 150,
  },
  chartCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  toggleBtnActive: {
    backgroundColor: Colors.card,
    ...Shadow.sm,
  },
  toggleBtnText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  toggleBtnTextActive: {
    color: Colors.primary,
  },
  segmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  barWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: Spacing.lg,
  },
});
