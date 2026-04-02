/**
 * RangeBar — visualizations for metrics against a "normal" range.
 * Renders a track with a highlighted "normal" zone and a marker for the actual value.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Theme, { Colors, Spacing, Radius, Typography } from "../theme";

interface RangeBarProps {
  label: string;
  value: number;
  normalMin: number;
  normalMax: number;
  unit: string;
}

export function RangeBar({
  label,
  value,
  normalMin,
  normalMax,
  unit,
}: RangeBarProps) {
  // Determine visual bounds so the normal range sits comfortably in the middle
  const padding = (normalMax - normalMin) * 0.5;
  const trackMin = Math.min(normalMin - padding, value - padding);
  const trackMax = Math.max(normalMax + padding, value + padding);
  const trackRange = trackMax - trackMin;

  const getPercent = (val: number) => {
    const clamped = Math.max(trackMin, Math.min(trackMax, val));
    return ((clamped - trackMin) / trackRange) * 100;
  };

  const normalLeftPct = getPercent(normalMin);
  const normalWidthPct = getPercent(normalMax) - normalLeftPct;
  const valuePct = getPercent(value);

  const isNormal = value >= normalMin && value <= normalMax;
  const markerColor = isNormal ? Colors.success : Colors.error;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={Typography.label}>{label}</Text>
        <Text style={[Typography.heading3, { color: markerColor }]}>
          {value.toFixed(1)} <Text style={Typography.caption}>{unit}</Text>
        </Text>
      </View>

      <View style={styles.track}>
        {/* The entire track background */}
        <View style={styles.trackBg} />

        {/* The "Normal" range zone (grey/subtle highlight) */}
        <View
          style={[
            styles.normalZone,
            { left: `${normalLeftPct}%`, width: `${normalWidthPct}%` },
          ]}
        />

        {/* The actual value marker */}
        <View
          style={[
            styles.marker,
            { left: `${valuePct}%`, backgroundColor: markerColor },
          ]}
        />
      </View>

      <View style={styles.labels}>
        <Text
          style={[
            Typography.caption,
            { left: `${normalLeftPct}%`, transform: [{ translateX: -10 }] },
          ]}
        >
          {normalMin.toFixed(1)}
        </Text>
        <Text
          style={[
            Typography.caption,
            {
              left: `${normalLeftPct + normalWidthPct}%`,
              transform: [{ translateX: -10 }],
            },
          ]}
        >
          {normalMax.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  track: {
    height: 12,
    justifyContent: "center",
    marginVertical: Spacing.xs,
  },
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
  },
  normalZone: {
    position: "absolute",
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
  },
  marker: {
    position: "absolute",
    width: 6,
    height: 18,
    borderRadius: Radius.full,
    marginLeft: -3,
    ...Theme.Shadow.sm,
  },
  labels: {
    flexDirection: "row",
    marginTop: 4,
    height: 16,
  },
});
