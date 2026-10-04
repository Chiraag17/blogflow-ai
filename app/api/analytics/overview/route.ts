import { NextResponse } from 'next/server';
import { DbAnalyticsService } from '@/services/db/analytics.service';

export async function GET() {
  try {
    const data = await DbAnalyticsService.getOverviewMetrics();
    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
