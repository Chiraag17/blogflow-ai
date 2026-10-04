/**
 * Output Validator & Sanitizer Service
 *
 * Validates structured JSON responses from LLM services and sanitizes
 * user/LLM content to protect against XSS and malformed payloads.
 */

import {
  WebsiteAnalysis,
  ResearchTopic,
  DetailedResearchReport,
  BlogOutline,
  StructuredBlogOutput,
  DetailedQualityReport,
  ContentRevisionResponse,
} from '@/types';

export class OutputValidatorService {
  /**
   * Sanitizes untrusted strings by stripping script tags, javascript: links, and unsafe event handlers.
   */
  public sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:[^"'\s]+/gi, '')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  }

  /**
   * Validates and normalizes Website Analysis output.
   */
  public validateWebsiteAnalysis(data: any): WebsiteAnalysis {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Website Analysis payload: expected an object.');
    }

    return {
      id: `analysis-${Date.now()}`,
      websiteId: data.websiteId || 'web-temp',
      detectedNiche: this.sanitizeString(data.detectedNiche || 'General'),
      targetAudience: this.sanitizeString(data.targetAudience || 'General Audience'),
      existingContentSummary: this.sanitizeString(data.existingContentSummary || 'No existing content summary available.'),
      writingStyle: this.sanitizeString(data.writingStyle || 'Professional and informative'),
      contentOpportunities: Array.isArray(data.contentOpportunities)
        ? data.contentOpportunities.map((o: any) => this.sanitizeString(String(o))).slice(0, 10)
        : [],
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Validates Discovered Topics list.
   */
  public validateDiscoveredTopics(data: any): ResearchTopic[] {
    const rawList = Array.isArray(data?.topics) ? data.topics : Array.isArray(data) ? data : [];
    if (rawList.length === 0) {
      throw new Error('No valid topics discovered in model output.');
    }

    return rawList.map((item: any, index: number) => ({
      id: `topic-${Date.now()}-${index + 1}`,
      title: this.sanitizeString(item.title || 'Untitled Topic'),
      description: this.sanitizeString(item.description || ''),
      searchIntent: this.sanitizeString(item.searchIntent || 'Informational'),
      suggestedKeywords: Array.isArray(item.secondaryKeywords)
        ? [item.primaryKeyword, ...item.secondaryKeywords].filter(Boolean).map(String)
        : Array.isArray(item.suggestedKeywords)
        ? item.suggestedKeywords.map(String)
        : [item.primaryKeyword || 'topic'],
      insights: [
        this.sanitizeString(item.suggestedAngle || 'Comprehensive guide approach'),
        this.sanitizeString(item.relevanceReason || 'High relevance to connected website target audience'),
      ].filter(Boolean),
      sources: Array.isArray(item.supportingSources)
        ? item.supportingSources.map((s: any) => ({
            title: this.sanitizeString(s.title || 'Web Citation'),
            url: this.sanitizeString(s.url || '#'),
            snippet: this.sanitizeString(s.snippet || ''),
            relevanceScore: 90,
          }))
        : [],
      selected: index === 0,
    }));
  }

  /**
   * Validates Detailed Research Report.
   */
  public validateResearchReport(data: any, originalTopic: string): DetailedResearchReport {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Research Report payload: expected an object.');
    }

    return {
      id: `rep-${Date.now()}`,
      topic: this.sanitizeString(data.topic || originalTopic),
      overview: this.sanitizeString(data.overview || 'Research overview conducted across web sources.'),
      keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights.map((i: any) => this.sanitizeString(String(i))) : [],
      importantFacts: Array.isArray(data.importantFacts) ? data.importantFacts.map((f: any) => this.sanitizeString(String(f))) : [],
      differentPerspectives: Array.isArray(data.differentPerspectives)
        ? data.differentPerspectives.map((p: any) => this.sanitizeString(String(p)))
        : [],
      subtopics: Array.isArray(data.subtopics) ? data.subtopics.map((st: any) => this.sanitizeString(String(st))) : [],
      suggestedHeadings: Array.isArray(data.suggestedHeadings)
        ? data.suggestedHeadings.map((h: any) => this.sanitizeString(String(h)))
        : [],
      keywords: Array.isArray(data.keywords) ? data.keywords.map((k: any) => this.sanitizeString(String(k))) : [],
      sources: Array.isArray(data.sources)
        ? data.sources.map((src: any) => ({
            title: this.sanitizeString(src.title || 'Web Citation'),
            url: this.sanitizeString(src.url || '#'),
            publishedDate: src.publishedDate ? String(src.publishedDate) : null,
            relevance: this.sanitizeString(src.relevance || 'Medium'),
            summary: this.sanitizeString(src.summary || ''),
          }))
        : [],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Validates Blog Outline.
   */
  public validateBlogOutline(data: any, topic: string): BlogOutline {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Blog Outline payload.');
    }

    return {
      title: this.sanitizeString(data.title || topic),
      angle: this.sanitizeString(data.angle || 'In-depth comprehensive guide'),
      targetAudience: this.sanitizeString(data.targetAudience || 'General readers'),
      estimatedWordCount: typeof data.estimatedWordCount === 'number' ? data.estimatedWordCount : 1500,
      sections: Array.isArray(data.sections)
        ? data.sections.map((s: any) => ({
            heading: this.sanitizeString(s.heading || 'Section'),
            intent: this.sanitizeString(s.intent || ''),
            subheadings: Array.isArray(s.subheadings) ? s.subheadings.map((sh: any) => this.sanitizeString(String(sh))) : [],
            keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints.map((kp: any) => this.sanitizeString(String(kp))) : [],
          }))
        : [],
    };
  }

  /**
   * Validates Structured Blog Output and builds complete markdown string.
   */
  public validateStructuredBlog(data: any, topic: string): StructuredBlogOutput {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Blog generation payload.');
    }

    const title = this.sanitizeString(data.title || `${topic}: The Definitive Guide`);
    const subtitle = this.sanitizeString(data.subtitle || '');
    const slug = this.sanitizeString(data.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    const introduction = this.sanitizeString(data.introduction || '');
    const conclusion = this.sanitizeString(data.conclusion || '');

    const sections = Array.isArray(data.sections)
      ? data.sections.map((sec: any) => ({
          heading: this.sanitizeString(sec.heading || 'Section'),
          content: this.sanitizeString(sec.content || ''),
          subheadings: Array.isArray(sec.subheadings)
            ? sec.subheadings.map((sub: any) => ({
                heading: this.sanitizeString(sub.heading || ''),
                content: this.sanitizeString(sub.content || ''),
              }))
            : [],
        }))
      : [];

    const faqs = Array.isArray(data.faqs)
      ? data.faqs.map((f: any) => ({
          question: this.sanitizeString(f.question || ''),
          answer: this.sanitizeString(f.answer || ''),
        }))
      : [];

    const seo = {
      metaTitle: this.sanitizeString(data.seo?.metaTitle || `${title.slice(0, 55)}`),
      metaDescription: this.sanitizeString(data.seo?.metaDescription || `${introduction.slice(0, 150)}`),
      focusKeyword: this.sanitizeString(data.seo?.focusKeyword || topic),
      secondaryKeywords: Array.isArray(data.seo?.secondaryKeywords)
        ? data.seo.secondaryKeywords.map((k: any) => this.sanitizeString(String(k)))
        : [],
      suggestedSlug: this.sanitizeString(data.seo?.suggestedSlug || slug),
    };

    // Assemble unified markdown
    const mdLines: string[] = [];
    mdLines.push(`# ${title}\n`);
    if (subtitle) mdLines.push(`*${subtitle}*\n`);
    if (introduction) mdLines.push(`${introduction}\n`);

    sections.forEach((sec: any) => {
      mdLines.push(`## ${sec.heading}\n`);
      if (sec.content) mdLines.push(`${sec.content}\n`);
      if (sec.subheadings && sec.subheadings.length > 0) {
        sec.subheadings.forEach((sub: any) => {
          mdLines.push(`### ${sub.heading}\n`);
          if (sub.content) mdLines.push(`${sub.content}\n`);
        });
      }
    });

    if (conclusion) {
      mdLines.push(`## Conclusion\n`);
      mdLines.push(`${conclusion}\n`);
    }

    if (faqs.length > 0) {
      mdLines.push(`## Frequently Asked Questions\n`);
      faqs.forEach((faq: any) => {
        mdLines.push(`**Q: ${faq.question}**\n\n${faq.answer}\n`);
      });
    }

    const fullMarkdown = mdLines.join('\n');
    const wordCount = fullMarkdown.split(/\s+/).filter(Boolean).length;
    const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 220));

    return {
      title,
      subtitle,
      slug,
      introduction,
      sections,
      conclusion,
      faqs,
      seo,
      sources: Array.isArray(data.sources) ? data.sources.map((s: any) => this.sanitizeString(String(s))) : [],
      wordCount,
      estimatedReadingTime,
      fullMarkdown,
    };
  }

  /**
   * Validates Detailed Quality Report.
   */
  public validateQualityReport(data: any): DetailedQualityReport {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Quality Report payload.');
    }

    return {
      grammar: {
        status: ['pass', 'needs_review', 'fail'].includes(data.grammar?.status) ? data.grammar.status : 'pass',
        issues: Array.isArray(data.grammar?.issues) ? data.grammar.issues.map((i: any) => this.sanitizeString(String(i))) : [],
      },
      readability: {
        score: typeof data.readability?.score === 'number' ? Math.min(100, Math.max(0, data.readability.score)) : 85,
        suggestions: Array.isArray(data.readability?.suggestions)
          ? data.readability.suggestions.map((s: any) => this.sanitizeString(String(s)))
          : [],
      },
      seo: {
        score: typeof data.seo?.score === 'number' ? Math.min(100, Math.max(0, data.seo.score)) : 85,
        issues: Array.isArray(data.seo?.issues) ? data.seo.issues.map((i: any) => this.sanitizeString(String(i))) : [],
        suggestions: Array.isArray(data.seo?.suggestions)
          ? data.seo.suggestions.map((s: any) => this.sanitizeString(String(s)))
          : [],
      },
      contentQuality: {
        score: typeof data.contentQuality?.score === 'number' ? Math.min(100, Math.max(0, data.contentQuality.score)) : 88,
        strengths: Array.isArray(data.contentQuality?.strengths)
          ? data.contentQuality.strengths.map((s: any) => this.sanitizeString(String(s)))
          : [],
        weaknesses: Array.isArray(data.contentQuality?.weaknesses)
          ? data.contentQuality.weaknesses.map((w: any) => this.sanitizeString(String(w)))
          : [],
      },
      factChecking: {
        supportedClaims: Array.isArray(data.factChecking?.supportedClaims)
          ? data.factChecking.supportedClaims.map((c: any) => this.sanitizeString(String(c)))
          : [],
        unsupportedClaims: Array.isArray(data.factChecking?.unsupportedClaims)
          ? data.factChecking.unsupportedClaims.map((c: any) => this.sanitizeString(String(c)))
          : [],
        verificationRequired: Array.isArray(data.factChecking?.verificationRequired)
          ? data.factChecking.verificationRequired.map((v: any) => this.sanitizeString(String(v)))
          : [],
      },
      overallSuggestions: Array.isArray(data.overallSuggestions)
        ? data.overallSuggestions.map((s: any) => this.sanitizeString(String(s)))
        : [],
    };
  }

  /**
   * Validates Content Revision Response.
   */
  public validateRevision(data: any): ContentRevisionResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Content Revision response.');
    }

    return {
      revisedText: this.sanitizeString(data.revisedText || ''),
      explanation: this.sanitizeString(data.explanation || 'Content revised per instructions.'),
      confidenceScore: typeof data.confidenceScore === 'number' ? data.confidenceScore : 90,
    };
  }
}

export const outputValidatorService = new OutputValidatorService();
