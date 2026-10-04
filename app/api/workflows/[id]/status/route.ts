import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowExecutionStatus } from '@/services/langgraph/workflow.graph';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const statusData = await getWorkflowExecutionStatus(id);

    return NextResponse.json({
      success: true,
      data: statusData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
