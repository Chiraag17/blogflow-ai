/**
 * AI Topic Discovery Agent Service
 *
 * Implements Module 2 of the BlogFlow AI architecture.
 * Formulates focused search queries, retrieves real-time SERP discoveries via Tavily,
 * and uses Gemini to discover, evaluate, and structure high-relevance blog topics.
 */

import { ResearchTopic } from '@/types';
import { geminiService } from '@/services/ai/gemini.service';
import { tavilyService } from '@/services/research/tavily.service';
import { promptService } from '@/services/ai/prompt.service';
import { outputValidatorService } from '@/services/ai/output-validator.service';

export interface DiscoverTopicsInput {
  websiteId: string;
  websiteName: string;
  niche: string;
  targetAudience: string;
  keywords?: string[];
  excludedTopics?: string[];
  seedTopic?: string;
}

export class TopicDiscoveryService {
  /**
   * Discovers topical opportunities using Tavily web search and Gemini intelligence.
   */
  public async discoverTopics(input: DiscoverTopicsInput): Promise<ResearchTopic[]> {
    const {
      websiteName,
      niche,
      targetAudience,
      keywords = [],
      excludedTopics = [],
      seedTopic,
    } = input;

    // Step 1: Generate search queries using Gemini
    const queryTopic = seedTopic || `${niche} trends best practices guide`;
    const queryPrompt = promptService.buildSearchQueryGenerationPrompt(queryTopic, niche, targetAudience);

    let searchQueries: string[] = [];
    try {
      const queryResult = await geminiService.generateStructuredJson<{ queries: string[] }>({
        prompt: queryPrompt,
        systemInstruction: promptService.getSystemInstruction(),
        temperature: 0.5,
      });
      searchQueries = queryResult.queries || [];
    } catch (err) {
      console.warn('Fallback search queries used:', err);
      searchQueries = [
        `${niche} trends 2025`,
        `${niche} best practices guide for ${targetAudience}`,
        `${queryTopic} practical implementation`,
      ];
    }

    // Step 2: Query Tavily for real-world web data
    let searchData: any[] = [];
    try {
      searchData = await tavilyService.multiSearch(searchQueries.slice(0, 3), 3);
    } catch (err: any) {
      console.error('Tavily search failed in topic discovery:', err?.message || err);
      throw new Error(`Tavily web search failed during topic discovery: ${err?.message || 'Network error'}`);
    }

    if (!searchData || searchData.length === 0) {
      throw new Error(`No web search data returned from Tavily for topic discovery in niche: "${niche}".`);
    }

    // Step 3: Pass search data to Gemini for structured topic discovery
    const discoveryPrompt = promptService.buildTopicDiscoveryPrompt({
      websiteName,
      niche,
      audience: targetAudience,
      keywords,
      excludedTopics,
      searchData,
    });

    const rawTopics = await geminiService.generateStructuredJson<any>({
      prompt: discoveryPrompt,
      systemInstruction: promptService.getSystemInstruction(),
      temperature: 0.7,
    });

    const validatedTopics = outputValidatorService.validateDiscoveredTopics(rawTopics);

    // Filter out excluded topics if any matched by keyword
    if (excludedTopics.length > 0) {
      const lowerExcluded = excludedTopics.map((e) => e.toLowerCase().trim());
      return validatedTopics.filter((t) => {
        const titleLower = t.title.toLowerCase();
        const descLower = t.description.toLowerCase();
        return !lowerExcluded.some((ex) => titleLower.includes(ex) || descLower.includes(ex));
      });
    }

    return validatedTopics;
  }
}

export const topicDiscoveryService = new TopicDiscoveryService();
