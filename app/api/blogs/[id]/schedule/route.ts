import { NextRequest, NextResponse } from 'next/server';
import { WordPressService } from '@/services/cms/wordpress.service';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    if (!body.scheduledDate) {
      return NextResponse.json(
        { success: false, error: 'A scheduled publication date (ISO 8601 string) is required.' },
        { status: 400 }
      );
    }

    let integrationId = body.integrationId;
    if (!integrationId) {
      const blog = await prisma.blog.findUnique({
        where: { id },
        include: { website: { include: { cmsIntegrations: true } } },
      });
      integrationId = blog?.website.cmsIntegrations.find((c) => c.connectionStatus === 'CONNECTED')?.id;
    }

    if (!integrationId) {
      return NextResponse.json(
        { success: false, error: 'No active WordPress CMS integration found for this website.' },
        { status: 400 }
      );
    }

    const result = await WordPressService.publishPost({
      blogId: id,
      integrationId,
      publishMode: 'schedule',
      scheduledDate: body.scheduledDate,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Article scheduled for publication on ${body.scheduledDate}`,
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
