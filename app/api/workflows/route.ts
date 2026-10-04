import { NextRequest, NextResponse } from 'next/server';
import { startWorkflowExecution } from '@/services/langgraph/workflow.graph';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, websiteId, websiteContext, integrationId } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid blog topic is required to start a workflow.' },
        { status: 400 }
      );
    }

    const userId = body.userId || 'user-1';

    // Start LangGraph workflow execution with persistent checkpointer
    const execution = await startWorkflowExecution({
      userId,
      websiteId: websiteId || 'website-1',
      topic: topic.trim(),
      websiteContext,
      integrationId,
    });

    return NextResponse.json({
      success: true,
      message: 'LangGraph multi-agent workflow started successfully.',
      data: execution,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to initiate workflow: ${message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const executions = await prisma.workflowExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        website: { select: { name: true, url: true } },
        blog: { select: { title: true, status: true } },
      },
    });

    return NextResponse.json({ success: true, data: executions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
