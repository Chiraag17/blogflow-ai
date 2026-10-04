// ============================================================
// BlogFlow AI - Core Type Definitions
// ============================================================

// --- Enums & Status Types ---

export type BlogStatus =
  | 'draft'
  | 'researching'
  | 'generating'
  | 'quality_check'
  | 'pending_approval'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed';

export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';

export type ResearchStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

export type AutomationStatus = 'active' | 'paused' | 'draft';

export type PublishingStatus = 'pending' | 'publishing' | 'published' | 'failed' | 'scheduled';

export type WritingTone =
  | 'professional'
  | 'casual'
  | 'academic'
  | 'conversational'
  | 'authoritative'
  | 'friendly'
  | 'technical'
  | 'persuasive';

export type ArticleLength = 'short' | 'medium' | 'long' | 'comprehensive';

// --- User ---

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

// --- Website ---

export interface Website {
  id: string;
  userId: string;
  name: string;
  url: string;
  niche: string;
  audience: string;
  tone: WritingTone;
  keywords: string[];
  excludedTopics: string[];
  connectionStatus: ConnectionStatus;
  blogsGenerated: number;
  lastActivity: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteAnalysis {
  id: string;
  websiteId: string;
  detectedNiche: string;
  targetAudience: string;
  existingContentSummary: string;
  writingStyle: string;
  contentOpportunities: string[];
  analyzedAt: string;
}

// --- Research ---

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevanceScore: number;
}

export interface ResearchTopic {
  id: string;
  title: string;
  description: string;
  searchIntent: string;
  suggestedKeywords: string[];
  insights: string[];
  sources: ResearchSource[];
  selected: boolean;
}

export interface Research {
  id: string;
  websiteId: string;
  topic: string;
  category: string;
  targetAudience: string;
  keywords: string[];
  discoveredTopics: ResearchTopic[];
  status: ResearchStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Blog ---

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogImageSuggestion {
  description: string;
  altText: string;
  placement: string;
}

export interface Blog {
  id: string;
  websiteId: string;
  websiteName: string;
  researchId?: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  introduction?: string;
  conclusion?: string;
  faqs: BlogFAQ[];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  tags: string[];
  category: string;
  imageSuggestions: BlogImageSuggestion[];
  references: string[];
  status: BlogStatus;
  wordCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

// --- Quality Report ---

export interface QualityIssue {
  type: 'grammar' | 'seo' | 'readability' | 'structure' | 'factual';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
  location?: string;
}

export interface QualityReport {
  id: string;
  blogId: string;
  grammarScore: number;
  readabilityScore: number;
  seoScore: number;
  overallScore: number;
  issues: QualityIssue[];
  suggestions: string[];
  keywordDensity: number;
  headingStructure: 'good' | 'needs_improvement' | 'poor';
  contentOrganization: 'good' | 'needs_improvement' | 'poor';
  duplicateContentWarning: boolean;
  /** Note: Quality scores are simulated in the current phase. */
  isSimulated: boolean;
  createdAt: string;
}

// --- Approval ---

export interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  blogId: string;
  blogTitle: string;
  reviewerId?: string;
  reviewerName?: string;
  status: ApprovalStatus;
  comments: ApprovalComment[];
  reviewedAt?: string;
  createdAt: string;
}

// --- Integration ---

export interface Integration {
  id: string;
  websiteId: string;
  websiteName: string;
  provider: 'wordpress' | 'custom';
  connectionStatus: ConnectionStatus;
  siteUrl: string;
  lastSynced?: string;
  configuration: {
    apiEndpoint?: string;
    username?: string;
    /** Credentials are never exposed to the frontend */
    hasCredentials: boolean;
  };
  createdAt: string;
}

// --- Publishing ---

export interface PublishingRecord {
  id: string;
  blogId: string;
  blogTitle: string;
  provider: string;
  publishedUrl?: string;
  status: PublishingStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

// --- Automation ---

export interface AutomationRule {
  id: string;
  websiteId: string;
  websiteName: string;
  researchFrequency: string;
  generationFrequency: string;
  preferredDays: string[];
  publishingTime: string;
  maxBlogsPerWeek: number;
  requireApproval: boolean;
  status: AutomationStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Analytics ---

export interface AnalyticsData {
  totalBlogs: number;
  publishedBlogs: number;
  pendingApproval: number;
  scheduledBlogs: number;
  connectedWebsites: number;
  avgSeoScore: number;
  avgReadabilityScore: number;
  blogsByMonth: { month: string; count: number }[];
  publishingActivity: { date: string; published: number; generated: number }[];
  statusDistribution: { status: string; count: number }[];
  topCategories: { category: string; count: number }[];
}

// --- API Response ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// --- Form Types ---

export interface WebsiteFormData {
  name: string;
  url: string;
  niche: string;
  audience: string;
  tone: WritingTone;
  keywords: string[];
  excludedTopics: string[];
}

export interface ResearchFormData {
  websiteId: string;
  topic: string;
  category: string;
  targetAudience: string;
  keywords?: string[];
}

export interface BlogGenerationFormData {
  websiteId: string;
  researchId?: string;
  topic: string;
  category: string;
  targetAudience: string;
  tone: WritingTone;
  articleLength: ArticleLength;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  instructions: string;
}

export interface IntegrationFormData {
  websiteId: string;
  provider: 'wordpress';
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export interface PublishFormData {
  blogId: string;
  category: string;
  tags: string[];
  publishingStatus: 'publish' | 'schedule';
  scheduledDate?: string;
  featuredImage?: string;
}

// --- Part 2: Intelligence & Research Types ---

export interface ResearchSourceItem {
  title: string;
  url: string;
  publishedDate: string | null;
  relevance: string;
  summary: string;
}

export interface DetailedResearchReport {
  id: string;
  topic: string;
  overview: string;
  keyInsights: string[];
  importantFacts: string[];
  differentPerspectives: string[];
  subtopics: string[];
  suggestedHeadings: string[];
  keywords: string[];
  sources: ResearchSourceItem[];
  createdAt: string;
}

export interface BlogOutlineSection {
  heading: string;
  intent: string;
  subheadings: string[];
  keyPoints: string[];
}

export interface BlogOutline {
  title: string;
  angle: string;
  targetAudience: string;
  estimatedWordCount: number;
  sections: BlogOutlineSection[];
}

export interface BlogArticleSection {
  heading: string;
  content: string;
  subheadings?: {
    heading: string;
    content: string;
  }[];
}

export interface StructuredBlogOutput {
  title: string;
  subtitle: string;
  slug: string;
  introduction: string;
  sections: BlogArticleSection[];
  conclusion: string;
  faqs: BlogFAQ[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
    secondaryKeywords: string[];
    suggestedSlug: string;
  };
  sources: string[];
  estimatedReadingTime: number;
  wordCount: number;
  fullMarkdown: string;
}

export interface DetailedQualityReport {
  grammar: {
    status: 'pass' | 'needs_review' | 'fail';
    issues: string[];
  };
  readability: {
    score: number;
    suggestions: string[];
  };
  seo: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  contentQuality: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  factChecking: {
    supportedClaims: string[];
    unsupportedClaims: string[];
    verificationRequired: string[];
  };
  overallSuggestions: string[];
}

export type RevisionAction =
  | 'rewrite_paragraph'
  | 'improve_intro'
  | 'improve_conclusion'
  | 'expand_section'
  | 'shorten_section'
  | 'change_tone'
  | 'improve_readability'
  | 'optimize_title'
  | 'improve_seo';

export interface ContentRevisionRequest {
  action: RevisionAction;
  selectedText: string;
  fullContent?: string;
  targetTone?: WritingTone;
  customInstructions?: string;
}

export interface ContentRevisionResponse {
  revisedText: string;
  explanation: string;
  confidenceScore: number;
}

