/**
 * SQLite schema for inbody.db.
 *
 * Every InBodyReport field maps to its own column (REAL or TEXT).
 * This lets us query/sort/filter on any metric without deserialising JSON.
 */

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS reports (
    -- identity
    id                  TEXT PRIMARY KEY NOT NULL,
    date                TEXT NOT NULL,

    -- overall
    inbodyScore         REAL NOT NULL DEFAULT 0,

    -- body composition
    weight              REAL NOT NULL DEFAULT 0,
    totalBodyWater      REAL NOT NULL DEFAULT 0,
    protein             REAL NOT NULL DEFAULT 0,
    mineral             REAL NOT NULL DEFAULT 0,
    bodyFatMass         REAL NOT NULL DEFAULT 0,
    fatFreeMass         REAL NOT NULL DEFAULT 0,
    skeletalMuscleMass  REAL NOT NULL DEFAULT 0,

    -- obesity indices
    bmi                 REAL NOT NULL DEFAULT 0,
    percentBodyFat      REAL NOT NULL DEFAULT 0,

    -- other metrics
    visceralFatLevel    REAL NOT NULL DEFAULT 0,
    waistHipRatio       REAL NOT NULL DEFAULT 0,
    basalMetabolicRate  REAL NOT NULL DEFAULT 0,
    obesityDegree       REAL NOT NULL DEFAULT 0,

    -- segmental lean (kg + %)
    segLeanLeftArm      REAL NOT NULL DEFAULT 0,
    segLeanLeftArmPct   REAL NOT NULL DEFAULT 0,
    segLeanRightArm     REAL NOT NULL DEFAULT 0,
    segLeanRightArmPct  REAL NOT NULL DEFAULT 0,
    segLeanTrunk        REAL NOT NULL DEFAULT 0,
    segLeanTrunkPct     REAL NOT NULL DEFAULT 0,
    segLeanLeftLeg      REAL NOT NULL DEFAULT 0,
    segLeanLeftLegPct   REAL NOT NULL DEFAULT 0,
    segLeanRightLeg     REAL NOT NULL DEFAULT 0,
    segLeanRightLegPct  REAL NOT NULL DEFAULT 0,

    -- segmental fat (kg + %)
    segFatLeftArm       REAL NOT NULL DEFAULT 0,
    segFatLeftArmPct    REAL NOT NULL DEFAULT 0,
    segFatRightArm      REAL NOT NULL DEFAULT 0,
    segFatRightArmPct   REAL NOT NULL DEFAULT 0,
    segFatTrunk         REAL NOT NULL DEFAULT 0,
    segFatTrunkPct      REAL NOT NULL DEFAULT 0,
    segFatLeftLeg       REAL NOT NULL DEFAULT 0,
    segFatLeftLegPct    REAL NOT NULL DEFAULT 0,
    segFatRightLeg      REAL NOT NULL DEFAULT 0,
    segFatRightLegPct   REAL NOT NULL DEFAULT 0,

    -- optional text
    notes               TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_reports_date ON reports (date DESC);
`;

/** Bump this and add an entry to MIGRATIONS whenever the schema changes. */
export const SCHEMA_VERSION = 2;

/** SQL to run when upgrading from (key-1) → key. */
export const MIGRATIONS: Record<number, string> = {
  // v2: dropped JSON blob column, expanded to full flat schema
};
