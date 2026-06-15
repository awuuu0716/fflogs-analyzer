'use client';

import dynamic from 'next/dynamic';
import type { Data, Layout } from 'plotly.js';
import type { PlayerFightRecord, PlayerSummary } from '@/types/fflogs';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
});

interface RdpsChartsProps {
  records: PlayerFightRecord[];
  summary: PlayerSummary[];
}

export function RdpsCharts({ records, summary }: RdpsChartsProps) {
  const chartRecords = records.filter((item) => {
    return item.found && typeof item.rdps === 'number';
  });

  const players = [
    ...new Map(
      chartRecords.map((item) => [
        getPlayerKey(item.name, item.job),
        { name: item.name, job: item.job },
      ]),
    ).values(),
  ];

  const boxData: Data[] = players.map((player) => {
    const playerKey = getPlayerKey(player.name, player.job);
    const playerRecords = chartRecords.filter((item) => {
      return getPlayerKey(item.name, item.job) === playerKey;
    });

    return {
      type: 'box',
      name: getPlayerLabel(player.name, player.job),
      y: playerRecords.map((item) => item.rdps ?? 0),
      boxpoints: 'all',
      jitter: 0.35,
      pointpos: 0,
      text: playerRecords.map((item) => {
        return [
          `玩家：${item.name}`,
          `職業：${item.job}`,
          `Fight：${item.fight}`,
          `Boss：${item.boss}`,
          `Kill：${item.kill}`,
          `RDPS：${item.rdps}`,
        ].join('<br>');
      }),
      hoverinfo: 'text',
    };
  });

  const boxLayout: Partial<Layout> = {
    title: {
      text: '每位玩家 RDPS Box Plot',
    },
    yaxis: {
      title: {
        text: 'RDPS',
      },
    },
    xaxis: {
      title: {
        text: '玩家',
      },
    },
    margin: {
      t: 60,
      l: 80,
      r: 40,
      b: 120,
    },
  };

  const scatterData: Data[] = players.map((player) => {
    const playerKey = getPlayerKey(player.name, player.job);
    const playerRecords = chartRecords
      .filter((item) => getPlayerKey(item.name, item.job) === playerKey)
      .sort((a, b) => a.fight - b.fight);

    const playerSummary = summary.find((item) => {
      return getPlayerKey(item.name, item.job) === playerKey;
    });
    const avg = playerSummary?.averageRdps ?? null;

    return {
      type: 'scatter',
      mode: 'lines+markers',
      name: getPlayerLabel(player.name, player.job),
      x: playerRecords.map((item) => item.fight),
      y: playerRecords.map((item) => item.rdps ?? 0),
      text: playerRecords.map((item) => {
        return [
          `玩家：${item.name}`,
          `職業：${item.job}`,
          `Fight：${item.fight}`,
          `Boss：${item.boss}`,
          `Kill：${item.kill}`,
          `RDPS：${item.rdps}`,
          `平均 RDPS：${avg}`,
        ].join('<br>');
      }),
      hoverinfo: 'text',
    };
  });

  const averageLineData: Data[] = summary
    .map((item) => {
      const playerRecords = chartRecords
        .filter((record) => {
          return (
            getPlayerKey(record.name, record.job) ===
            getPlayerKey(item.name, item.job)
          );
        })
        .sort((a, b) => a.fight - b.fight);

      if (!playerRecords.length || item.averageRdps === null) {
        return {};
      }

      return {
        type: 'scatter',
        mode: 'lines',
        name: `${item.name} 平均`,
        x: playerRecords.map((record) => record.fight),
        y: playerRecords.map(() => item.averageRdps),
        line: {
          dash: 'dot',
        },
        hoverinfo: 'skip',
        showlegend: false,
      } satisfies Data;
    })
    .filter((item) => Boolean(item));

  const scatterLayout: Partial<Layout> = {
    title: {
      text: '每場戰鬥 RDPS 趨勢',
    },
    yaxis: {
      title: {
        text: 'RDPS',
      },
    },
    xaxis: {
      title: {
        text: 'Fight ID',
      },
      dtick: 1,
    },
    margin: {
      t: 60,
      l: 80,
      r: 40,
      b: 80,
    },
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">Box Plot：每位玩家 RDPS 分布</h2>

        <Plot
          data={boxData}
          layout={boxLayout}
          config={{ responsive: true }}
          style={{ width: '100%', height: 640 }}
        />
      </div>

      <div className="rounded-xl border p-4 shadow-sm">
        <h2 className="mb-3 text-xl font-bold">點陣圖：每場戰鬥 RDPS 分布與趨勢</h2>

        <Plot
          data={[...scatterData, ...averageLineData]}
          layout={scatterLayout}
          config={{ responsive: true }}
          style={{ width: '100%', height: 640 }}
        />
      </div>
    </section>
  );
}

function getPlayerKey(name: string, job: string | null): string {
  return JSON.stringify([name, job]);
}

function getPlayerLabel(name: string, job: string | null): string {
  return job ? `${name} (${job})` : name;
}
