'use client';

import { useState } from 'react';

import type { AnalyzeReportResult } from '@/types/fflogs';
import { ReportSummaryTable } from './ReportSummaryTable';
import { RdpsCharts } from './RdpsCharts';
import { saveStoredReport } from '@/lib/reportStorage';

export function ReportAnalyzeClient() {
  const [reportCode, setReportCode] = useState('');
  const [minFightDurationSeconds, setMinFightDurationSeconds] = useState(120);
  const [result, setResult] = useState<AnalyzeReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleAnalyze() {
    const trimmedReportCode = reportCode.trim();

    if (!trimmedReportCode) {
      setErrorMessage('請輸入 FFLogs report code');
      return;
    }

    setLoading(true);
    setErrorMessage('');
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
      saveStoredReport(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '分析失敗';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
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
        輸入 FFLogs report code，手動抓取戰鬥資料並產生玩家 RDPS 統計。
      </p>

      <section className="mb-6 rounded-xl border  p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Report Code</span>
            <input
              value={reportCode}
              onChange={(e) => setReportCode(e.target.value)}
              placeholder="例如：9z6nw8vZN3BFDcmQ"
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">最短戰鬥秒數</span>
            <input
              type="number"
              value={minFightDurationSeconds}
              onChange={(e) => setMinFightDurationSeconds(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <div className="flex items-end">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="rounded-lg bg-black px-5 py-2 text-white disabled:opacity-50"
            >
              {loading ? '分析中...' : '產生報告'}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </section>

      {result && (
        <>
          <section className="mb-6 rounded-xl border  p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{result.reportTitle}</h2>
                <p className="text-sm text-gray-600">
                  Report Code：{result.reportCode}｜有效資料：{result.records.length}{' '}
                  筆｜略過戰鬥：{result.skippedFights.length} 場
                </p>
              </div>

              <button
                onClick={handleDownloadJson}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                下載 JSON
              </button>
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
                    <tr className="border-b ">
                      <th className="p-2 text-left">Fight</th>
                      <th className="p-2 text-left">Boss</th>
                      <th className="p-2 text-right">秒數</th>
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