/**
 * StatCard — displays a single metric with label, value, unit, and optional delta.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, Radius, Shadow } from '../theme';

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  /** Positive or negative change from the previous measurement */
  delta?: number;
  /** Override card background */
  backgroundColor?: string;
  /** Show a coloured left accent border */
  accentColor?: string;
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  backgroundColor = Colors.surface,
  accentColor = Colors.primary,
}: StatCardProps) {
  const hasDelta = delta !== undefined && delta !== 0;
  const isPositive = (delta ?? 0) > 0;
  const deltaColor = isPositive ? Colors.accent : Colors.success;
  const deltaSign = isPositive ? '+' : '';

  return (
    <View style={[styles.card, { backgroundColor }, Shadow.sm]}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>

        <View style={styles.valueRow}>
          <Text style={styles.value}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </Text>
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>

        {hasDelta && (
          <Text style={[styles.delta, { color: deltaColor }]}>
            {deltaSign}
            {delta!.toFixed(1)} {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginVertical: Spacing.xs,
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  value: {
    fontSize: FontSize['2xl'],
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  unit: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  delta: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xxs,
    fontWeight: '600',
  },
});
