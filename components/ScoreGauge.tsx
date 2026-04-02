/**
 * ScoreGauge — semi-circular arc gauge for the InBody score (0–100).
 * Rendered fully in SVG via react-native-svg for crisp display at any DPI.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { Colors, FontSize, Spacing, Radius } from '../theme';

interface ScoreGaugeProps {
  score: number;       // 0–100
  size?: number;       // diameter of the gauge
  strokeWidth?: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

function scoreToColor(score: number): string {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.primary;
  if (score >= 40) return Colors.warning;
  return Colors.error;
}

/** Label for the score range */
function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Average';
  return 'Below Avg';
}

const START_ANGLE = -150;  // degrees
const END_ANGLE = 150;     // degrees (300° sweep)

export function ScoreGauge({ score, size = 180, strokeWidth = 14 }: ScoreGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - strokeWidth * 2) / 2;

  const clampedScore = Math.max(0, Math.min(100, score));
  const fillAngle = START_ANGLE + (END_ANGLE - START_ANGLE) * (clampedScore / 100);

  const trackPath = arc(cx, cy, r, START_ANGLE, END_ANGLE);
  const fillPath = arc(cx, cy, r, START_ANGLE, fillAngle);
  const color = scoreToColor(clampedScore);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <Path
          d={trackPath}
          stroke={Colors.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Fill */}
        <Path
          d={fillPath}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <Circle cx={cx} cy={cy} r={strokeWidth / 2 - 1} fill={color} />

        {/* Score text */}
        <SvgText
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={size * 0.2}
          fontWeight="700"
          fill={Colors.textPrimary}
        >
          {Math.round(clampedScore)}
        </SvgText>

        {/* Label */}
        <SvgText
          x={cx}
          y={cy + size * 0.12}
          textAnchor="middle"
          fontSize={size * 0.07}
          fill={Colors.textSecondary}
        >
          {scoreLabel(clampedScore)}
        </SvgText>
      </Svg>

      <Text style={styles.caption}>InBody Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  caption: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: -Spacing.sm,
  },
});
