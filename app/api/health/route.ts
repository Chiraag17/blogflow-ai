import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/prisma';

/**
 * GET /api/health
 * Database health-check endpoint.
 * Returns connection status without exposing credentials.
 */
export async function GET() {
  try {
    const result = await checkDatabaseConnection();

    if (result.connected) {
      return NextResponse.json(
        { status: 'ok', database: 'connected' },
        { status: 200 }
      );
    }

    // Database unreachable — return 503 without leaking internals
    console.error('[Health] Database connection failed:', result.error);
    return NextResponse.json(
      { status: 'error', database: 'disconnected' },
      { status: 503 }
    );
  } catch (err: unknown) {
    console.error('[Health] Unexpected error:', err);
    return NextResponse.json(
      { status: 'error', database: 'disconnected' },
      { status: 503 }
    );
  }
}
