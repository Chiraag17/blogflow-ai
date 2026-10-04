import { StateGraph, START, END, Command } from '@langchain/langgraph';
import { BlogWorkflowAnnotation, WorkflowGraphState } from './workflow.state';
import { researchNode } from './nodes/research.node';
import { writerNode } from './nodes/writer.node';
import { qualityNode } from './nodes/quality.node';
import { revisionNode } from './nodes/revision.node';
import { approvalNode, HumanApprovalPayload } from './nodes/approval.node';
import { publisherNode } from './nodes/publisher.node';
import { workflowCheckpointer } from './checkpointer';
import { prisma } from '@/lib/prisma';
import { WorkflowStatus } from '@prisma/client';

/**
 * Builds the orchestrated LangGraph state graph.
 */
function createWorkflowGraph() {
  const workflow = new StateGraph(BlogWorkflowAnnotation)
    .addNode('research', researchNode)
    .addNode('writer', writerNode)
    .addNode('quality', qualityNode)
    .addNode('revision', revisionNode)
    .addNode('humanApproval', approvalNode)
    .addNode('publisher', publisherNode)

    // START -> Research -> Writer -> Quality
    .addEdge(START, 'research')
    .addEdge('research', 'writer')
    .addEdge('writer', 'quality')

    // Quality Decision: Auto-revision loop (up to 1 automated revision if quality fails) or proceed to Human Approval
    .addConditionalEdges('quality', (state) => {
      if (state.error) return END;

      const score = state.qualityReport?.contentQuality.score;
      if (typeof score === 'number' && score < 70 && state.revisionCount < 1) {
        console.log(`[Graph Routing] Quality score (${score}) below threshold. Routing to automated revision.`);
        return 'revision';
      }

      return 'humanApproval';
    })

    // Revision returns to Quality for re-audit
    .addEdge('revision', 'quality')

    // Human Approval Decision Routing
    .addConditionalEdges('humanApproval', (state) => {
      if (state.approvalDecision === 'APPROVE') {
        console.log('[Graph Routing] Human Approved. Proceeding to Publishing Agent.');
        return 'publisher';
      }

      if (state.approvalDecision === 'REQUEST_REVISION') {
        console.log('[Graph Routing] Human Requested Revision. Cycling to Content Revision Agent.');
        return 'revision';
      }

      console.log('[Graph Routing] Human Rejected or halted. Ending workflow.');
      return END;
    })

    .addEdge('publisher', END);

  return workflow.compile({ checkpointer: workflowCheckpointer });
}

// Global compiled graph singleton
export const blogflowGraph = createWorkflowGraph();

/**
 * Starts a new persistent blog creation workflow execution.
 */
export async function startWorkflowExecution(params: {
  userId: string;
  websiteId: string;
  topic: string;
  websiteContext?: any;
  integrationId?: string;
  threadId?: string;
}): Promise<{ threadId: string; executionId: string; result: any; status: string }> {
  const { userId, websiteId, topic, websiteContext, integrationId } = params;
  const threadId = params.threadId || `wf-thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // 1. Create or upsert record in PostgreSQL
  let executionId = threadId;
  try {
    const execution = await prisma.workflowExecution.upsert({
      where: { graphThreadId: threadId },
      create: {
        userId,
        websiteId,
        graphThreadId: threadId,
        workflowType: 'AUTONOMOUS_BLOG_CREATION',
        currentNode: 'research',
        status: WorkflowStatus.RUNNING,
      },
      update: {
        status: WorkflowStatus.RUNNING,
        errorMessage: null,
      },
    });
    executionId = execution.id;
  } catch (dbErr) {
    console.warn('[Workflow] DB execution creation warning:', dbErr);
  }

  // 2. Invoke graph up to the human approval interrupt
  const config = { configurable: { thread_id: threadId } };
  const initialState: Partial<WorkflowGraphState> = {
    userId,
    websiteId,
    topic,
    websiteContext,
    integrationId,
    revisionCount: 0,
    currentStage: 'started',
  };

  const result = await blogflowGraph.invoke(initialState, config);

  // Check if paused at interrupt
  const graphState = await blogflowGraph.getState(config);
  const isInterrupted = graphState.tasks?.some((t) => t.interrupts && t.interrupts.length > 0);

  const finalStatus = isInterrupted ? WorkflowStatus.PAUSED : result.error ? WorkflowStatus.FAILED : WorkflowStatus.COMPLETED;

  try {
    await prisma.workflowExecution.updateMany({
      where: { graphThreadId: threadId },
      data: {
        status: finalStatus,
        currentNode: isInterrupted ? 'humanApproval' : 'completed',
        errorMessage: result.error || null,
        blogId: (result.blogDraft as any)?.id || null,
      },
    });
  } catch {
    // Ignore
  }

  return {
    threadId,
    executionId,
    result,
    status: isInterrupted ? 'PAUSED_FOR_APPROVAL' : finalStatus,
  };
}

/**
 * Resumes an interrupted workflow at the Human Approval node.
 */
export async function resumeWorkflowDecision(params: {
  threadId: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  comments?: string;
  reviewerId?: string;
}): Promise<{ threadId: string; result: any; status: string }> {
  const { threadId, decision, comments, reviewerId } = params;
  const config = { configurable: { thread_id: threadId } };

  console.log(`[Workflow Engine] Resuming thread ${threadId} with decision: ${decision}`);

  const approvalPayload: HumanApprovalPayload = {
    decision,
    comments,
    reviewerId,
  };

  // Resume graph with the Command
  const result = await blogflowGraph.invoke(new Command({ resume: approvalPayload }), config);

  const graphState = await blogflowGraph.getState(config);
  const isInterrupted = graphState.tasks?.some((t) => t.interrupts && t.interrupts.length > 0);
  const finalStatus = isInterrupted ? WorkflowStatus.PAUSED : result.error ? WorkflowStatus.FAILED : WorkflowStatus.COMPLETED;

  try {
    await prisma.workflowExecution.updateMany({
      where: { graphThreadId: threadId },
      data: {
        status: finalStatus,
        currentNode: isInterrupted ? 'humanApproval' : 'completed',
        completedAt: finalStatus === WorkflowStatus.COMPLETED ? new Date() : null,
        errorMessage: result.error || null,
      },
    });
  } catch {
    // Ignore
  }

  return {
    threadId,
    result,
    status: isInterrupted ? 'PAUSED_FOR_APPROVAL' : finalStatus,
  };
}

/**
 * Gets the current state and execution trace of a workflow thread.
 */
export async function getWorkflowExecutionStatus(threadId: string) {
  const config = { configurable: { thread_id: threadId } };
  const state = await blogflowGraph.getState(config);

  const dbExecution = await prisma.workflowExecution.findUnique({
    where: { graphThreadId: threadId },
    include: { blog: true, website: true },
  }).catch(() => null);

  const isInterrupted = state.tasks?.some((t) => t.interrupts && t.interrupts.length > 0);

  return {
    threadId,
    status: isInterrupted ? 'PAUSED_FOR_APPROVAL' : dbExecution?.status || 'UNKNOWN',
    values: state.values,
    next: state.next,
    dbRecord: dbExecution,
  };
}
