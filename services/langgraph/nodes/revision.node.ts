import { WorkflowGraphState } from '@/services/langgraph/workflow.state';
import { contentRevisionService } from '@/services/content/content-revision.service';
import { prisma } from '@/lib/prisma';
import { BlogStatus } from '@prisma/client';
import { BlogArticleSection } from '@/types';

export async function revisionNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState>> {
  console.log(`[Content Revision Agent] Applying revisions (attempt #${state.revisionCount + 1})`);

  if (!state.blogDraft) {
    return {
      error: 'Cannot revise content without an article draft.',
      currentStage: 'revision_failed',
    };
  }

  try {
    const comments =
      state.reviewerComments ||
      state.qualityReport?.overallSuggestions?.join('; ') ||
      'Improve overall clarity, readability, and structural flow.';

    // Execute full article revision addressing quality issues and reviewer comments
    const revisedBlog = await contentRevisionService.reviseFullArticle({
      blog: state.blogDraft,
      qualityReport: state.qualityReport,
      reviewerComments: comments,
    });

    const blogId = (state.blogDraft as any).id;
    (revisedBlog as any).id = blogId;

    // Update in PostgreSQL
    if (blogId) {
      try {
        const fullContent = [
          `## ${revisedBlog.title}`,
          revisedBlog.subtitle ? `*${revisedBlog.subtitle}*\n` : '',
          revisedBlog.introduction,
          ...revisedBlog.sections.map((s: BlogArticleSection) => `### ${s.heading}\n\n${s.content}`),
          `### Conclusion\n\n${revisedBlog.conclusion}`,
        ].join('\n\n');

        await prisma.blog.update({
          where: { id: blogId },
          data: {
            title: revisedBlog.title,
            subtitle: revisedBlog.subtitle,
            content: fullContent,
            introduction: revisedBlog.introduction,
            conclusion: revisedBlog.conclusion,
            faqs: revisedBlog.faqs as any,
            metaTitle: revisedBlog.seo.metaTitle,
            metaDescription: revisedBlog.seo.metaDescription,
            status: BlogStatus.CHANGES_REQUESTED,
          },
        });
      } catch (dbErr) {
        console.warn('[Revision Agent] DB update warning:', dbErr);
      }
    }

    return {
      blogDraft: revisedBlog,
      revisionCount: state.revisionCount + 1,
      currentStage: 'revision_completed',
      approvalDecision: '', // Reset decision for subsequent evaluation
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Content Revision Agent] Failed:', message);
    return {
      error: `Content Revision Agent failed: ${message}`,
      currentStage: 'revision_failed',
    };
  }
}
