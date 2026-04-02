/**
 * Report detail screen
 * Full breakdown of every metric with Range Bars, Segmental body maps,
 * InBody Score gauge, and Export functionality.
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { format, parseISO } from "date-fns";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

import { useReportStore } from "../../store/reportStore";
import { ScoreGauge } from "../../components/ScoreGauge";
import { RangeBar } from "../../components/RangeBar";
import { SegmentalBodyMap } from "../../components/SegmentalBodyMap";
import Theme, {
  Colors,
  Spacing,
  Radius,
  Typography,
  Shadow,
} from "../../theme";
import type { InBodyReport } from "../../types/report";
import type { RootStackParamList } from "../../App";

type DetailNav = NativeStackNavigationProp<RootStackParamList, "ReportDetail">;
type DetailRoute = RouteProp<RootStackParamList, "ReportDetail">;

export default function ReportDetailScreen() {
  const navigation = useNavigation<DetailNav>();
  const route = useRoute<DetailRoute>();
  const { id } = route.params;

  const { fetchReportById, removeReport } = useReportStore();
  const [report, setReport] = useState<InBodyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Setup header buttons once report loads
  useEffect(() => {
    fetchReportById(id)
      .then((r) => {
        setReport(r);
        setLoading(false);

        if (r) {
          navigation.setOptions({
            headerTitle: format(parseISO(r.date), "MMMM d, yyyy"),
            headerRight: () => (
              <View style={{ flexDirection: "row", gap: Spacing.md }}>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      const text = `InBody Scan: ${r.date}\nScore: ${Math.round(r.inbodyScore)}\nWeight: ${r.weight}kg\nSMM: ${r.skeletalMuscleMass}kg\nFat: ${r.percentBodyFat}%\nBMI: ${r.bmi}\nVisceral Fat: ${r.visceralFatLevel}`;
                      const uri =
                        (FileSystem as any).documentDirectory +
                        `InBody_${r.date}.txt`;
                      await FileSystem.writeAsStringAsync(uri, text);
                      await Sharing.shareAsync(uri, {
                        UTI: "public.plain-text",
                        dialogTitle: "Export Report",
                      });
                    } catch (e) {
                      Alert.alert("Error", "Failed to share report.");
                    }
                  }}
                >
                  <Text style={{ ...Typography.heading3, color: Colors.primary }}>
                    Share
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("AddReport", { reportId: r.id })
                  }
                >
                  <Text style={{ ...Typography.heading3, color: Colors.primary }}>
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
            ),
          });
        }
      })
      .catch(() => {
        setReport(null);
        setLoading(false);
      });
  }, [id, fetchReportById, navigation]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Report",
      "Are you sure you want to delete this report?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeReport(id);
            navigation.navigate("MainTabs");
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={Typography.body}>Report not found.</Text>
      </View>
    );
  }

  const leanData = {
    leftArm: { val: report.segLeanLeftArm, pct: report.segLeanLeftArmPct },
    rightArm: { val: report.segLeanRightArm, pct: report.segLeanRightArmPct },
    trunk: { val: report.segLeanTrunk, pct: report.segLeanTrunkPct },
    leftLeg: { val: report.segLeanLeftLeg, pct: report.segLeanLeftLegPct },
    rightLeg: { val: report.segLeanRightLeg, pct: report.segLeanRightLegPct },
  };

  const fatData = {
    leftArm: { val: report.segFatLeftArm, pct: report.segFatLeftArmPct },
    rightArm: { val: report.segFatRightArm, pct: report.segFatRightArmPct },
    trunk: { val: report.segFatTrunk, pct: report.segFatTrunkPct },
    leftLeg: { val: report.segFatLeftLeg, pct: report.segFatLeftLegPct },
    rightLeg: { val: report.segFatRightLeg, pct: report.segFatRightLegPct },
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {/* Top Gauge */}
      <View style={{ alignSelf: "center", marginBottom: Spacing.xl }}>
        <ScoreGauge score={report.inbodyScore} size={220} strokeWidth={18} />
      </View>

      {/* Range Bars Breakdown */}
      <View style={Theme.CardStyle}>
        <Text style={[Typography.heading3, { marginBottom: Spacing.lg }]}>
          Body Composition
        </Text>
        <RangeBar
          label="Weight"
          value={report.weight}
          normalMin={65}
          normalMax={85}
          unit="kg"
        />
        <RangeBar
          label="Skeletal Muscle Mass"
          value={report.skeletalMuscleMass}
          normalMin={30}
          normalMax={40}
          unit="kg"
        />
        <RangeBar
          label="Body Fat Mass"
          value={report.bodyFatMass}
          normalMin={10}
          normalMax={20}
          unit="kg"
        />
        <RangeBar
          label="Total Body Water"
          value={report.totalBodyWater}
          normalMin={40}
          normalMax={55}
          unit="L"
        />
        <RangeBar
          label="Protein"
          value={report.protein}
          normalMin={10}
          normalMax={15}
          unit="kg"
        />
        <RangeBar
          label="Mineral"
          value={report.mineral}
          normalMin={3.5}
          normalMax={4.5}
          unit="kg"
        />
      </View>

      <View style={[Theme.CardStyle, { marginTop: Spacing.xl }]}>
        <Text style={[Typography.heading3, { marginBottom: Spacing.lg }]}>
          Obesity Indicators
        </Text>
        <RangeBar
          label="BMI"
          value={report.bmi}
          normalMin={18.5}
          normalMax={25.0}
          unit="kg/m²"
        />
        <RangeBar
          label="Percent Body Fat"
          value={report.percentBodyFat}
          normalMin={10}
          normalMax={20}
          unit="%"
        />
        <RangeBar
          label="Visceral Fat Level"
          value={report.visceralFatLevel}
          normalMin={1}
          normalMax={9}
          unit=""
        />
        <RangeBar
          label="Waist-Hip Ratio"
          value={report.waistHipRatio}
          normalMin={0.8}
          normalMax={0.9}
          unit=""
        />
        <RangeBar
          label="Basal Metabolic Rate"
          value={report.basalMetabolicRate}
          normalMin={1600}
          normalMax={2000}
          unit="kcal"
        />
      </View>

      <Text
        style={[
          Typography.heading3,
          { marginTop: Spacing.xl, marginBottom: Spacing.md },
        ]}
      >
        Segmental Balance
      </Text>

      <View style={styles.segmentalScrollContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={310} // 300 width + 10 margin
          decelerationRate="fast"
          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            setPageIndex(offset > 150 ? 1 : 0);
            if (showSwipeHint) setShowSwipeHint(false);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: (Dimensions.get('window').width - 340) / 2 }}
        >
          <View style={styles.segmentCard}>
            <SegmentalBodyMap mode="lean" lean={leanData} />
          </View>
          <View style={styles.segmentCard}>
            <SegmentalBodyMap mode="fat" fat={fatData} />
          </View>
        </ScrollView>

        {/* Swipe Hint */}
        {showSwipeHint && (
          <Text style={styles.swipeHint}>← Swipe to see Fat Mass →</Text>
        )}

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          <View style={[styles.dot, pageIndex === 0 && styles.dotActive]} />
          <View style={[styles.dot, pageIndex === 1 && styles.dotActive]} />
        </View>
      </View>

      {report.notes ? (
        <View style={[Theme.CardStyle, { marginTop: Spacing.xl }]}>
          <Text style={[Typography.label, { marginBottom: Spacing.xs }]}>
            Notes
          </Text>
          <Text style={Typography.body}>{report.notes}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Report</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing["4xl"] }} />
    </ScrollView>
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
  segmentalScrollContainer: {
    marginHorizontal: -Spacing.xl,
    alignItems: "center",
  },
  segmentCard: {
    width: 300,
    marginHorizontal: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
    marginTop: Spacing.md,
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  swipeHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  deleteButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteButtonText: {
    ...Typography.heading3,
    color: Colors.error,
  },
});
