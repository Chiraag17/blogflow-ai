import { NextRequest, NextResponse } from 'next/server';
import { DbApprovalService } from '@/services/db/approval.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const result = await DbApprovalService.processDecision({
      blogId: id,
      decision: 'REJECT',
      comments: body.reason || body.comments || 'Rejected by human reviewer.',
      reviewerId: body.reviewerId,
    });

    return NextResponse.json({
      success: true,
      message: 'Article has been rejected. Publishing path terminated.',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
