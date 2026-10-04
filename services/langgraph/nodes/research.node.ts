import { WorkflowGraphState } from '@/services/langgraph/workflow.state';
import { researchService } from '@/services/research/research.service';
import { prisma } from '@/lib/prisma';

export async function researchNode(state: WorkflowGraphState): Promise<Partial<WorkflowGraphState>> {
  console.log(`[Agent 1: Research Agent] Starting research for topic: "${state.topic}"`);

  try {
    const websiteContext = state.websiteContext || {
      websiteName: 'Connected Website',
      niche: 'Technology',
      targetAudience: 'General Audience',
      writingTone: 'Professional',
      contentCategories: [],
      contentPreferences: [],
      preferredKeywords: [],
    };

    // Execute real research workflow using existing Tavily & Gemini services
    const researchReport = await researchService.conductResearch({
      topic: state.topic,
      niche: websiteContext.niche,
      targetAudience: websiteContext.targetAudience,
      keywords: websiteContext.preferredKeywords || [],
    });

    // Persist to PostgreSQL if database is connected
    try {
      if (state.websiteId) {
        const saved = await prisma.researchReport.create({
          data: {
            websiteId: state.websiteId,
            topic: state.topic,
            overview: researchReport.overview,
            keyInsights: researchReport.keyInsights as any,
            importantFacts: researchReport.importantFacts as any,
            suggestedHeadings: researchReport.suggestedHeadings as any,
            keywords: researchReport.keywords as any,
            sources: researchReport.sources as any,
            status: 'COMPLETED',
          },
        });
        researchReport.id = saved.id;
      }
    } catch (dbErr) {
      console.warn('[Agent 1] DB save warning (continuing with graph state):', dbErr);
    }

    return {
      researchReport,
      currentStage: 'research_completed',
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Agent 1: Research Agent] Failed:', message);
    return {
      error: `Research Agent failed: ${message}`,
      currentStage: 'research_failed',
    };
  }
}
