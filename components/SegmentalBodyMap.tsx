/**
 * SegmentalBodyMap — SVG human silhouette with colour-coded segments
 * representing lean or fat mass distribution.
 *
 * Uses react-native-svg for rendering.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText, G } from 'react-native-svg';
import Theme, { Colors, FontSize, Spacing, Radius, Typography } from '../theme';

type Mode = 'lean' | 'fat';

/** Shape of the segmental data object passed to this component. */
interface SegmentalData {
  leftArm: { val: number; pct: number };
  rightArm: { val: number; pct: number };
  trunk: { val: number; pct: number };
  leftLeg: { val: number; pct: number };
  rightLeg: { val: number; pct: number };
}

interface SegmentalBodyMapProps {
  lean?: SegmentalData;
  fat?: SegmentalData;
  mode?: Mode;
  /** Width of the component (height is 1.8× width) */
  width?: number;
}

/** Maps a segment value to a fill colour by intensity (0–1 normalised). */
function valueToColor(value: number, max: number, mode: Mode): string {
  const intensity = Math.min(value / max, 1);
  if (mode === 'lean') {
    // Blue → Teal gradient
    const r = Math.round(91 + (0 - 91) * intensity);
    const g = Math.round(138 + (196 - 138) * intensity);
    const b = Math.round(247 + (154 - 247) * intensity);
    return `rgb(${r},${g},${b})`;
  } else {
    // Teal → Red gradient
    const r = Math.round(0 + (255 - 0) * intensity);
    const g = Math.round(196 + (107 - 196) * intensity);
    const b = Math.round(154 + (107 - 154) * intensity);
    return `rgb(${r},${g},${b})`;
  }
}

const VIEWBOX_W = 100;
const VIEWBOX_H = 180;

export function SegmentalBodyMap({
  lean,
  fat,
  mode = 'lean',
  width = 160, 
}: SegmentalBodyMapProps) {
  const height = 280; 
  const svgWidth = (height * VIEWBOX_W) / VIEWBOX_H;

  const data = mode === 'lean' ? lean : fat;
  const maxVal = data
    ? Math.max(
        data.trunk.val,
        data.rightArm.val,
        data.leftArm.val,
        data.rightLeg.val,
        data.leftLeg.val
      )
    : 1;

  const StatPill = ({
    label,
    seg,
    style,
  }: {
    label: string;
    seg?: { val: number; pct: number };
    style: any;
  }) => {
    if (!seg) return null;

    let pctColor: string = '#00C97B'; // green (normal)
    if (mode === 'lean') {
      if (seg.pct < 90) pctColor = '#FF4444'; // red (under)
      else if (seg.pct > 110) pctColor = '#FF6B35'; // orange (over)
    } else {
      if (seg.pct > 100) pctColor = '#FF6B35'; // orange (over fat)
    }

    return (
      <View style={[styles.statPill, style]}>
        <Text style={styles.pillLabel}>{label}</Text>
        <Text style={styles.pillKg}>{seg.val.toFixed(2)} kg</Text>
        <Text style={[styles.pillPct, { color: pctColor }]}>{seg.pct.toFixed(1)}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.modeLabel}>{mode === 'lean' ? 'Lean Mass' : 'Fat Mass'}</Text>

      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        style={styles.svg}
      >
        {/* Head */}
        <Circle cx="50" cy="14" r="11" fill={Colors.surfaceElevated} stroke={Colors.border} strokeWidth="1" />

        {/* Trunk */}
        <G>
          <Path
            d="M36 28 Q30 32 29 60 L34 80 Q50 83 66 80 L71 60 Q70 32 64 28 Z"
            fill={valueToColor(data?.trunk.val ?? 0, maxVal, mode)}
            stroke={Colors.border}
            strokeWidth="0.5"
          />
        </G>

        {/* Right arm (user's right, visually left) */}
        <G>
          <Path
            d="M36 30 Q28 34 24 50 L22 75 Q26 77 30 74 L32 55 Q35 40 38 34 Z"
            fill={valueToColor(data?.rightArm.val ?? 0, maxVal, mode)}
            stroke={Colors.border}
            strokeWidth="0.5"
          />
        </G>

        {/* Left arm (user's left, visually right) */}
        <G>
          <Path
            d="M64 30 Q72 34 76 50 L78 75 Q74 77 70 74 L68 55 Q65 40 62 34 Z"
            fill={valueToColor(data?.leftArm.val ?? 0, maxVal, mode)}
            stroke={Colors.border}
            strokeWidth="0.5"
          />
        </G>

        {/* Right leg (user's right, visually left) */}
        <G>
          <Path
            d="M34 80 Q30 90 29 110 L28 140 Q32 145 38 143 L40 115 L42 82 Z"
            fill={valueToColor(data?.rightLeg.val ?? 0, maxVal, mode)}
            stroke={Colors.border}
            strokeWidth="0.5"
          />
        </G>

        {/* Left leg (user's left, visually right) */}
        <G>
          <Path
            d="M66 80 Q70 90 71 110 L72 140 Q68 145 62 143 L60 115 L58 82 Z"
            fill={valueToColor(data?.leftLeg.val ?? 0, maxVal, mode)}
            stroke={Colors.border}
            strokeWidth="0.5"
          />
        </G>
      </Svg>

      {/* Stats Overlays */}
      {data && (
        <>
          <StatPill
            label="R.ARM"
            seg={data.rightArm}
            style={{ left: '5%', top: '35%' }}
          />
          <StatPill
            label="L.ARM"
            seg={data.leftArm}
            style={{ right: '5%', top: '35%' }}
          />
          <StatPill label="TRUNK" seg={data.trunk} style={{ top: '45%' }} />
          <StatPill
            label="R.LEG"
            seg={data.rightLeg}
            style={{ left: '5%', bottom: '25%' }}
          />
          <StatPill
            label="L.LEG"
            seg={data.leftLeg}
            style={{ right: '5%', bottom: '25%' }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    position: 'relative',
  },
  modeLabel: {
    fontSize: 18,
    color: '#00E5FF',
    fontFamily: 'BebasNeue_400Regular',
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  svg: {
    marginBottom: Spacing.md,
  },
  statPill: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 70,
  },
  pillLabel: {
    fontSize: 9,
    color: '#6B7A99',
    textTransform: 'uppercase',
    fontFamily: Theme.FontFamily.bodyMedium,
  },
  pillKg: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: Theme.FontFamily.bodyBold,
  },
  pillPct: {
    fontSize: 13,
    fontFamily: Theme.FontFamily.bodyMedium,
  },
});
