import { analyzeReport } from '@/server/report';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface AnalyzeRequestBody {
  reportCode?: string;
  minFightDurationSeconds?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;

    const reportCode = body.reportCode?.trim();
    const minFightDurationSeconds = body.minFightDurationSeconds ?? 60 * 2;

    if (!reportCode) {
      return NextResponse.json(
        {
          error: 'reportCode is required',
        },
        {
          status: 400,
        },
      );
    }

    const result = await analyzeReport({
      reportCode,
      minFightDurationSeconds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[analyze report error]', error);

    const message =
      error instanceof Error ? error.message : 'Failed to analyze report';

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}