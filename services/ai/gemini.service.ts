/**
 * Centralized Google Gemini AI Service
 *
 * Provides a unified, resilient interface to Google's Gemini models using the official SDK.
 * Features:
 * - Environment-driven configuration (GEMINI_API_KEY, GEMINI_MODEL)
 * - Safe credential handling (never exposed to client)
 * - Exponential backoff retry for transient network/rate-limit errors
 * - Timeout protection via AbortController
 * - Structured JSON parsing and validation
 */

import { GoogleGenAI } from '@google/genai';

export interface GeminiGenerateOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: 'text/plain' | 'application/json';
  timeoutMs?: number;
  retries?: number;
}

export class GeminiService {
  private apiKey: string;
  private defaultModel: string;
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (this.apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (err) {
        console.error('Failed to initialize Google Gen AI client:', err);
      }
    }
  }

  /** Check if the Gemini API key is configured */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_'));
  }

  /** Get the configured model name */
  public getModelName(): string {
    return this.defaultModel;
  }

  /**
   * Generates text content with automatic retries and timeout protection.
   */
  public async generateText(options: GeminiGenerateOptions): Promise<string> {
    const {
      prompt,
      systemInstruction,
      temperature = 0.7,
      maxOutputTokens = 4096,
      responseMimeType = 'text/plain',
      timeoutMs = 60000,
      retries = 3,
    } = options;

    if (!this.isConfigured()) {
      throw new Error(
        'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env.local file or configure it in Settings.'
      );
    }

    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({ apiKey: this.apiKey });
    }

    let attempt = 0;
    let lastError: any = null;

    while (attempt < retries) {
      attempt++;
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`)), timeoutMs)
        );

        const config: Record<string, any> = {
          temperature,
          maxOutputTokens,
        };

        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }

        if (responseMimeType === 'application/json') {
          config.responseMimeType = 'application/json';
        }

        const requestPromise = this.aiClient.models.generateContent({
          model: this.defaultModel,
          contents: prompt,
          config,
        });

        const response: any = await Promise.race([requestPromise, timeoutPromise]);
        const text = response?.text || '';

        if (!text || text.trim().length === 0) {
          throw new Error('Empty response received from Gemini model.');
        }

        return text;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);

        // Don't retry on permanent authentication errors
        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('401') || errMsg.includes('invalid api key')) {
          throw new Error('Invalid Gemini API Key. Please verify your GEMINI_API_KEY in .env.local.');
        }

        // Retry on rate limits (429) or transient 5xx errors with exponential backoff
        if (attempt < retries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }
    }

    throw new Error(`Gemini generation failed after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Generates and parses a structured JSON response from Gemini.
   */
  public async generateStructuredJson<T>(
    options: Omit<GeminiGenerateOptions, 'responseMimeType'> & {
      validator?: (data: any) => { valid: boolean; error?: string };
    }
  ): Promise<T> {
    const rawText = await this.generateText({
      ...options,
      responseMimeType: 'application/json',
    });

    let cleaned = rawText.trim();

    // Strip markdown code fences if present (```json ... ```)
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    try {
      const parsed = JSON.parse(cleaned);

      if (options.validator) {
        const check = options.validator(parsed);
        if (!check.valid) {
          throw new Error(`Structured output validation failed: ${check.error}`);
        }
      }

      return parsed as T;
    } catch (parseError: any) {
      throw new Error(`Failed to parse structured JSON from Gemini output: ${parseError.message}\nRaw text: ${cleaned.slice(0, 300)}...`);
    }
  }
}

export const geminiService = new GeminiService();
