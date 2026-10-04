// app/api/websites/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = (await headers()).get('x-user-id') || undefined;

    const website = await prisma.website.findFirst({
      where: userId ? { id, userId } : { id },
      include: {
        cmsIntegrations: true,
        automationConfig: true,
        _count: { select: { blogs: true } },
      },
    });

    if (!website) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: website });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = (await headers()).get('x-user-id') || undefined;
    const body = await req.json();

    // Ensure ownership
    const existing = await prisma.website.findFirst({
      where: userId ? { id, userId } : { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    const { name, url, niche, targetAudience, writingTone, preferredKeywords, excludedTopics } = body;

    const updated = await prisma.website.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(niche !== undefined && { niche }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(writingTone !== undefined && { writingTone }),
        ...(preferredKeywords !== undefined && { preferredKeywords }),
        ...(excludedTopics !== undefined && { excludedTopics }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = (await headers()).get('x-user-id') || undefined;

    // Ensure ownership before deleting
    const existing = await prisma.website.findFirst({
      where: userId ? { id, userId } : { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Website not found' }, { status: 404 });
    }

    await prisma.website.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Website deleted.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
