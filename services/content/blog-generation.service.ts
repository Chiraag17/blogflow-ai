/**
 * AI Blog Generation Agent Service
 *
 * Implements Module 4 of the BlogFlow AI architecture.
 * Transforms research reports and website context into publication-ready,
 * SEO-optimized, highly structured blog articles with FAQs and schema metadata.
 */

import {
  BlogGenerationFormData,
  BlogOutline,
  StructuredBlogOutput,
  DetailedResearchReport,
} from '@/types';
import { geminiService } from '@/services/ai/gemini.service';
import { promptService } from '@/services/ai/prompt.service';
import { outputValidatorService } from '@/services/ai/output-validator.service';

export interface GenerationStatusItem {
  id: string;
  stage:
    | 'initializing'
    | 'analyzing_research'
    | 'creating_outline'
    | 'writing_article'
    | 'generating_faqs_seo'
    | 'completed'
    | 'failed';
  progress: number;
  output?: StructuredBlogOutput;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const generationStatusMap = new Map<string, GenerationStatusItem>();

export class BlogGenerationService {
  /**
   * Retrieves status and progress for an active or completed generation job.
   */
  public getGenerationStatus(id: string): GenerationStatusItem | undefined {
    return generationStatusMap.get(id);
  }

  /**
   * Generates a structured blog outline before writing the full post.
   */
  public async generateOutline(
    topic: string,
    audience: string,
    tone: BlogGenerationFormData['tone'],
    researchSummary: string = ''
  ): Promise<BlogOutline> {
    const prompt = promptService.buildOutlinePrompt(topic, researchSummary, audience, tone);

    const rawOutline = await geminiService.generateStructuredJson<any>({
      prompt,
      systemInstruction: promptService.getSystemInstruction(),
      temperature: 0.5,
    });

    return outputValidatorService.validateBlogOutline(rawOutline, topic);
  }

  /**
   * Generates a complete blog post following the multi-step agent workflow.
   */
  public async generateCompleteBlog(
    params: BlogGenerationFormData,
    researchReport?: DetailedResearchReport,
    jobId?: string
  ): Promise<StructuredBlogOutput> {
    const id = jobId || `gen-${Date.now()}`;

    // Initialize status tracking
    generationStatusMap.set(id, {
      id,
      stage: 'analyzing_research',
      progress: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      // Step 1: Prepare research context
      let researchSummary = '';
      if (researchReport) {
        researchSummary = `Overview: ${researchReport.overview}\nKey Insights: ${researchReport.keyInsights.join('; ')}\nImportant Facts: ${researchReport.importantFacts.join('; ')}`;
      }

      // Step 2: Generate Outline
      generationStatusMap.set(id, {
        ...generationStatusMap.get(id)!,
        stage: 'creating_outline',
        progress: 40,
        updatedAt: new Date().toISOString(),
      });

      const outline = await this.generateOutline(
        params.topic,
        params.targetAudience,
        params.tone,
        researchSummary
      );

      // Step 3-7: Full Article Generation
      generationStatusMap.set(id, {
        ...generationStatusMap.get(id)!,
        stage: 'writing_article',
        progress: 70,
        updatedAt: new Date().toISOString(),
      });

      const blogPrompt = promptService.buildBlogGenerationPrompt({
        ...params,
        researchSummary,
        outline,
      });

      const rawBlog = await geminiService.generateStructuredJson<any>({
        prompt: blogPrompt,
        systemInstruction: promptService.getSystemInstruction(),
        temperature: 0.6,
        maxOutputTokens: 8192,
      });

      // Step 8: Validate and assemble complete output
      generationStatusMap.set(id, {
        ...generationStatusMap.get(id)!,
        stage: 'generating_faqs_seo',
        progress: 90,
        updatedAt: new Date().toISOString(),
      });

      const structuredBlog = outputValidatorService.validateStructuredBlog(rawBlog, params.topic);

      // Attach research citations if available
      if (researchReport?.sources) {
        structuredBlog.sources = researchReport.sources.map((s) => s.url);
      }

      generationStatusMap.set(id, {
        id,
        stage: 'completed',
        progress: 100,
        output: structuredBlog,
        createdAt: generationStatusMap.get(id)!.createdAt,
        updatedAt: new Date().toISOString(),
      });

      return structuredBlog;
    } catch (err: any) {
      generationStatusMap.set(id, {
        id,
        stage: 'failed',
        progress: 0,
        error: err.message || 'Generation failed',
        createdAt: generationStatusMap.get(id)?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      throw err;
    }
  }
}

export const blogGenerationService = new BlogGenerationService();
