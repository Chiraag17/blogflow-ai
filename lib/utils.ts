// ============================================================
// BlogFlow AI - Utility Functions
// ============================================================

import { BlogStatus, ConnectionStatus, ApprovalStatus, AutomationStatus } from '@/types';

/** Format a date string into a human-readable form */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format a date string with time */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Get relative time string (e.g., "2 hours ago") */
export function timeAgo(dateStr: string): string {
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

/** Generate a URL slug from a string */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Truncate text to a maximum length */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/** Calculate word count from markdown content */
export function wordCount(content: string): number {
  return content
    .replace(/[#*_\[\]()>`-]/g, '')
    .split(/\s+/)
    .filter(Boolean).length;
}

export const countWords = wordCount;

/** Estimate reading time in minutes */
export function readingTime(words: number): number {
  return Math.max(1, Math.ceil(words / 250));
}

export function calculateReadingTime(content: string): number {
  return readingTime(wordCount(content));
}

/** Get badge color class for blog status */
export function getStatusColor(status: BlogStatus): string {
  const colors: Record<BlogStatus, string> = {
    draft: 'bg-slate-100 text-slate-700',
    researching: 'bg-blue-100 text-blue-700',
    generating: 'bg-indigo-100 text-indigo-700',
    quality_check: 'bg-amber-100 text-amber-700',
    pending_approval: 'bg-orange-100 text-orange-700',
    changes_requested: 'bg-red-100 text-red-700',
    approved: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-purple-100 text-purple-700',
    published: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
}

/** Get human-readable label for blog status */
export function getStatusLabel(status: BlogStatus): string {
  const labels: Record<BlogStatus, string> = {
    draft: 'Draft',
    researching: 'Researching',
    generating: 'Generating',
    quality_check: 'Quality Check',
    pending_approval: 'Pending Approval',
    changes_requested: 'Changes Requested',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
  };
  return labels[status] || status;
}

/** Get badge color class for connection status */
export function getConnectionColor(status: ConnectionStatus): string {
  const colors: Record<ConnectionStatus, string> = {
    connected: 'bg-green-100 text-green-700',
    disconnected: 'bg-slate-100 text-slate-600',
    pending: 'bg-amber-100 text-amber-700',
    error: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}

/** Get badge color for approval status */
export function getApprovalColor(status: ApprovalStatus): string {
  const colors: Record<ApprovalStatus, string> = {
    pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    revision_requested: 'bg-amber-100 text-amber-700',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}

/** Get badge color for automation status */
export function getAutomationColor(status: AutomationStatus): string {
  const colors: Record<AutomationStatus, string> = {
    active: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
    draft: 'bg-slate-100 text-slate-600',
  };
  return colors[status] || 'bg-slate-100 text-slate-600';
}

/** Classname merger utility */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Validate URL format */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Niche options for selection */
export const NICHE_OPTIONS = [
  'Technology', 'Health & Wellness', 'Business & Startups',
  'Finance', 'Marketing', 'Education', 'Lifestyle',
  'Travel', 'Food & Cooking', 'Fashion', 'Sports',
  'Science', 'Entertainment', 'Real Estate', 'Other',
];

/** Tone options for selection */
export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'academic', label: 'Academic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'technical', label: 'Technical' },
  { value: 'persuasive', label: 'Persuasive' },
];

/** Article length options */
export const LENGTH_OPTIONS = [
  { value: 'short', label: 'Short (500-800 words)' },
  { value: 'medium', label: 'Medium (800-1500 words)' },
  { value: 'long', label: 'Long (1500-2500 words)' },
  { value: 'comprehensive', label: 'Comprehensive (2500+ words)' },
];

/** Allowed status transitions – enforces workflow rules */
export const ALLOWED_TRANSITIONS: Record<BlogStatus, BlogStatus[]> = {
  draft: ['researching', 'generating'],
  researching: ['generating', 'draft', 'failed'],
  generating: ['quality_check', 'draft', 'failed'],
  quality_check: ['pending_approval', 'draft', 'failed'],
  pending_approval: ['approved', 'changes_requested'],
  changes_requested: ['draft', 'generating', 'pending_approval'],
  approved: ['scheduled', 'published'],
  scheduled: ['published', 'approved'],
  published: [],
  failed: ['draft'],
};
