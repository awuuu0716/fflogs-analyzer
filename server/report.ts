import { getAccessToken, queryFflogs } from './client';
import type {
  AnalyzeReportResult,
  FflogsDamageDoneTable,
  FflogsReport,
  PlayerFightRecord,
  PlayerSummary,
  SkippedFight,
} from '@/types/fflogs';

const DEFAULT_MIN_FIGHT_DURATION_SECONDS = 60 * 2;

interface GetReportFightsResponse {
  reportData: {
    report: FflogsReport;
  };
}

interface GetDamageDoneTableResponse {
  reportData: {
    report: {
      table: FflogsDamageDoneTable;
    };
  };
}

export interface AnalyzeReportOptions {
  reportCode: string;
  minFightDurationSeconds?: number;
}

export async function analyzeReport({
  reportCode,
  minFightDurationSeconds = DEFAULT_MIN_FIGHT_DURATION_SECONDS,
}: AnalyzeReportOptions): Promise<AnalyzeReportResult> {
  const token = await getAccessToken();
  const report = await getReportFights(token, reportCode);

  const records: PlayerFightRecord[] = [];
  const skippedFights: SkippedFight[] = [];

  for (const fight of report.fights) {
    const table = await getDamageDoneTable(token, reportCode, fight.id);
    const effectiveTimeSeconds = getEffectiveTimeSeconds(table);

    if (effectiveTimeSeconds < minFightDurationSeconds) {
      skippedFights.push({
        fight: fight.id,
        boss: fight.name,
        kill: fight.kill,
        effectiveTimeSeconds: round(effectiveTimeSeconds, 3),
        reason: `戰鬥時間小於 ${minFightDurationSeconds} 秒`,
        url: createFightUrl(reportCode, fight.id),
      });

      continue;
    }

    const players = parseAllPlayersRdps(table);

    for (const player of players) {
      records.push({
        reportCode,
        reportTitle: report.title,
        fight: fight.id,
        boss: fight.name,
        kill: fight.kill,
        found: true,
        name: player.name,
        job: player.job,
        rdps: player.rdps,
        dps: player.dps,
        adps: player.adps,
        ndps: player.ndps,
        totalDamage: player.totalDamage,
        totalRDPS: player.totalRDPS,
        totalADPS: player.totalADPS,
        totalNDPS: player.totalNDPS,
        activeTimeSeconds: player.activeTimeSeconds,
        effectiveTimeSeconds: player.effectiveTimeSeconds,
        url: createFightUrl(reportCode, fight.id),
      });
    }
  }

  const summary = calcPlayerSummary(records);

  return {
    reportCode,
    reportTitle: report.title,
    minFightDurationSeconds,
    records,
    summary,
    skippedFights,
  };
}

async function getReportFights(token: string, reportCode: string): Promise<FflogsReport> {
  const query = `
    query GetReportFights($code: String!) {
      reportData {
        report(code: $code) {
          title
          fights {
            id
            name
            kill
            startTime
            endTime
          }
        }
      }
    }
  `;

  const data = await queryFflogs<GetReportFightsResponse, { code: string }>(
    token,
    query,
    {
      code: reportCode,
    },
  );

  return data.reportData.report;
}

async function getDamageDoneTable(
  token: string,
  reportCode: string,
  fightId: number,
): Promise<FflogsDamageDoneTable> {
  const query = `
    query GetDamageDoneTable($code: String!, $fightIds: [Int]!) {
      reportData {
        report(code: $code) {
          table(dataType: DamageDone, fightIDs: $fightIds)
        }
      }
    }
  `;

  const data = await queryFflogs<
    GetDamageDoneTableResponse,
    { code: string; fightIds: number[] }
  >(token, query, {
    code: reportCode,
    fightIds: [fightId],
  });

  return data.reportData.report.table;
}

function parseAllPlayersRdps(table: FflogsDamageDoneTable) {
  const data = table.data;

  if (!data) {
    return [];
  }

  const entries = data.entries ?? [];
  const effectiveTimeMs = (data.totalTime ?? 0) - (data.damageDowntime ?? 0);

  if (effectiveTimeMs <= 0) {
    return [];
  }

  return entries
    .filter((entry) => {
      return entry.name && typeof entry.totalRDPS === 'number';
    })
    .map((entry) => {
      const rdps = calcPerSecond(entry.totalRDPS, table);
      const dps = calcPerSecond(entry.total, table);
      const adps = calcPerSecond(entry.totalADPS, table);
      const ndps = calcPerSecond(entry.totalNDPS, table);

      return {
        name: entry.name ?? '',
        job: entry.type ?? null,
        rdps,
        dps,
        adps,
        ndps,
        totalDamage: Math.round(entry.total ?? 0),
        totalRDPS: Math.round(entry.totalRDPS ?? 0),
        totalADPS: Math.round(entry.totalADPS ?? 0),
        totalNDPS: Math.round(entry.totalNDPS ?? 0),
        activeTimeSeconds: entry.activeTime ? round(entry.activeTime / 1000, 3) : null,
        effectiveTimeSeconds: round(effectiveTimeMs / 1000, 3),
      };
    });
}

function calcPlayerSummary(records: PlayerFightRecord[]): PlayerSummary[] {
  const map = new Map<
    string,
    {
      name: string;
      job: string | null;
      rdpsList: number[];
    }
  >();

  for (const record of records) {
    if (typeof record.rdps !== 'number') continue;

    const playerKey = getPlayerKey(record.name, record.job);
    const current = map.get(playerKey);

    if (!current) {
      map.set(playerKey, {
        name: record.name,
        job: record.job,
        rdpsList: [record.rdps],
      });

      continue;
    }

    current.rdpsList.push(record.rdps);
  }

  return [...map.values()]
    .map((item) => {
      const rdpsList = item.rdpsList;

      return {
        name: item.name,
        job: item.job,
        count: rdpsList.length,
        averageRdps: average(rdpsList),
        medianRdps: median(rdpsList),
        minRdps: Math.min(...rdpsList),
        maxRdps: Math.max(...rdpsList),
      };
    })
    .sort((a, b) => {
      return (b.averageRdps ?? 0) - (a.averageRdps ?? 0);
    });
}

function getPlayerKey(name: string, job: string | null): string {
  return JSON.stringify([name, job]);
}

function calcPerSecond(
  total: number | undefined,
  table: FflogsDamageDoneTable,
): number | null {
  const data = table.data;

  if (!data) {
    return null;
  }

  const totalTime = data.totalTime ?? 0;
  const damageDowntime = data.damageDowntime ?? 0;
  const effectiveTimeMs = totalTime - damageDowntime;

  if (!total || effectiveTimeMs <= 0) {
    return null;
  }

  return round(total / (effectiveTimeMs / 1000), 1);
}

function getEffectiveTimeSeconds(table: FflogsDamageDoneTable): number {
  const data = table.data;

  if (!data) {
    return 0;
  }

  const totalTime = data.totalTime ?? 0;
  const damageDowntime = data.damageDowntime ?? 0;

  return (totalTime - damageDowntime) / 1000;
}

function average(numbers: number[]): number | null {
  if (!numbers.length) return null;

  const total = numbers.reduce((sum, n) => sum + n, 0);

  return round(total / numbers.length, 1);
}

function median(numbers: number[]): number | null {
  if (!numbers.length) return null;

  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return round((sorted[mid - 1] + sorted[mid]) / 2, 1);
  }

  return sorted[mid];
}

function round(value: number, digits: number): number {
  return Number(value.toFixed(digits));
}

function createFightUrl(reportCode: string, fightId: number): string {
  return `https://www.fflogs.com/reports/${reportCode}?type=damage-done&fight=${fightId}`;
}
