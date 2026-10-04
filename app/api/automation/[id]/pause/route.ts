import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const config = await prisma.automationConfig.updateMany({
      where: { OR: [{ id }, { websiteId: id }] },
      data: { enabled: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Automation schedule paused.',
      data: config,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
