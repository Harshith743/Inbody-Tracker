/**
 * TrendChart — time-series line chart wrapping react-native-gifted-charts.
 * Automatically formats X-axis dates and applies the brand colour palette.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { format, parseISO } from 'date-fns';
import { Colors, FontSize, Spacing, Radius } from '../theme';

interface DataPoint {
  date: string;   // ISO date string "YYYY-MM-DD"
  value: number;
}

interface TrendChartProps {
  data: DataPoint[];
  label?: string;
  unit?: string;
  color?: string;
  height?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

export function TrendChart({
  data,
  label,
  unit,
  color = Colors.primary,
  height = 180,
}: TrendChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>Not enough data to display a trend</Text>
      </View>
    );
  }

  const chartData = data.map((d) => ({
    value: d.value,
    label: format(parseISO(d.date), 'MMM d'),
    dataPointText: d.value.toFixed(1),
  }));

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.15 || 1;

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>
      ) : null}

      <LineChart
        data={chartData}
        width={CHART_WIDTH}
        height={height}
        color={color}
        thickness={2.5}
        dataPointsColor={color}
        dataPointsRadius={4}
        startFillColor={color}
        endFillColor={Colors.background}
        startOpacity={0.25}
        endOpacity={0.02}
        areaChart
        curved
        hideRules={false}
        rulesColor={Colors.border}
        rulesType="solid"
        yAxisColor={Colors.border}
        xAxisColor={Colors.border}
        yAxisTextStyle={styles.axisText}
        xAxisLabelTextStyle={styles.axisText}
        maxValue={maxVal + padding}
        noOfSections={4}
        backgroundColor={Colors.surface}
        initialSpacing={Spacing.lg}
        endSpacing={Spacing.lg}
        isAnimated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  unit: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  axisText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  empty: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
