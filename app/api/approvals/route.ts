import { NextResponse } from 'next/server';
import { DbApprovalService } from '@/services/db/approval.service';

export async function GET() {
  try {
    const [pendingBlogs, approvalHistory] = await Promise.all([
      DbApprovalService.getPendingApprovals(),
      DbApprovalService.getApprovalHistory(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pendingBlogs,
        approvalHistory,
      },
      count: pendingBlogs.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
