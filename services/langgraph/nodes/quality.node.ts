import { WorkflowGraphState } from '@/services/langgraph/workflow.state';
import { qualityAnalysisService } from '@/services/content/quality-analysis.service';
import { prisma } from '@/lib/prisma';
import { BlogArticleSection } from '@/types';

export async function qualityNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState>> {
  console.log('[Agent 3: SEO and Quality Agent] Auditing article quality, readability, SEO, and facts');

  if (!state.blogDraft) {
    return {
      error: 'Cannot evaluate quality without an article draft.',
      currentStage: 'quality_failed',
    };
  }

  try {
    const fullContent = [
      state.blogDraft.introduction,
      ...state.blogDraft.sections.map((s: BlogArticleSection) => `### ${s.heading}\n${s.content}`),
      state.blogDraft.conclusion,
    ].join('\n\n');

    // Run independent quality analysis with Gemini
    const researchText = state.researchReport
      ? `${state.researchReport.overview}\nInsights: ${state.researchReport.keyInsights?.join('; ')}\nFacts: ${state.researchReport.importantFacts?.join('; ')}`
      : undefined;

    const qualityReport = await qualityAnalysisService.analyzeQuality({
      articleContent: fullContent,
      topic: state.topic,
      focusKeyword: state.blogDraft.seo.focusKeyword,
      metaTitle: state.blogDraft.seo.metaTitle,
      metaDescription: state.blogDraft.seo.metaDescription,
      researchText,
    });

    // Persist to PostgreSQL if available
    const blogId = (state.blogDraft as any).id;
    if (blogId) {
      try {
        await prisma.qualityReport.create({
          data: {
            blogId,
            grammarStatus: qualityReport.grammar.status,
            readabilityScore: qualityReport.readability.score,
            seoScore: qualityReport.seo.score,
            contentQualityScore: qualityReport.contentQuality.score,
            factCheckingResults: qualityReport.factChecking as any,
            issues: [...qualityReport.grammar.issues, ...qualityReport.seo.issues] as any,
            suggestions: qualityReport.overallSuggestions as any,
          },
        });
      } catch (dbErr) {
        console.warn('[Agent 3] DB save warning (continuing with graph state):', dbErr);
      }
    }

    return {
      qualityReport,
      currentStage: 'quality_checked',
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Agent 3: SEO and Quality Agent] Failed:', message);
    return {
      error: `Quality Agent failed: ${message}`,
      currentStage: 'quality_failed',
    };
  }
}
