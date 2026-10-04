import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.automationConfig.findMany({
      include: {
        website: { select: { id: true, name: true, url: true } },
      },
    });

    return NextResponse.json({ success: true, data: configs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { websiteId, enabled, researchFrequency, generationFrequency, preferredPublishingDays, preferredPublishingTime, timezone, maxBlogsPerWeek, requireHumanApproval } = body;

    if (!websiteId) {
      return NextResponse.json({ success: false, error: 'websiteId is required' }, { status: 400 });
    }

    const config = await prisma.automationConfig.upsert({
      where: { websiteId },
      create: {
        websiteId,
        enabled: enabled ?? false,
        researchFrequency: researchFrequency || 'WEEKLY',
        generationFrequency: generationFrequency || 'WEEKLY',
        preferredPublishingDays: preferredPublishingDays || ['Monday', 'Wednesday', 'Friday'],
        preferredPublishingTime: preferredPublishingTime || '09:00',
        timezone: timezone || 'UTC',
        maxBlogsPerWeek: maxBlogsPerWeek || 3,
        requireHumanApproval: requireHumanApproval !== undefined ? requireHumanApproval : true,
      },
      update: {
        enabled: enabled !== undefined ? enabled : undefined,
        researchFrequency,
        generationFrequency,
        preferredPublishingDays,
        preferredPublishingTime,
        timezone,
        maxBlogsPerWeek,
        requireHumanApproval,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
