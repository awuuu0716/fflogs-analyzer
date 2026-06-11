import type { PlayerSummary } from '@/types/fflogs';

interface ReportSummaryTableProps {
  summary: PlayerSummary[];
}

export function ReportSummaryTable({ summary }: ReportSummaryTableProps) {
  return (
    <section className="mb-6 rounded-xl border  p-4 shadow-sm">
      <h2 className="mb-3 text-xl font-bold">玩家統計</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b ">
              <th className="p-2 text-left">玩家</th>
              <th className="p-2 text-left">職業</th>
              <th className="p-2 text-right">場次</th>
              <th className="p-2 text-right">平均 RDPS</th>
              <th className="p-2 text-right">中位數 RDPS</th>
              <th className="p-2 text-right">最低 RDPS</th>
              <th className="p-2 text-right">最高 RDPS</th>
            </tr>
          </thead>

          <tbody>
            {summary.map((item) => (
              <tr key={`${item.name}-${item.job}`} className="border-b hover:bg-gray-900">
                <td className="p-2">{item.name}</td>
                <td className="p-2">{item.job}</td>
                <td className="p-2 text-right">{item.count}</td>
                <td className="p-2 text-right">{formatNumber(item.averageRdps)}</td>
                <td className="p-2 text-right">{formatNumber(item.medianRdps)}</td>
                <td className="p-2 text-right">{formatNumber(item.minRdps)}</td>
                <td className="p-2 text-right">{formatNumber(item.maxRdps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatNumber(value: number | null): string {
  if (value === null) return '-';

  return value.toLocaleString();
}