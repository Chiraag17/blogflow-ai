/**
 * Web Research Agent Service
 *
 * Implements Module 3 of the BlogFlow AI architecture.
 * Manages the 8-step autonomous research loop:
 * Query formulation -> Tavily multi-search -> Deduplication -> Information extraction ->
 * Gemini synthesis -> Structured Research Report generation.
 */

import { DetailedResearchReport } from '@/types';
import { geminiService } from '@/services/ai/gemini.service';
import { tavilyService } from '@/services/research/tavily.service';
import { promptService } from '@/services/ai/prompt.service';
import { outputValidatorService } from '@/services/ai/output-validator.service';

export interface ConductResearchInput {
  topic: string;
  niche?: string;
  targetAudience?: string;
  keywords?: string[];
  maxQueries?: number;
}

// In-memory cache for research reports (prepared for database migration in Part 3)
const researchReportStore = new Map<string, DetailedResearchReport>();

export class ResearchService {
  /**
   * Retrieves a previously generated research report by ID.
   */
  public getResearchReportById(id: string): DetailedResearchReport | undefined {
    return researchReportStore.get(id);
  }

  /**
   * Conducts multi-source web research and generates a structured research report.
   */
  public async conductResearch(input: ConductResearchInput): Promise<DetailedResearchReport> {
    const {
      topic,
      niche = 'General',
      targetAudience = 'Professionals and enthusiasts',
      keywords = [],
      maxQueries = 3,
    } = input;

    // STEP 1 & 2: Use Gemini to formulate 3-5 distinct, targeted search queries
    const queryPrompt = promptService.buildSearchQueryGenerationPrompt(topic, niche, targetAudience);

    let searchQueries: string[] = [];
    try {
      const queryResult = await geminiService.generateStructuredJson<{ queries: string[] }>({
        prompt: queryPrompt,
        systemInstruction: promptService.getSystemInstruction(),
        temperature: 0.4,
      });
      searchQueries = queryResult.queries || [];
    } catch {
      searchQueries = [
        `${topic} overview and fundamentals`,
        `${topic} latest trends and best practices`,
        `${topic} common challenges and solutions`,
      ];
    }

    // STEP 3 & 4: Send queries to Tavily and collect results
    const queriesToRun = searchQueries.slice(0, maxQueries);
    const rawSources = await tavilyService.multiSearch(queriesToRun, 4);

    // STEP 5 & 6: Deduplicate and format source items
    const sourceCandidates = rawSources.map((s) => ({
      title: s.title,
      url: s.url,
      content: s.content,
      publishedDate: s.publishedDate || null,
    }));

    if (sourceCandidates.length === 0) {
      throw new Error(`No web sources found for topic "${topic}". Please refine the query.`);
    }

    // STEP 7: Pass collected research to Gemini for deep synthesis
    const synthesisPrompt = promptService.buildResearchSynthesisPrompt({
      topic,
      niche,
      audience: targetAudience,
      sources: sourceCandidates,
    });

    const rawReport = await geminiService.generateStructuredJson<any>({
      prompt: synthesisPrompt,
      systemInstruction: promptService.getSystemInstruction(),
      temperature: 0.3,
    });

    // STEP 8: Validate and assemble structured report
    const report = outputValidatorService.validateResearchReport(rawReport, topic);

    // Preserve in cache
    researchReportStore.set(report.id, report);

    return report;
  }
}

export const researchService = new ResearchService();
