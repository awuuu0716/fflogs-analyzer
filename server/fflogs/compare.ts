import type { PlayerSummary } from '@/types/fflogs';
import type {
  CompareMetric,
  CompareReportsResponse,
  CompareStatus,
  PlayerCompareResult,
} from '@/types/compare';

function getPlayerKey(player: PlayerSummary): string {
  return `${player.name}__${player.job}`;
}

function round(value: number | null | undefined, digits = 1): number | null {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(Number(value).toFixed(digits));
}

function calcDiff(
  beforeValue: number | null | undefined,
  afterValue: number | null | undefined,
): CompareMetric {
  if (
    beforeValue === null ||
    beforeValue === undefined ||
    afterValue === null ||
    afterValue === undefined
  ) {
    return {
      before: beforeValue ?? null,
      after: afterValue ?? null,
      diff: null,
      diffPercent: null,
    };
  }

  const diff = afterValue - beforeValue;
  const diffPercent = beforeValue === 0 ? null : (diff / beforeValue) * 100;

  return {
    before: round(beforeValue, 1),
    after: round(afterValue, 1),
    diff: round(diff, 1),
    diffPercent: diffPercent === null ? null : round(diffPercent, 2),
  };
}

export function comparePlayerSummary(
  beforeList: PlayerSummary[],
  afterList: PlayerSummary[],
): CompareReportsResponse {
  const beforeMap = new Map<string, PlayerSummary>();
  const afterMap = new Map<string, PlayerSummary>();

  beforeList.forEach((player) => {
    beforeMap.set(getPlayerKey(player), player);
  });

  afterList.forEach((player) => {
    afterMap.set(getPlayerKey(player), player);
  });

  const allKeys = Array.from(
    new Set([...beforeMap.keys(), ...afterMap.keys()]),
  );

  const result: PlayerCompareResult[] = allKeys.map((key) => {
    const before = beforeMap.get(key) ?? null;
    const after = afterMap.get(key) ?? null;

    const base = after ?? before;

    if (!base) {
      throw new Error(`Invalid compare key: ${key}`);
    }

    let status: CompareStatus = 'both';

    if (before && !after) {
      status = 'removed';
    } else if (!before && after) {
      status = 'added';
    }

    return {
      name: base.name,
      job: base.job,
      status,

      count: calcDiff(before?.count, after?.count),
      averageRdps: calcDiff(before?.averageRdps, after?.averageRdps),
      medianRdps: calcDiff(before?.medianRdps, after?.medianRdps),
      minRdps: calcDiff(before?.minRdps, after?.minRdps),
      maxRdps: calcDiff(before?.maxRdps, after?.maxRdps),
    };
  });

  result.sort((a, b) => {
    const aDiff = a.averageRdps.diff ?? -Infinity;
    const bDiff = b.averageRdps.diff ?? -Infinity;

    return bDiff - aDiff;
  });

  return {
    result,
    stats: {
      total: result.length,
      both: result.filter((item) => item.status === 'both').length,
      added: result.filter((item) => item.status === 'added').length,
      removed: result.filter((item) => item.status === 'removed').length,
    },
  };
}