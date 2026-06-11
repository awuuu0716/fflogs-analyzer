import { NextRequest, NextResponse } from 'next/server';
import { comparePlayerSummary } from '@/server/fflogs/compare';
import type { CompareReportsRequest } from '@/types/compare';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CompareReportsRequest;

    if (!Array.isArray(body.before)) {
      return NextResponse.json(
        { error: 'before summary is required' },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.after)) {
      return NextResponse.json(
        { error: 'after summary is required' },
        { status: 400 },
      );
    }

    const response = comparePlayerSummary(body.before, body.after);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[compare reports error]', error);

    const message =
      error instanceof Error ? error.message : 'Failed to compare reports';

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