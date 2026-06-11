import type { CompareMetric, PlayerCompareResult } from '@/types/compare';

interface CompareTableProps {
  result: PlayerCompareResult[];
}

export function CompareTable({ result }: CompareTableProps) {
  return (
    <section className="mt-6 rounded-xl border  p-4 shadow-sm">
      <h2 className="mb-3 text-xl font-bold">詳細比較表</h2>

      <div className="max-h-[720px] overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="sticky top-0 ">
              <Th align="left">玩家</Th>
              <Th align="left">職業</Th>
              <Th align="left">狀態</Th>

              <MetricHeaders label="Count" />
              <MetricHeaders label="Avg" withPercent />
              <MetricHeaders label="Median" withPercent />
              <MetricHeaders label="Min" />
              <MetricHeaders label="Max" />
            </tr>
          </thead>

          <tbody>
            {result.map((item) => (
              <tr key={`${item.name}-${item.job}`} className="border-b hover:bg-gray-900">
                <Td align="left">{item.name}</Td>
                <Td align="left">{item.job}</Td>
                <Td align="left">{formatStatus(item.status)}</Td>

                <MetricCells metric={item.count} />
                <MetricCells metric={item.averageRdps} withPercent />
                <MetricCells metric={item.medianRdps} withPercent />
                <MetricCells metric={item.minRdps} />
                <MetricCells metric={item.maxRdps} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MetricHeaders({
  label,
  withPercent = false,
}: {
  label: string;
  withPercent?: boolean;
}) {
  return (
    <>
      <Th>{label} 前</Th>
      <Th>{label} 後</Th>
      <Th>{label} 差異</Th>
      {withPercent && <Th>{label} %</Th>}
    </>
  );
}

function MetricCells({
  metric,
  withPercent = false,
}: {
  metric: CompareMetric;
  withPercent?: boolean;
}) {
  return (
    <>
      <Td>{formatNumber(metric.before)}</Td>
      <Td>{formatNumber(metric.after)}</Td>
      <Td className={getDiffClassName(metric.diff)}>
        {formatSignedNumber(metric.diff)}
      </Td>
      {withPercent && (
        <Td className={getDiffClassName(metric.diffPercent)}>
          {formatPercent(metric.diffPercent)}
        </Td>
      )}
    </>
  );
}

function Th({
  children,
  align = 'right',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`whitespace-nowrap border p-2 ${
        align === 'left' ? 'text-left' : 'text-right'
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'right',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td
      className={`whitespace-nowrap border p-2 ${
        align === 'left' ? 'text-left' : 'text-right'
      } ${className}`}
    >
      {children}
    </td>
  );
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: 1,
  });
}

function formatSignedNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  const sign = value > 0 ? '+' : '';

  return `${sign}${formatNumber(value)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';

  const sign = value > 0 ? '+' : '';

  return `${sign}${value.toFixed(2)}%`;
}

function getDiffClassName(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (value > 0) return 'font-bold text-green-700';
  if (value < 0) return 'font-bold text-red-700';

  return '';
}

function formatStatus(status: PlayerCompareResult['status']): string {
  if (status === 'both') return '共同';
  if (status === 'added') return '新增';
  if (status === 'removed') return '移除';

  return status;
}