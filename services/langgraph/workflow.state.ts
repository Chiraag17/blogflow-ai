import { Annotation } from '@langchain/langgraph';
import { DetailedResearchReport, StructuredBlogOutput, DetailedQualityReport } from '@/types';

export interface WorkflowGraphState {
  userId: string;
  websiteId: string;
  topic: string;
  websiteContext?: any;
  researchReport?: DetailedResearchReport | null;
  blogDraft?: StructuredBlogOutput | null;
  qualityReport?: DetailedQualityReport | null;
  revisionCount: number;
  approvalDecision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION' | '';
  reviewerComments?: string;
  integrationId?: string;
  publishingResult?: any;
  error?: string | null;
  currentStage: string;
}

export const BlogWorkflowAnnotation = Annotation.Root({
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  websiteId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  topic: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  websiteContext: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  researchReport: Annotation<DetailedResearchReport | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  blogDraft: Annotation<StructuredBlogOutput | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  qualityReport: Annotation<DetailedQualityReport | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  revisionCount: Annotation<number>({
    reducer: (x, y) => (typeof y === 'number' ? y : x),
    default: () => 0,
  }),
  approvalDecision: Annotation<'APPROVE' | 'REJECT' | 'REQUEST_REVISION' | ''>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  reviewerComments: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  integrationId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  publishingResult: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => null,
  }),
  currentStage: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => 'idle',
  }),
});
