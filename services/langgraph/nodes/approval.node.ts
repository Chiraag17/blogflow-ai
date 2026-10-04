import { interrupt } from '@langchain/langgraph';
import { WorkflowGraphState } from '../workflow.state';
import { prisma } from '@/lib/prisma';
import { BlogStatus, ApprovalStatus } from '@prisma/client';

export interface HumanApprovalPayload {
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  comments?: string;
  reviewerId?: string;
}

export async function approvalNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState>> {
  console.log('[Human Approval Node] Article entered human approval boundary.');

  const blogId = (state.blogDraft as any)?.id;

  // 1. Update Blog status to PENDING_APPROVAL in PostgreSQL
  if (blogId) {
    try {
      await prisma.blog.update({
        where: { id: blogId },
        data: { status: BlogStatus.PENDING_APPROVAL },
      });

      // Create or update Approval record
      await prisma.approval.create({
        data: {
          blogId,
          status: ApprovalStatus.PENDING,
          comments: 'Awaiting human review in Approval Center.',
        },
      });
    } catch (dbErr) {
      console.warn('[Approval Node] DB update warning:', dbErr);
    }
  }

  // 2. Pause the LangGraph workflow using human-in-the-loop interrupt
  // State is frozen and preserved in PostgreSQL checkpoint
  const humanDecision = interrupt({
    message: 'Article generation and quality checks complete. Awaiting human approval.',
    blogId,
    topic: state.topic,
    title: state.blogDraft?.title,
    qualityScore: state.qualityReport?.contentQuality.score,
    timestamp: new Date().toISOString(),
  }) as HumanApprovalPayload | 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';

  // 3. Normalized decision & reviewer comments upon resumption
  const decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION' =
    typeof humanDecision === 'object' ? humanDecision.decision : (humanDecision || 'APPROVE');
  const comments = typeof humanDecision === 'object' ? humanDecision.comments : undefined;

  console.log(`[Human Approval Node] Resumed with decision: "${decision}"`);

  // 4. Update PostgreSQL status based on human decision
  if (blogId) {
    try {
      let newStatus: BlogStatus = BlogStatus.PENDING_APPROVAL;
      let appStatus: ApprovalStatus = ApprovalStatus.PENDING;

      if (decision === 'APPROVE') {
        newStatus = BlogStatus.APPROVED;
        appStatus = ApprovalStatus.APPROVED;
      } else if (decision === 'REJECT') {
        newStatus = BlogStatus.REJECTED;
        appStatus = ApprovalStatus.REJECTED;
      } else if (decision === 'REQUEST_REVISION') {
        newStatus = BlogStatus.CHANGES_REQUESTED;
        appStatus = ApprovalStatus.REVISION_REQUESTED;
      }

      await prisma.blog.update({
        where: { id: blogId },
        data: { status: newStatus },
      });

      await prisma.approval.create({
        data: {
          blogId,
          status: appStatus,
          comments: comments || `Human decision recorded: ${decision}`,
          reviewedAt: new Date(),
        },
      });
    } catch (dbErr) {
      console.warn('[Approval Node] Post-resume DB update warning:', dbErr);
    }
  }

  return {
    approvalDecision: decision,
    reviewerComments: comments,
    currentStage: `approval_${decision.toLowerCase()}`,
    error: null,
  };
}
