/**
 * Flat TypeScript interface for a single InBody scan result.
 * All fields map 1-to-1 to a SQLite column — no nested objects.
 */
export interface InBodyReport {
  id: string;   // UUID v4
  date: string; // ISO date "YYYY-MM-DD"

  // ── Overall Score ────────────────────────────────────────────────────────
  inbodyScore: number; // 0–100

  // ── Body Composition ─────────────────────────────────────────────────────
  weight: number;            // kg
  totalBodyWater: number;    // L
  protein: number;           // kg
  mineral: number;           // kg
  bodyFatMass: number;       // kg
  fatFreeMass: number;       // kg
  skeletalMuscleMass: number; // kg

  // ── Obesity Indices ──────────────────────────────────────────────────────
  bmi: number;             // kg/m²
  percentBodyFat: number;  // %

  // ── Other Metrics ────────────────────────────────────────────────────────
  visceralFatLevel: number;   // unitless level
  waistHipRatio: number;      // ratio
  basalMetabolicRate: number; // kcal
  obesityDegree: number;      // % (100 = reference)

  // ── Segmental Lean Mass ──────────────────────────────────────────────────
  segLeanLeftArm: number;     segLeanLeftArmPct: number;   // kg, %
  segLeanRightArm: number;    segLeanRightArmPct: number;  // kg, %
  segLeanTrunk: number;       segLeanTrunkPct: number;     // kg, %
  segLeanLeftLeg: number;     segLeanLeftLegPct: number;   // kg, %
  segLeanRightLeg: number;    segLeanRightLegPct: number;  // kg, %

  // ── Segmental Fat Mass ───────────────────────────────────────────────────
  segFatLeftArm: number;      segFatLeftArmPct: number;    // kg, %
  segFatRightArm: number;     segFatRightArmPct: number;   // kg, %
  segFatTrunk: number;        segFatTrunkPct: number;      // kg, %
  segFatLeftLeg: number;      segFatLeftLegPct: number;    // kg, %
  segFatRightLeg: number;     segFatRightLegPct: number;   // kg, %

  // ── Metadata ─────────────────────────────────────────────────────────────
  notes?: string;
}

// ─── Derived / utility types ──────────────────────────────────────────────────

/** Used by list screens — a lightweight subset of the full report. */
export interface InBodyReportSummary
  extends Pick<
    InBodyReport,
    | 'id'
    | 'date'
    | 'inbodyScore'
    | 'weight'
    | 'percentBodyFat'
    | 'skeletalMuscleMass'
    | 'bodyFatMass'
  > {}

/** Input type for the add-report form (id is generated server-side). */
export type InBodyReportInput = Omit<InBodyReport, 'id'>;
