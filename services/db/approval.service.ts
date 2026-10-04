import { prisma } from '@/lib/prisma';
import { BlogStatus, ApprovalStatus } from '@prisma/client';
import { resumeWorkflowDecision } from '../langgraph/workflow.graph';

export class DbApprovalService {
  /**
   * Retrieves all blogs awaiting human review.
   */
  public static async getPendingApprovals() {
    try {
      return await prisma.blog.findMany({
        where: {
          status: {
            in: [BlogStatus.PENDING_APPROVAL, BlogStatus.CHANGES_REQUESTED],
          },
        },
        include: {
          website: { select: { id: true, name: true, url: true } },
          researchReport: true,
          qualityReports: { orderBy: { createdAt: 'desc' }, take: 1 },
          approvals: { orderBy: { createdAt: 'desc' } },
          workflowExecutions: {
            where: { status: 'PAUSED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (err) {
      console.warn('[DbApprovalService] DB query fallback:', err);
      return [];
    }
  }

  /**
   * Retrieves review history across all articles.
   */
  public static async getApprovalHistory() {
    try {
      return await prisma.approval.findMany({
        include: {
          blog: {
            include: {
              website: { select: { id: true, name: true, url: true } },
              researchReport: true,
              qualityReports: { orderBy: { createdAt: 'desc' }, take: 1 },
              publishingRecords: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
          reviewer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (err) {
      console.warn('[DbApprovalService] getApprovalHistory fallback:', err);
      return [];
    }
  }

  /**
   * Handles human approval decision: APPROVE, REJECT, or REQUEST_REVISION.
   * Resumes LangGraph workflow thread if associated.
   */
  public static async processDecision(params: {
    blogId: string;
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
    comments?: string;
    reviewerId?: string;
  }) {
    const { blogId, decision, comments, reviewerId } = params;

    // 1. Fetch blog and active workflow execution thread
    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        workflowExecutions: {
          where: { status: 'PAUSED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!blog) {
      throw new Error(`Blog with ID ${blogId} not found.`);
    }

    let newBlogStatus: BlogStatus = BlogStatus.PENDING_APPROVAL;
    let approvalStatus: ApprovalStatus = ApprovalStatus.PENDING;

    if (decision === 'APPROVE') {
      newBlogStatus = BlogStatus.APPROVED;
      approvalStatus = ApprovalStatus.APPROVED;
    } else if (decision === 'REJECT') {
      newBlogStatus = BlogStatus.REJECTED;
      approvalStatus = ApprovalStatus.REJECTED;
    } else if (decision === 'REQUEST_REVISION') {
      newBlogStatus = BlogStatus.CHANGES_REQUESTED;
      approvalStatus = ApprovalStatus.REVISION_REQUESTED;
    }

    // 2. Update PostgreSQL database records
    const [updatedBlog, approvalRecord] = await prisma.$transaction([
      prisma.blog.update({
        where: { id: blogId },
        data: { status: newBlogStatus },
      }),
      prisma.approval.create({
        data: {
          blogId,
          reviewerId,
          status: approvalStatus,
          comments: comments || `Human decision recorded: ${decision}`,
          reviewedAt: new Date(),
        },
      }),
    ]);

    // 3. Resume LangGraph workflow execution if thread exists
    let graphResumeResult = null;
    const threadId = blog.workflowExecutions[0]?.graphThreadId;
    if (threadId) {
      try {
        console.log(`[Approval Service] Resuming LangGraph thread ${threadId} after human decision.`);
        graphResumeResult = await resumeWorkflowDecision({
          threadId,
          decision,
          comments,
          reviewerId,
        });
      } catch (graphErr) {
        console.warn(`[Approval Service] Graph resumption notice:`, graphErr);
      }
    }

    return {
      success: true,
      blog: updatedBlog,
      approval: approvalRecord,
      graphResume: graphResumeResult,
    };
  }
}
