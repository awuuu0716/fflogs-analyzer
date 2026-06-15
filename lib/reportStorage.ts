'use client';

import type { AnalyzeReportResult } from '@/types/fflogs';

const STORAGE_KEY = 'fflogs-analyzer:reports:v2';

export interface StoredAnalyzeReport {
  reportCode: string;
  reportTitle: string;
  createdAt: string;
  data: AnalyzeReportResult;
}

export function getStoredReports(): StoredAnalyzeReport[] {
  if (typeof window === 'undefined') return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function getStoredReport(
  reportCode: string,
  minFightDurationSeconds?: number,
): StoredAnalyzeReport | null {
  const normalizedReportCode = reportCode.trim().toLowerCase();

  return (
    getStoredReports().find((report) => {
      const hasSameReportCode =
        report.reportCode.trim().toLowerCase() === normalizedReportCode;
      const hasSameDuration =
        minFightDurationSeconds === undefined ||
        report.data.minFightDurationSeconds === minFightDurationSeconds;

      return hasSameReportCode && hasSameDuration;
    }) ?? null
  );
}

export function saveStoredReport(data: AnalyzeReportResult): StoredAnalyzeReport[] {
  const reports = getStoredReports();

  const nextReport: StoredAnalyzeReport = {
    reportCode: data.reportCode,
    reportTitle: data.reportTitle,
    createdAt: new Date().toISOString(),
    data,
  };

  const nextReports = [
    nextReport,
    ...reports.filter(
      (item) =>
        item.reportCode.trim().toLowerCase() !==
        data.reportCode.trim().toLowerCase(),
    ),
  ];

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReports));

  return nextReports;
}

export function removeStoredReport(reportCode: string): StoredAnalyzeReport[] {
  const reports = getStoredReports();

  const nextReports = reports.filter((item) => item.reportCode !== reportCode);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReports));

  return nextReports;
}

export function clearStoredReports(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
