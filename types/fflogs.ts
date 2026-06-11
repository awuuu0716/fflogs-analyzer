export interface FflogsFight {
  id: number;
  name: string;
  kill: boolean;
  startTime: number;
  endTime: number;
}

export interface FflogsReport {
  title: string;
  fights: FflogsFight[];
}

export interface FflogsTableEntry {
  name?: string;
  type?: string;
  total?: number;
  totalRDPS?: number;
  totalADPS?: number;
  totalNDPS?: number;
  activeTime?: number;
}

export interface FflogsDamageDoneTableData {
  totalTime?: number;
  damageDowntime?: number;
  entries?: FflogsTableEntry[];
}

export interface FflogsDamageDoneTable {
  data?: FflogsDamageDoneTableData;
}

export interface PlayerFightRecord {
  reportCode: string;
  reportTitle: string;
  fight: number;
  boss: string;
  kill: boolean;
  found: true;
  name: string;
  job: string | null;
  rdps: number | null;
  dps: number | null;
  adps: number | null;
  ndps: number | null;
  totalDamage: number;
  totalRDPS: number;
  totalADPS: number;
  totalNDPS: number;
  activeTimeSeconds: number | null;
  effectiveTimeSeconds: number;
  url: string;
}

export interface SkippedFight {
  fight: number;
  boss: string;
  kill: boolean;
  effectiveTimeSeconds: number;
  reason: string;
  url: string;
}

export interface PlayerSummary {
  name: string;
  job: string | null;
  count: number;
  averageRdps: number | null;
  medianRdps: number | null;
  minRdps: number;
  maxRdps: number;
}

export interface AnalyzeReportResult {
  reportCode: string;
  reportTitle: string;
  minFightDurationSeconds: number;
  records: PlayerFightRecord[];
  summary: PlayerSummary[];
  skippedFights: SkippedFight[];
}
