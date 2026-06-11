import type { PlayerSummary } from '@/types/fflogs';

export type CompareStatus = 'both' | 'added' | 'removed';

export interface CompareMetric {
  before: number | null;
  after: number | null;
  diff: number | null;
  diffPercent: number | null;
}

export interface PlayerCompareResult {
  name: string;
  job: string | null;
  status: CompareStatus;

  count: CompareMetric;
  averageRdps: CompareMetric;
  medianRdps: CompareMetric;
  minRdps: CompareMetric;
  maxRdps: CompareMetric;
}

export interface CompareReportsRequest {
  before: PlayerSummary[];
  after: PlayerSummary[];
}

export interface CompareReportsResponse {
  result: PlayerCompareResult[];
  stats: {
    total: number;
    both: number;
    added: number;
    removed: number;
  };
}