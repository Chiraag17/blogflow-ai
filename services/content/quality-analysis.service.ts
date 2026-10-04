/**
 * SEO & Content Quality Analysis Agent Service
 *
 * Implements Module 5 of the BlogFlow AI architecture.
 * Conducts multi-dimensional auditing:
 * Grammar & sentence structure, Readability index, SEO health, Content quality,
 * and Factual grounding against research sources.
 */

import { DetailedQualityReport } from '@/types';
import { geminiService } from '@/services/ai/gemini.service';
import { promptService } from '@/services/ai/prompt.service';
import { outputValidatorService } from '@/services/ai/output-validator.service';

export interface QualityAnalysisInput {
  articleContent: string;
  topic?: string;
  focusKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  researchText?: string;
}

export class QualityAnalysisService {
  /**
   * Conducts an independent quality and factual consistency audit.
   */
  public async analyzeQuality(input: QualityAnalysisInput): Promise<DetailedQualityReport> {
    const { articleContent, researchText } = input;

    if (!articleContent || articleContent.trim().length === 0) {
      throw new Error('Article content is required for quality analysis.');
    }

    const prompt = promptService.buildQualityAnalysisPrompt(articleContent, researchText);

    const rawReport = await geminiService.generateStructuredJson<any>({
      prompt,
      systemInstruction: promptService.getSystemInstruction(),
      temperature: 0.2, // Low temperature for consistent evaluation
    });

    return outputValidatorService.validateQualityReport(rawReport);
  }
}

export const qualityAnalysisService = new QualityAnalysisService();
