import type { CompareReportsResponse } from '@/types/compare';

interface CompareSummaryCardsProps {
  stats: CompareReportsResponse['stats'];
}

export function CompareSummaryCards({ stats }: CompareSummaryCardsProps) {
  const items = [
    {
      label: '總玩家數',
      value: stats.total,
    },
    {
      label: '共同存在',
      value: stats.both,
    },
    {
      label: '新增玩家',
      value: stats.added,
    },
    {
      label: '移除玩家',
      value: stats.removed,
    },
  ];

  return (
    <section className="mb-6 grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border  p-4 shadow-sm">
          <div className="text-sm text-gray-600">{item.label}</div>
          <div className="mt-1 text-2xl font-bold">{item.value}</div>
        </div>
      ))}
    </section>
  );
}