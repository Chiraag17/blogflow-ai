import { WorkflowGraphState } from '../workflow.state';
import { WordPressService } from '../../cms/wordpress.service';
import { prisma } from '@/lib/prisma';

export async function publisherNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState>> {
  console.log('[Agent 4: Publishing Agent] Starting publishing workflow');

  const blogId = (state.blogDraft as any)?.id;
  if (!blogId) {
    return {
      error: 'Cannot publish without a persisted blog ID.',
      currentStage: 'publishing_failed',
    };
  }

  // 1. Independent Database-Level Verification
  // The publishing agent MUST independently verify approval in PostgreSQL
  const dbBlog = await prisma.blog.findUnique({
    where: { id: blogId },
    include: {
      approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
      website: { include: { cmsIntegrations: true } },
    },
  });

  if (!dbBlog) {
    return {
      error: 'Security Check Failed: Blog record not found in PostgreSQL.',
      currentStage: 'publishing_failed',
    };
  }

  const latestApproval = dbBlog.approvals[0];
  const isApproved =
    dbBlog.status === 'APPROVED' ||
    dbBlog.status === 'SCHEDULED' ||
    latestApproval?.status === 'APPROVED';

  if (!isApproved) {
    return {
      error: 'Security Violation: Publishing rejected. Blog has not been approved by a human reviewer.',
      currentStage: 'publishing_blocked',
    };
  }

  // 2. Resolve CMS Integration
  const integrationId =
    state.integrationId || dbBlog.website.cmsIntegrations.find((c) => c.connectionStatus === 'CONNECTED')?.id;

  if (!integrationId) {
    console.log('[Agent 4] No active CMS integration configured. Blog remains approved for manual publish.');
    return {
      publishingResult: {
        success: true,
        message: 'Blog is APPROVED. Connect WordPress in Settings to enable automated remote publishing.',
        status: 'approved_ready_for_cms',
      },
      currentStage: 'publishing_completed',
      error: null,
    };
  }

  // 3. Publish to WordPress using WordPressService
  try {
    const result = await WordPressService.publishPost({
      blogId,
      integrationId,
      publishMode: 'draft',
    });

    if (!result.success) {
      return {
        error: result.error || 'WordPress publication failed.',
        publishingResult: result,
        currentStage: 'publishing_failed',
      };
    }

    console.log(`[Agent 4: Publishing Agent] Successfully published to WordPress! URL: ${result.publishedUrl}`);

    return {
      publishingResult: result,
      currentStage: 'publishing_completed',
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Agent 4: Publishing Agent] Publishing error:', message);
    return {
      error: `Publishing Agent failed: ${message}`,
      currentStage: 'publishing_failed',
    };
  }
}
