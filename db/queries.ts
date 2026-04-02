/**
 * All SQLite read/write helpers for InBody reports.
 *
 * Uses expo-sqlite v14 async API (Expo SDK 52+).
 * Every InBodyReport field is stored in its own column — no JSON blobs.
 */

import * as SQLite from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { InBodyReport, InBodyReportSummary } from '../types/report';
import { CREATE_TABLES_SQL } from './schema';

// ─── DB Singleton ─────────────────────────────────────────────────────────────

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('inbody.db');
  await _db.execAsync(CREATE_TABLES_SQL);
  await seedIfEmpty(_db);
  return _db;
}

// ─── Row ↔ Report mapping ─────────────────────────────────────────────────────

/** SQLite row shape returned by getAllAsync / getFirstAsync. */
type ReportRow = {
  id: string;
  date: string;
  inbodyScore: number;
  weight: number;
  totalBodyWater: number;
  protein: number;
  mineral: number;
  bodyFatMass: number;
  fatFreeMass: number;
  skeletalMuscleMass: number;
  bmi: number;
  percentBodyFat: number;
  visceralFatLevel: number;
  waistHipRatio: number;
  basalMetabolicRate: number;
  obesityDegree: number;
  segLeanLeftArm: number;
  segLeanLeftArmPct: number;
  segLeanRightArm: number;
  segLeanRightArmPct: number;
  segLeanTrunk: number;
  segLeanTrunkPct: number;
  segLeanLeftLeg: number;
  segLeanLeftLegPct: number;
  segLeanRightLeg: number;
  segLeanRightLegPct: number;
  segFatLeftArm: number;
  segFatLeftArmPct: number;
  segFatRightArm: number;
  segFatRightArmPct: number;
  segFatTrunk: number;
  segFatTrunkPct: number;
  segFatLeftLeg: number;
  segFatLeftLegPct: number;
  segFatRightLeg: number;
  segFatRightLegPct: number;
  notes: string | null;
};

function rowToReport(r: ReportRow): InBodyReport {
  return {
    id: r.id,
    date: r.date,
    inbodyScore: r.inbodyScore,
    weight: r.weight,
    totalBodyWater: r.totalBodyWater,
    protein: r.protein,
    mineral: r.mineral,
    bodyFatMass: r.bodyFatMass,
    fatFreeMass: r.fatFreeMass,
    skeletalMuscleMass: r.skeletalMuscleMass,
    bmi: r.bmi,
    percentBodyFat: r.percentBodyFat,
    visceralFatLevel: r.visceralFatLevel,
    waistHipRatio: r.waistHipRatio,
    basalMetabolicRate: r.basalMetabolicRate,
    obesityDegree: r.obesityDegree,
    segLeanLeftArm: r.segLeanLeftArm,
    segLeanLeftArmPct: r.segLeanLeftArmPct,
    segLeanRightArm: r.segLeanRightArm,
    segLeanRightArmPct: r.segLeanRightArmPct,
    segLeanTrunk: r.segLeanTrunk,
    segLeanTrunkPct: r.segLeanTrunkPct,
    segLeanLeftLeg: r.segLeanLeftLeg,
    segLeanLeftLegPct: r.segLeanLeftLegPct,
    segLeanRightLeg: r.segLeanRightLeg,
    segLeanRightLegPct: r.segLeanRightLegPct,
    segFatLeftArm: r.segFatLeftArm,
    segFatLeftArmPct: r.segFatLeftArmPct,
    segFatRightArm: r.segFatRightArm,
    segFatRightArmPct: r.segFatRightArmPct,
    segFatTrunk: r.segFatTrunk,
    segFatTrunkPct: r.segFatTrunkPct,
    segFatLeftLeg: r.segFatLeftLeg,
    segFatLeftLegPct: r.segFatLeftLegPct,
    segFatRightLeg: r.segFatRightLeg,
    segFatRightLegPct: r.segFatRightLegPct,
    notes: r.notes ?? undefined,
  };
}

function rowToSummary(r: ReportRow): InBodyReportSummary {
  return {
    id: r.id,
    date: r.date,
    inbodyScore: r.inbodyScore,
    weight: r.weight,
    percentBodyFat: r.percentBodyFat,
    skeletalMuscleMass: r.skeletalMuscleMass,
    bodyFatMass: r.bodyFatMass,
  };
}

// ─── INSERT columns (all 36 REAL + id/date/notes) ────────────────────────────

const INSERT_SQL = `
  INSERT OR REPLACE INTO reports (
    id, date, inbodyScore,
    weight, totalBodyWater, protein, mineral, bodyFatMass, fatFreeMass, skeletalMuscleMass,
    bmi, percentBodyFat,
    visceralFatLevel, waistHipRatio, basalMetabolicRate, obesityDegree,
    segLeanLeftArm, segLeanLeftArmPct,
    segLeanRightArm, segLeanRightArmPct,
    segLeanTrunk, segLeanTrunkPct,
    segLeanLeftLeg, segLeanLeftLegPct,
    segLeanRightLeg, segLeanRightLegPct,
    segFatLeftArm, segFatLeftArmPct,
    segFatRightArm, segFatRightArmPct,
    segFatTrunk, segFatTrunkPct,
    segFatLeftLeg, segFatLeftLegPct,
    segFatRightLeg, segFatRightLegPct,
    notes
  ) VALUES (
    ?,?,?,
    ?,?,?,?,?,?,?,
    ?,?,
    ?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,
    ?,?,?,?,?,?,?,?,?,?,
    ?
  )
`;

function reportToParams(r: InBodyReport): SQLite.SQLiteBindParams {
  return [
    r.id, r.date, r.inbodyScore,
    r.weight, r.totalBodyWater, r.protein, r.mineral, r.bodyFatMass, r.fatFreeMass, r.skeletalMuscleMass,
    r.bmi, r.percentBodyFat,
    r.visceralFatLevel, r.waistHipRatio, r.basalMetabolicRate, r.obesityDegree,
    r.segLeanLeftArm, r.segLeanLeftArmPct,
    r.segLeanRightArm, r.segLeanRightArmPct,
    r.segLeanTrunk, r.segLeanTrunkPct,
    r.segLeanLeftLeg, r.segLeanLeftLegPct,
    r.segLeanRightLeg, r.segLeanRightLegPct,
    r.segFatLeftArm, r.segFatLeftArmPct,
    r.segFatRightArm, r.segFatRightArmPct,
    r.segFatTrunk, r.segFatTrunkPct,
    r.segFatLeftLeg, r.segFatLeftLegPct,
    r.segFatRightLeg, r.segFatRightLegPct,
    r.notes ?? null,
  ];
}

// ─── Seeding ──────────────────────────────────────────────────────────────────

/**
 * Inserts one example report on first launch (when the table is empty).
 * Values are from a real InBody 770 scan on 2026-03-15.
 */
async function seedIfEmpty(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM reports');
  if ((row?.n ?? 0) > 0) return;

  const seed: InBodyReport = {
    id: randomUUID(),
    date: '2026-03-15',
    inbodyScore: 63,

    weight: 109.5,
    totalBodyWater: 42.8,
    protein: 11.7,
    mineral: 4.26,
    bodyFatMass: 39.0,
    fatFreeMass: 70.5,
    skeletalMuscleMass: 40.2,

    bmi: 33.4,
    percentBodyFat: 35.6,

    visceralFatLevel: 18,
    waistHipRatio: 1.09,
    basalMetabolicRate: 1892,
    obesityDegree: 144,

    // Segmental lean – plausible values for a 109.5 kg male
    segLeanLeftArm: 3.15,  segLeanLeftArmPct: 95.7,
    segLeanRightArm: 3.22, segLeanRightArmPct: 97.1,
    segLeanTrunk: 29.1,    segLeanTrunkPct: 101.2,
    segLeanLeftLeg: 9.82,  segLeanLeftLegPct: 96.4,
    segLeanRightLeg: 9.91, segLeanRightLegPct: 97.0,

    // Segmental fat
    segFatLeftArm: 1.95,   segFatLeftArmPct: 32.1,
    segFatRightArm: 1.98,  segFatRightArmPct: 32.7,
    segFatTrunk: 22.4,     segFatTrunkPct: 38.2,
    segFatLeftLeg: 6.31,   segFatLeftLegPct: 35.0,
    segFatRightLeg: 6.36,  segFatRightLegPct: 35.4,

    notes: 'Seed data – first InBody scan',
  };

  await db.runAsync(INSERT_SQL, reportToParams(seed));
}

// ─── Public Query API ─────────────────────────────────────────────────────────

/** Insert a brand-new report. A UUID is generated automatically if id is empty. Returns the final id. */
export async function insertReport(report: InBodyReport): Promise<string> {
  const db = await getDatabase();
  const id = report.id || randomUUID();
  const r = { ...report, id };
  await db.runAsync(INSERT_SQL, reportToParams(r));
  return id;
}

/** Update a full report (replaces existing row). */
export async function updateReport(report: InBodyReport): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(INSERT_SQL, reportToParams(report));
}

/** Return all reports ordered by date descending (summary columns only). */
export async function getAllReports(): Promise<InBodyReportSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportRow>(
    `SELECT id, date, inbodyScore, weight, percentBodyFat, skeletalMuscleMass, bodyFatMass
     FROM reports ORDER BY date DESC`,
  );
  return rows.map(rowToSummary);
}

/** Return a single full report by id, or null if it does not exist. */
export async function getReportById(id: string): Promise<InBodyReport | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ReportRow>(
    'SELECT * FROM reports WHERE id = ?',
    id,
  );
  return row ? rowToReport(row) : null;
}

/** Update the measurement date of a report without touching any other field. */
export async function updateReportDate(id: string, newDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE reports SET date = ? WHERE id = ?',
    newDate,
    id,
  );
}

/** Permanently delete a report. */
export async function deleteReport(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reports WHERE id = ?', id);
}

// ─── Convenience helpers (used by store / calendar) ──────────────────────────

/** All distinct dates that have at least one report (for calendar markers). */
export async function getReportDates(): Promise<string[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string }>(
    'SELECT DISTINCT date FROM reports ORDER BY date DESC',
  );
  return rows.map((r) => r.date);
}

/** All reports for a specific YYYY-MM-DD date, ordered newest-first. */
export async function getReportsByDate(date: string): Promise<InBodyReportSummary[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ReportRow>(
    `SELECT id, date, inbodyScore, weight, percentBodyFat, skeletalMuscleMass, bodyFatMass
     FROM reports WHERE date = ? ORDER BY rowid DESC`,
    date,
  );
  return rows.map(rowToSummary);
}
