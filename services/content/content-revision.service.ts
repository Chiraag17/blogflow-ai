/**
 * AI Content Revision Service
 *
 * Implements Module 6 of the BlogFlow AI architecture.
 * Executes targeted micro-revisions on specific passages, sections, titles, or metadata,
 * as well as full-article iterative refinement based on quality audit reports.
 */

import {
  ContentRevisionRequest,
  ContentRevisionResponse,
  StructuredBlogOutput,
  DetailedQualityReport,
} from '@/types';
import { geminiService } from '@/services/ai/gemini.service';
import { promptService } from '@/services/ai/prompt.service';
import { outputValidatorService } from '@/services/ai/output-validator.service';

export class ContentRevisionService {
  /**
   * Generates an AI-revised proposal for the selected text passage.
   */
  public async reviseContent(request: ContentRevisionRequest): Promise<ContentRevisionResponse> {
    if (!request.selectedText || request.selectedText.trim().length === 0) {
      throw new Error('Please select or provide text to revise.');
    }

    const prompt = promptService.buildRevisionPrompt(request);

    const rawResponse = await geminiService.generateStructuredJson<any>({
      prompt,
      systemInstruction: promptService.getSystemInstruction(),
      temperature: 0.6,
      maxOutputTokens: 2500,
    });

    return outputValidatorService.validateRevision(rawResponse);
  }

  /**
   * Revises a complete structured blog article to resolve quality audit issues or reviewer comments.
   */
  public async reviseFullArticle(params: {
    blog: StructuredBlogOutput;
    qualityReport?: DetailedQualityReport | null;
    reviewerComments?: string;
  }): Promise<StructuredBlogOutput> {
    const { blog, qualityReport, reviewerComments } = params;

    const auditNotes = [
      reviewerComments ? `Editorial Instructions: ${reviewerComments}` : '',
      qualityReport?.grammar?.issues?.length
        ? `Grammar Issues to Fix: ${qualityReport.grammar.issues.join('; ')}`
        : '',
      qualityReport?.seo?.issues?.length
        ? `SEO Issues to Fix: ${qualityReport.seo.issues.join('; ')}`
        : '',
      qualityReport?.contentQuality?.weaknesses?.length
        ? `Content Weaknesses to Address: ${qualityReport.contentQuality.weaknesses.join('; ')}`
        : '',
      qualityReport?.factChecking?.unsupportedClaims?.length
        ? `Unsupported Claims to Soften or Ground: ${qualityReport.factChecking.unsupportedClaims.join('; ')}`
        : '',
      qualityReport?.overallSuggestions?.length
        ? `Key Improvement Suggestions: ${qualityReport.overallSuggestions.join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `You are BlogFlow AI's Content Revision Agent. Revise and enhance the following blog article to address the quality audit findings and editorial notes.

<quality_audit_findings>
${auditNotes || 'Improve clarity, flow, readability, and SEO alignment.'}
</quality_audit_findings>

<current_article>
${JSON.stringify(
  {
    title: blog.title,
    subtitle: blog.subtitle,
    slug: blog.slug,
    introduction: blog.introduction,
    sections: blog.sections,
    conclusion: blog.conclusion,
    faqs: blog.faqs,
    seo: blog.seo,
  },
  null,
  2
)}
</current_article>

Instructions:
1. Maintain or improve the overall word count and depth.
2. Directly resolve the grammar, readability, SEO, and structural issues listed in the audit.
3. Preserve the core topic and focus keyword while enhancing transitions and clarity.
4. Return a valid JSON object matching this schema:
{
  "title": "Engaging Article Title",
  "subtitle": "Informative Subtitle",
  "slug": "url-friendly-slug",
  "introduction": "Comprehensive introduction...",
  "sections": [
    {
      "heading": "Section H2 Title",
      "content": "In-depth section body text in Markdown format...",
      "subheadings": [
        {
          "heading": "Subsection H3 Title",
          "content": "Subsection body text in Markdown format..."
        }
      ]
    }
  ],
  "conclusion": "Reflective conclusion...",
  "faqs": [
    {
      "question": "Question?",
      "answer": "Answer..."
    }
  ],
  "seo": {
    "metaTitle": "SEO Title",
    "metaDescription": "SEO Description",
    "focusKeyword": "${blog.seo?.focusKeyword || blog.title}",
    "secondaryKeywords": ${JSON.stringify(blog.seo?.secondaryKeywords || [])},
    "suggestedSlug": "${blog.slug}"
  },
  "sources": []
}`;

    const rawResponse = await geminiService.generateStructuredJson<any>({
      prompt,
      systemInstruction: promptService.getSystemInstruction(),
      temperature: 0.5,
      maxOutputTokens: 8192,
    });

    const revised = outputValidatorService.validateStructuredBlog(rawResponse, blog.title);
    revised.sources = blog.sources || [];
    return revised;
  }
}

export const contentRevisionService = new ContentRevisionService();
