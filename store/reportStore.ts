/**
 * Zustand store for InBody reports.
 *
 * In-memory cache over SQLite. Call `loadReports()` once on app startup.
 * The new InBodyReport is flat — no nested composition/segmental objects.
 */

import { create } from 'zustand';
import { format } from 'date-fns';
import type { InBodyReport, InBodyReportInput, InBodyReportSummary } from '../types/report';
import {
  getAllReports,
  getReportById,
  insertReport,
  updateReport as updateReportDb,
  updateReportDate,
  deleteReport,
  getReportDates,
} from '../db/queries';

// ─── Store Shape ──────────────────────────────────────────────────────────────

interface ReportState {
  /** Lightweight summaries for list / dashboard rendering. */
  reports: InBodyReportSummary[];
  /** YYYY-MM-DD strings for calendar markers. */
  reportDates: string[];
  isLoading: boolean;
  error: string | null;

  loadReports: () => Promise<void>;
  loadReportDates: () => Promise<void>;

  /** Persist a new report to SQLite and refresh the cache. */
  addReport: (input: InBodyReportInput) => Promise<string>;

  /** Update an existing report using its id and fresh inputs. */
  updateReport: (id: string, input: InBodyReportInput) => Promise<void>;

  /** Change just the date of a report. */
  updateDate: (id: string, newDate: string) => Promise<void>;

  /** Delete a report and refresh the cache. */
  removeReport: (id: string) => Promise<void>;

  /** Always reads from the DB (not cached). */
  fetchReportById: (id: string) => Promise<InBodyReport | null>;

  /** Today as "YYYY-MM-DD" — convenient default for the form. */
  todayDateString: () => string;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useReportStore = create<ReportState>((set, get) => ({
  reports: [],
  reportDates: [],
  isLoading: false,
  error: null,

  loadReports: async () => {
    set({ isLoading: true, error: null });
    try {
      const reports = await getAllReports();
      set({ reports, isLoading: false });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  loadReportDates: async () => {
    try {
      const reportDates = await getReportDates();
      set({ reportDates });
    } catch (err) {
      set({ error: String(err) });
    }
  },

  addReport: async (input) => {
    const id = await insertReport({ ...input, id: '' });
    await get().loadReports();
    await get().loadReportDates();
    return id;
  },

  updateReport: async (id, input) => {
    set({ isLoading: true, error: null });
    try {
      await updateReportDb({ id, ...input });
      const reports = await getAllReports();
      const reportDates = await getReportDates();
      set({ reports, reportDates, isLoading: false });
    } catch (e: unknown) {
      set({ error: String(e), isLoading: false });
      throw e;
    }
  },

  updateDate: async (id, newDate) => {
    await updateReportDate(id, newDate);
    await get().loadReports();
    await get().loadReportDates();
  },

  removeReport: async (id) => {
    await deleteReport(id);
    set((state) => ({
      reports: state.reports.filter((r) => r.id !== id),
    }));
    await get().loadReportDates();
  },

  fetchReportById: (id) => getReportById(id),

  todayDateString: () => format(new Date(), 'yyyy-MM-dd'),
}));
