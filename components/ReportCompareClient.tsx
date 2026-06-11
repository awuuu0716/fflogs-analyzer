'use client';

import { useState } from 'react';
import type { AnalyzeReportResult, PlayerSummary } from '@/types/fflogs';
import type { CompareReportsResponse } from '@/types/compare';
import { CompareSummaryCards } from './CompareSummaryCards';
import { CompareCharts } from './CompareCharts';
import { CompareTable } from './CompareTable';

function extractSummary(input: unknown): PlayerSummary[] {
  if (Array.isArray(input)) {
    return input as PlayerSummary[];
  }

  const maybeReport = input as Partial<AnalyzeReportResult>;

  if (Array.isArray(maybeReport.summary)) {
    return maybeReport.summary;
  }

  throw new Error('JSON 格式不正確，請貼上完整 analysis JSON 或 player summary array');
}

export function ReportCompareClient() {
  const [beforeJsonText, setBeforeJsonText] = useState('');
  const [afterJsonText, setAfterJsonText] = useState('');
  const [result, setResult] = useState<CompareReportsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleCompare() {
    setLoading(true);
    setErrorMessage('');
    setResult(null);

    try {
      const beforeParsed = JSON.parse(beforeJsonText);
      const afterParsed = JSON.parse(afterJsonText);

      const before = extractSummary(beforeParsed);
      const after = extractSummary(afterParsed);

      const res = await fetch('/api/reports/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ before, after }),
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

  function handleDownloadJson() {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'compare-result.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-2 text-3xl font-bold">FFLogs 玩家 rDPS 前後比較</h1>

      <p className="mb-6 text-gray-600">
        貼上兩份分析 JSON，系統會依照玩家 name + job 對應，計算前後差異。
      </p>

      <section className="mb-6 rounded-xl border  p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Before JSON</span>
            <textarea
              value={beforeJsonText}
              onChange={(e) => setBeforeJsonText(e.target.value)}
              placeholder="貼上前一份 analysis JSON 或 player-summary array"
              className="h-72 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">After JSON</span>
            <textarea
              value={afterJsonText}
              onChange={(e) => setAfterJsonText(e.target.value)}
              placeholder="貼上後一份 analysis JSON 或 player-summary array"
              className="h-72 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            />
          </label>
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

        {errorMessage && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
      </section>

      {result && (
        <>
          <CompareSummaryCards stats={result.stats} />

          <CompareCharts result={result.result} />

          <CompareTable result={result.result} />
        </>
      )}
    </div>
  );
}