/**
 * SEO & Content Quality Evaluation Service
 *
 * Implements Agent 3 (SEO and Quality Agent) of the BlogFlow AI architecture.
 * Combines deterministic structural/SEO checks with deep AI auditing (grammar, readability,
 * factual consistency, and SEO alignment) via Gemini.
 */

import { QualityReport, QualityIssue, Blog } from '@/types';
import { countWords } from '@/lib/utils';
import { qualityAnalysisService } from '@/services/content/quality-analysis.service';

export class QualityService {
  /**
   * Evaluates an article's SEO, readability, and structural integrity deterministically.
   */
  evaluateContent(blog: Partial<Blog>): QualityReport {
    const issues: QualityIssue[] = [];
    const suggestions: string[] = [];

    const content = blog.content || '';
    const wordCount = countWords(content);
    const title = blog.title || '';
    const focusKeyword = (blog.focusKeyword || '').toLowerCase().trim();
    const metaTitle = blog.metaTitle || '';
    const metaDescription = blog.metaDescription || '';

    let seoScore = 70;
    let readabilityScore = 80;

    // 1. Title & Focus Keyword checks
    if (!focusKeyword) {
      issues.push({
        type: 'seo',
        severity: 'high',
        message: 'Focus keyword is not defined for this article.',
      });
      seoScore -= 20;
    } else {
      if (title.toLowerCase().includes(focusKeyword)) {
        seoScore += 10;
      } else {
        issues.push({
          type: 'seo',
          severity: 'medium',
          message: `Focus keyword "${focusKeyword}" is missing from the main article title.`,
        });
        suggestions.push(`Include "${focusKeyword}" in the article title for improved SERP ranking.`);
      }

      // Keyword occurrence in content
      const lowerContent = content.toLowerCase();
      const occurrences = (lowerContent.match(new RegExp(focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      if (occurrences === 0) {
        issues.push({
          type: 'seo',
          severity: 'high',
          message: `Focus keyword "${focusKeyword}" does not appear anywhere in the body text.`,
        });
        seoScore -= 10;
      } else if (occurrences < 3 && wordCount > 500) {
        suggestions.push(`Focus keyword appears only ${occurrences} time(s). Aim for 3-6 natural mentions.`);
      } else {
        seoScore += 10;
      }
    }

    // 2. Meta Title check
    if (!metaTitle) {
      issues.push({
        type: 'seo',
        severity: 'high',
        message: 'Meta title is missing.',
      });
      seoScore -= 15;
    } else if (metaTitle.length > 60) {
      issues.push({
        type: 'seo',
        severity: 'medium',
        message: `Meta title is ${metaTitle.length} characters (recommended max is 60).`,
      });
      seoScore -= 5;
    } else if (metaTitle.length < 30) {
      suggestions.push('Meta title is brief. Consider expanding to 45-60 characters with key terms.');
    } else {
      seoScore += 10;
    }

    // 3. Meta Description check
    if (!metaDescription) {
      issues.push({
        type: 'seo',
        severity: 'high',
        message: 'Meta description is missing.',
      });
      seoScore -= 15;
    } else if (metaDescription.length < 120) {
      suggestions.push('Meta description is under 120 characters; 140-160 characters is optimal.');
    } else if (metaDescription.length > 165) {
      issues.push({
        type: 'seo',
        severity: 'low',
        message: 'Meta description exceeds 165 characters and may be truncated on mobile search results.',
      });
    } else {
      seoScore += 10;
    }

    // 4. Word count & readability
    if (wordCount < 500) {
      issues.push({
        type: 'readability',
        severity: 'medium',
        message: `Article is only ${wordCount} words. In-depth guides generally require 1,000+ words.`,
      });
      readabilityScore -= 20;
    } else if (wordCount >= 1000) {
      readabilityScore += 10;
    }

    // 5. Structure & headings check
    const hasH2 = content.includes('## ');
    const hasH3 = content.includes('### ');
    if (!hasH2) {
      issues.push({
        type: 'structure',
        severity: 'high',
        message: 'No H2 subheadings found in article content. Structure requires clear section breaks.',
      });
      seoScore -= 10;
      readabilityScore -= 10;
    }

    if (!hasH3 && wordCount > 1000) {
      suggestions.push('Consider adding H3 subheadings to break down long sections for skimmability.');
    }

    // Calculate grammar status based on structure and flow
    const grammarScore = Math.max(70, Math.min(98, 90 - issues.length * 3));
    const finalSeoScore = Math.max(30, Math.min(99, seoScore));
    const finalReadabilityScore = Math.max(40, Math.min(98, readabilityScore));
    const overallScore = Math.round((finalSeoScore + finalReadabilityScore + grammarScore) / 3);

    const density = focusKeyword && wordCount > 0
      ? Number((((content.toLowerCase().match(new RegExp(focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length / wordCount) * 100).toFixed(2))
      : 0;

    return {
      id: `qr-${Date.now()}`,
      blogId: blog.id || 'draft',
      grammarScore,
      readabilityScore: finalReadabilityScore,
      seoScore: finalSeoScore,
      overallScore,
      issues,
      suggestions: suggestions.length > 0 ? suggestions : ['Article is well-structured and follows SEO best practices.'],
      keywordDensity: density,
      headingStructure: hasH2 ? 'good' : 'poor',
      contentOrganization: hasH2 && hasH3 ? 'good' : 'needs_improvement',
      duplicateContentWarning: false,
      isSimulated: false,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Conducts full multi-dimensional AI quality evaluation using Gemini.
   */
  async evaluateContentAsync(blog: Partial<Blog>, researchText?: string): Promise<QualityReport> {
    const content = blog.content || '';
    if (!content) {
      return this.evaluateContent(blog);
    }

    try {
      const detailed = await qualityAnalysisService.analyzeQuality({
        articleContent: content,
        topic: blog.title,
        focusKeyword: blog.focusKeyword || undefined,
        metaTitle: blog.metaTitle || undefined,
        metaDescription: blog.metaDescription || undefined,
        researchText,
      });

      const grammarScore =
        detailed.grammar.status === 'pass'
          ? Math.max(88, 96 - detailed.grammar.issues.length * 2)
          : detailed.grammar.status === 'needs_review'
          ? 75
          : 55;

      const readabilityScore = Math.round(detailed.readability.score);
      const seoScore = Math.round(detailed.seo.score);
      const overallScore = Math.round((readabilityScore + seoScore + grammarScore) / 3);

      const issues: QualityIssue[] = [
        ...detailed.grammar.issues.map((i) => ({
          type: 'grammar' as const,
          severity: 'medium' as const,
          message: i,
        })),
        ...detailed.seo.issues.map((i) => ({
          type: 'seo' as const,
          severity: 'medium' as const,
          message: i,
        })),
        ...detailed.factChecking.unsupportedClaims.map((c) => ({
          type: 'factual' as const,
          severity: 'high' as const,
          message: `Unsupported claim needing verification: ${c}`,
        })),
      ];

      const suggestions = [
        ...detailed.overallSuggestions,
        ...detailed.readability.suggestions,
        ...detailed.seo.suggestions,
      ].slice(0, 8);

      const wordCount = countWords(content);
      const focusKeyword = (blog.focusKeyword || '').toLowerCase().trim();
      const density = focusKeyword && wordCount > 0
        ? Number((((content.toLowerCase().match(new RegExp(focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length / wordCount) * 100).toFixed(2))
        : 0;

      return {
        id: `qr-${Date.now()}`,
        blogId: blog.id || 'draft',
        grammarScore,
        readabilityScore,
        seoScore,
        overallScore,
        issues,
        suggestions: suggestions.length > 0 ? suggestions : ['Content passed AI quality evaluation.'],
        keywordDensity: density,
        headingStructure: content.includes('## ') ? 'good' : 'poor',
        contentOrganization: content.includes('### ') ? 'good' : 'needs_improvement',
        duplicateContentWarning: false,
        isSimulated: false,
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('[QualityService] AI audit error, falling back to deterministic evaluation:', err);
      return this.evaluateContent(blog);
    }
  }
}

export const qualityService = new QualityService();
