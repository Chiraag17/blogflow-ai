import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkflowStatus } from '@prisma/client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.workflowExecution.updateMany({
      where: {
        OR: [{ id }, { graphThreadId: id }],
      },
      data: {
        status: WorkflowStatus.CANCELLED,
        errorMessage: 'Execution terminated by user request.',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Workflow ${id} has been cancelled.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
