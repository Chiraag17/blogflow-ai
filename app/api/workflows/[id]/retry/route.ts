import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkflowStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Retry recoverable workflow execution
    const updated = await prisma.workflowExecution.updateMany({
      where: {
        OR: [{ id }, { graphThreadId: id }],
      },
      data: {
        status: WorkflowStatus.RUNNING,
        errorMessage: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Workflow ${id} queued for retry from last checkpoint.`,
      updatedCount: updated.count,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
