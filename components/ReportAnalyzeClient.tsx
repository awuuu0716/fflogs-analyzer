'use client';

import { useEffect, useState } from 'react';

import {
  getStoredReport,
  getStoredReports,
  saveStoredReport,
  type StoredAnalyzeReport,
} from '@/lib/reportStorage';
import type { AnalyzeReportResult } from '@/types/fflogs';
import { RdpsCharts } from './RdpsCharts';
import { ReportSummaryTable } from './ReportSummaryTable';

export function ReportAnalyzeClient() {
  const [reportCode, setReportCode] = useState('');
  const [minFightDurationSeconds, setMinFightDurationSeconds] = useState(120);
  const [result, setResult] = useState<AnalyzeReportResult | null>(null);
  const [storedReports, setStoredReports] = useState<StoredAnalyzeReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cacheMessage, setCacheMessage] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setStoredReports(getStoredReports());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleAnalyze(forceRefresh = false) {
    const trimmedReportCode = reportCode.trim();

    if (!trimmedReportCode) {
      setErrorMessage('請輸入 FFLogs report code');
      return;
    }

    setErrorMessage('');
    setCacheMessage('');

    if (!forceRefresh) {
      const storedReport = getStoredReport(
        trimmedReportCode,
        minFightDurationSeconds,
      );

      if (storedReport) {
        showStoredReport(storedReport);
        return;
      }
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/reports/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportCode: trimmedReportCode,
          minFightDurationSeconds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '分析失敗');
      }

      setResult(data);
      setStoredReports(saveStoredReport(data));
      setCacheMessage('分析完成，報告已儲存於此瀏覽器。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '分析失敗';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  function showStoredReport(report: StoredAnalyzeReport) {
    setReportCode(report.reportCode);
    setMinFightDurationSeconds(report.data.minFightDurationSeconds);
    setResult(report.data);
    setErrorMessage('');
    setCacheMessage(
      `已載入本機儲存的分析報告（${formatDateTime(report.createdAt)}）`,
    );
  }

  function handleDownloadJson() {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${result.reportCode}-analysis.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-2 text-3xl font-bold">FFLogs RDPS 分析</h1>

      <p className="mb-6 text-gray-600">
        輸入 FFLogs report code，抓取戰鬥資料並產生玩家 RDPS 統計。
      </p>

      <section className="mb-6 rounded-xl border p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Report Code</span>
            <input
              value={reportCode}
              onChange={(event) => setReportCode(event.target.value)}
              placeholder="例如：z6nw8vZN3BFDcmQ"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">最短戰鬥秒數</span>
            <input
              type="number"
              min={0}
              value={minFightDurationSeconds}
              onChange={(event) =>
                setMinFightDurationSeconds(Number(event.target.value))
              }
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <div className="flex items-end">
            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
            >
              {loading ? '分析中...' : '開始分析'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {cacheMessage && (
          <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {cacheMessage}
          </div>
        )}
      </section>

      {storedReports.length > 0 && (
        <section className="mb-6 rounded-xl border p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">已儲存的分析報告</h2>
              <p className="text-sm text-gray-600">
                直接開啟報告，不需要重新呼叫 FFLogs。
              </p>
            </div>
            <span className="text-sm text-gray-500">
              共 {storedReports.length} 份
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Report Code</th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-right">最短戰鬥秒數</th>
                  <th className="p-2 text-left">分析時間</th>
                  <th className="p-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {storedReports.map((report) => (
                  <tr key={report.reportCode} className="border-b">
                    <td className="p-2 font-mono">{report.reportCode}</td>
                    <td className="p-2">{report.reportTitle}</td>
                    <td className="p-2 text-right">
                      {report.data.minFightDurationSeconds}
                    </td>
                    <td className="p-2">{formatDateTime(report.createdAt)}</td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => showStoredReport(report)}
                        className="rounded-lg border px-3 py-1 text-sm"
                      >
                        開啟
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
          <section className="mb-6 rounded-xl border p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{result.reportTitle}</h2>
                <p className="text-sm text-gray-600">
                  Report Code：{result.reportCode}｜有效資料：
                  {result.records.length} 筆｜略過戰鬥：
                  {result.skippedFights.length} 場
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDownloadJson}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  下載 JSON
                </button>
                <button
                  onClick={() => handleAnalyze(true)}
                  disabled={loading}
                  className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                >
                  {loading ? '重新分析中...' : '重新分析'}
                </button>
              </div>
            </div>
          </section>

          <ReportSummaryTable summary={result.summary} />
          <RdpsCharts records={result.records} summary={result.summary} />

          {result.skippedFights.length > 0 && (
            <section className="mt-6 rounded-xl border p-4 shadow-sm">
              <h2 className="mb-3 text-xl font-bold">略過的戰鬥</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Fight</th>
                      <th className="p-2 text-left">Boss</th>
                      <th className="p-2 text-right">有效秒數</th>
                      <th className="p-2 text-left">原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.skippedFights.map((fight) => (
                      <tr key={fight.fight} className="border-b">
                        <td className="p-2">{fight.fight}</td>
                        <td className="p-2">{fight.boss}</td>
                        <td className="p-2 text-right">
                          {fight.effectiveTimeSeconds}
                        </td>
                        <td className="p-2">{fight.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
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
