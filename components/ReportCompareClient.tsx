'use client';

import { useEffect, useMemo, useState } from 'react';
import { CompareSummaryCards } from './CompareSummaryCards';
import { CompareTable } from './CompareTable';
import { CompareCharts } from './CompareCharts';
import {
  getStoredReports,
  removeStoredReport,
  type StoredAnalyzeReport,
} from '@/lib/reportStorage';
import type { CompareReportsResponse } from '@/types/compare';

export function ReportCompareClient() {
  const [reports, setReports] = useState<StoredAnalyzeReport[]>([]);
  const [beforeReportCode, setBeforeReportCode] = useState('');
  const [afterReportCode, setAfterReportCode] = useState('');
  const [result, setResult] = useState<CompareReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedReports = getStoredReports();
    setReports(storedReports);

    if (storedReports[1]) {
      setBeforeReportCode(storedReports[1].reportCode);
    }

    if (storedReports[0]) {
      setAfterReportCode(storedReports[0].reportCode);
    }
  }, []);

  const beforeReport = useMemo(() => {
    return reports.find((item) => item.reportCode === beforeReportCode) ?? null;
  }, [reports, beforeReportCode]);

  const afterReport = useMemo(() => {
    return reports.find((item) => item.reportCode === afterReportCode) ?? null;
  }, [reports, afterReportCode]);

  async function handleCompare() {
    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      if (!beforeReport) {
        throw new Error('請選擇 Before 報告');
      }

      if (!afterReport) {
        throw new Error('請選擇 After 報告');
      }

      if (beforeReport.reportCode === afterReport.reportCode) {
        throw new Error('Before / After 不應該選同一份報告');
      }

      const res = await fetch('/api/reports/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          before: beforeReport.data.summary,
          after: afterReport.data.summary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '比較失敗');
      }

      setResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '比較失敗';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  function handleRefreshReports() {
    setReports(getStoredReports());
  }

  function handleRemoveReport(reportCode: string) {
    const nextReports = removeStoredReport(reportCode);
    setReports(nextReports);

    if (beforeReportCode === reportCode) {
      setBeforeReportCode('');
    }

    if (afterReportCode === reportCode) {
      setAfterReportCode('');
    }

    setResult(null);
  }

  function handleDownloadJson() {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    const before = beforeReport?.reportCode ?? 'before';
    const after = afterReport?.reportCode ?? 'after';

    a.href = url;
    a.download = `${before}-vs-${after}-compare-result.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-2 text-3xl font-bold">FFLogs 玩家 rDPS 前後比較</h1>

      <p className="mb-6 text-gray-600">
        從本機 localStorage 選擇兩份已分析報告，依照玩家 name + job 對應計算差異。
      </p>

      <section className="mb-6 rounded-xl border  p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">選擇報告</h2>
            <p className="text-sm text-gray-600">
              目前已儲存 {reports.length} 份報告
            </p>
          </div>

          <button
            onClick={handleRefreshReports}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            重新讀取
          </button>
        </div>

        {reports.length < 2 ? (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            至少需要兩份已分析報告。請先回到分析頁產生兩份 report。
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <ReportSelect
                label="Before"
                value={beforeReportCode}
                onChange={setBeforeReportCode}
                reports={reports}
              />

              <ReportSelect
                label="After"
                value={afterReportCode}
                onChange={setAfterReportCode}
                reports={reports}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleCompare}
                disabled={loading}
                className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
              >
                {loading ? '比較中...' : '產生比較'}
              </button>

              {result && (
                <button
                  onClick={handleDownloadJson}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  下載比較 JSON
                </button>
              )}
            </div>
          </>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </section>

      {reports.length > 0 && (
        <section className="mb-6 rounded-xl border  p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-bold">已儲存報告</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b ">
                  <th className="p-2 text-left">Report Code</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-right">玩家數</th>
                  <th className="p-2 text-right">有效資料</th>
                  <th className="p-2 text-left">建立時間</th>
                  <th className="p-2 text-right">操作</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr key={report.reportCode} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{report.reportCode}</td>
                    <td className="p-2">{report.reportTitle}</td>
                    <td className="p-2 text-right">
                      {report.data.summary.length}
                    </td>
                    <td className="p-2 text-right">
                      {report.data.records.length}
                    </td>
                    <td className="p-2">
                      {formatDateTime(report.createdAt)}
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => handleRemoveReport(report.reportCode)}
                        className="rounded-lg border px-3 py-1 text-sm text-red-700"
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {result && (
        <>
          <section className="mb-6 rounded-xl border  p-4 shadow-sm">
            <h2 className="text-xl font-bold">比較資訊</h2>
            <p className="mt-1 text-sm text-gray-600">
              Before：{beforeReport?.reportTitle} ({beforeReport?.reportCode})
            </p>
            <p className="text-sm text-gray-600">
              After：{afterReport?.reportTitle} ({afterReport?.reportCode})
            </p>
          </section>

          <CompareSummaryCards stats={result.stats} />

          <CompareCharts result={result.result} />

          <CompareTable result={result.result} />
        </>
      )}
    </div>
  );
}

interface ReportSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  reports: StoredAnalyzeReport[];
}

function ReportSelect({ label, value, onChange, reports }: ReportSelectProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2"
      >
        <option value="">請選擇報告</option>

        {reports.map((report) => (
          <option key={report.reportCode} value={report.reportCode}>
            {report.reportCode}｜{report.reportTitle}｜{formatDateTime(report.createdAt)}
          </option>
        ))}
      </select>
    </label>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-TW', {
    hour12: false,
  });
}