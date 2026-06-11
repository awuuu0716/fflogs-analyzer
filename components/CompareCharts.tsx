'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import type { PlayerCompareResult } from '@/types/compare';

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
});

interface CompareChartsProps {
  result: PlayerCompareResult[];
}

export function CompareCharts({ result }: CompareChartsProps) {
  const bothPlayers = result.filter((item) => item.status === 'both');

  const names = bothPlayers.map((item) => `${item.name} (${item.job})`);
  const beforeAverageRdps = bothPlayers.map((item) => item.averageRdps.before);
  const afterAverageRdps = bothPlayers.map((item) => item.averageRdps.after);
  const averageRdpsDiff = bothPlayers.map((item) => item.averageRdps.diff);

  const averageCompareOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['前', '後'],
    },
    grid: {
      left: 80,
      right: 40,
      top: 60,
      bottom: 120,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: 35,
      },
    },
    yAxis: {
      type: 'value',
      name: 'average rDPS',
    },
    series: [
      {
        name: '前',
        type: 'bar',
        data: beforeAverageRdps,
      },
      {
        name: '後',
        type: 'bar',
        data: afterAverageRdps,
      },
    ],
  };

  const averageDiffOption: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      valueFormatter(value) {
        if (value === null || value === undefined) return '-';

        return Number(value).toLocaleString('en-US', {
          maximumFractionDigits: 1,
        });
      },
    },
    grid: {
      left: 80,
      right: 40,
      top: 40,
      bottom: 120,
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: 35,
      },
    },
    yAxis: {
      type: 'value',
      name: 'average rDPS 差異',
    },
    series: [
      {
        name: '後 - 前',
        type: 'bar',
        data: averageRdpsDiff,
      },
    ],
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">平均 rDPS 前後比較</h2>

        <ReactECharts
          option={averageCompareOption}
          style={{ width: '100%', height: 520 }}
        />
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">平均 rDPS 差異</h2>

        <ReactECharts
          option={averageDiffOption}
          style={{ width: '100%', height: 520 }}
        />
      </div>
    </section>
  );
}