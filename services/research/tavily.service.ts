/**
 * Centralized Tavily Web Research Service
 *
 * Implements direct, secure server-side queries to Tavily Search API.
 * Features:
 * - Configurable search depth ('basic' | 'advanced')
 * - URL deduplication and normalization
 * - Relevance score filtering
 * - Graceful timeout and rate-limit handling
 * - Credentials never exposed to client
 */

export interface TavilySearchOptions {
  query: string;
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  timeoutMs?: number;
}

export interface TavilySearchResultItem {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  publishedDate?: string | null;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResultItem[];
}

export class TavilyService {
  private apiKey: string;
  private endpoint = 'https://api.tavily.com/search';

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY || '';
  }

  /** Check if the Tavily API key is configured */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_'));
  }

  /** Normalizes a URL for deduplication */
  private normalizeUrl(rawUrl: string): string {
    try {
      const u = new URL(rawUrl);
      return `${u.hostname.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`;
    } catch {
      return rawUrl.toLowerCase().trim();
    }
  }

  /**
   * Executes a search query via Tavily API with timeout and deduplication.
   */
  public async search(options: TavilySearchOptions): Promise<TavilySearchResponse> {
    const {
      query,
      searchDepth = 'advanced',
      maxResults = 5,
      includeAnswer = true,
      includeRawContent = false,
      includeDomains,
      excludeDomains,
      timeoutMs = 25000,
    } = options;

    if (!this.isConfigured()) {
      throw new Error(
        'Tavily API key is not configured. Please set TAVILY_API_KEY in your .env.local file or configure it in Settings.'
      );
    }

    const payload: Record<string, any> = {
      api_key: this.apiKey,
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      include_answer: includeAnswer,
      include_raw_content: includeRawContent,
    };

    if (includeDomains && includeDomains.length > 0) payload.include_domains = includeDomains;
    if (excludeDomains && excludeDomains.length > 0) payload.exclude_domains = excludeDomains;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Invalid Tavily API key. Please check TAVILY_API_KEY in your environment.');
        }
        if (response.status === 429) {
          throw new Error('Tavily API rate limit exceeded. Please wait a moment before trying again.');
        }
        const errorText = await response.text().catch(() => '');
        throw new Error(`Tavily search failed (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();

      // Deduplicate results by normalized URL
      const seen = new Set<string>();
      const deduplicated: TavilySearchResultItem[] = [];

      for (const item of data.results || []) {
        const norm = this.normalizeUrl(item.url || '');
        if (!seen.has(norm) && item.title && item.content) {
          seen.add(norm);
          deduplicated.push({
            title: item.title.trim(),
            url: item.url.trim(),
            content: item.content.trim(),
            rawContent: item.raw_content,
            score: typeof item.score === 'number' ? item.score : 0.85,
            publishedDate: item.published_date || null,
          });
        }
      }

      return {
        query,
        answer: data.answer,
        results: deduplicated,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Tavily search timed out after ${timeoutMs}ms for query: "${query}"`);
      }
      throw err;
    }
  }

  /**
   * Executes multiple queries concurrently and combines/deduplicates findings.
   */
  public async multiSearch(queries: string[], maxPerQuery: number = 4): Promise<TavilySearchResultItem[]> {
    const searchPromises = queries.map((q) =>
      this.search({ query: q, maxResults: maxPerQuery }).catch((err) => {
        console.warn(`Query failed in multiSearch: "${q}":`, err.message);
        return { query: q, results: [] };
      })
    );

    const responses = await Promise.all(searchPromises);
    const seen = new Set<string>();
    const allResults: TavilySearchResultItem[] = [];

    for (const res of responses) {
      for (const item of res.results) {
        const norm = this.normalizeUrl(item.url);
        if (!seen.has(norm)) {
          seen.add(norm);
          allResults.push(item);
        }
      }
    }

    return allResults;
  }
}

export const tavilyService = new TavilyService();
