import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WordPressService } from '@/services/cms/wordpress.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.publishingRecord.findUnique({
      where: { id },
      include: {
        blog: true,
        integration: { select: { id: true, provider: true, cmsUrl: true, username: true } },
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'Publishing record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.publishingRecord.findUnique({
      where: { id },
      include: {
        blog: {
          include: {
            approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        integration: true,
      },
    });

    if (!record) {
      return NextResponse.json({ success: false, error: 'Publishing record not found.' }, { status: 404 });
    }

    // Security check: Must be approved to publish
    const latestApproval = record.blog.approvals[0];
    const isApproved =
      record.blog.status === 'APPROVED' ||
      record.blog.status === 'SCHEDULED' ||
      latestApproval?.status === 'APPROVED';

    if (!isApproved) {
      return NextResponse.json(
        { success: false, error: 'Cannot retry publishing: Article must be approved in the Approval Center.' },
        { status: 403 }
      );
    }

    // Retry publishing as Draft to WordPress
    const result = await WordPressService.publishPost({
      blogId: record.blogId,
      integrationId: record.integrationId,
      publishMode: 'draft',
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Retry publishing failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Publishing retry succeeded! Draft created on WordPress.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
