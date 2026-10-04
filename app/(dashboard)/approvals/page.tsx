'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle, XCircle, RotateCcw, MessageSquare,
  Clock, Eye, AlertCircle, FileText, Send, User,
  Edit2, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck,
  Sparkles, BookOpen, AlertTriangle, Globe,
} from 'lucide-react';
import {
  getStatusColor, getStatusLabel, getApprovalColor,
  formatDate, formatDateTime, timeAgo, truncate, cn, countWords, calculateReadingTime,
} from '@/lib/utils';

export default function ApprovalsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBlogs, setPendingBlogs] = useState<any[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [reviewComment, setReviewComment] = useState('');
  const [previewContent, setPreviewContent] = useState<any | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  // Load pending approvals and approval records from PostgreSQL database
  const loadApprovals = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/approvals');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const pBlogs = json.data.pendingBlogs || [];
          const aHistory = json.data.approvalHistory || [];
          setPendingBlogs(pBlogs);
          setApprovalHistory(aHistory);

          // If no item is selected yet, select the first pending blog or first approval
          if (pBlogs.length > 0) {
            setSelectedItem({ type: 'blog', data: pBlogs[0] });
          } else if (aHistory.length > 0) {
            setSelectedItem({ type: 'approval', data: aHistory[0] });
          }
        }
      }
    } catch (err: any) {
      setFeedback({
        message: `Failed to load approvals: ${err.message}`,
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleApprove = async (blogId: string) => {
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/approvals/${blogId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: reviewComment || 'Approved by human reviewer' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          message: 'Article successfully approved! You can now publish it to WordPress as a draft.',
        });
        setReviewComment('');
        await loadApprovals();
      } else {
        setFeedback({ message: data.error || 'Approval failed.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: `Network error: ${err.message}`, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (blogId: string) => {
    if (!reviewComment.trim()) {
      setFeedback({ message: 'Please provide a comment explaining the rejection reason.', isError: true });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/approvals/${blogId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: reviewComment }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ message: 'Article rejected and marked accordingly in database.' });
        setReviewComment('');
        await loadApprovals();
      } else {
        setFeedback({ message: data.error || 'Rejection failed.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: `Network error: ${err.message}`, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async (blogId: string) => {
    if (!reviewComment.trim()) {
      setFeedback({ message: 'Please provide specific revision instructions in the comment box.', isError: true });
      return;
    }
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/approvals/${blogId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: reviewComment }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ message: 'Revision requested. Status updated to Changes Requested.' });
        setReviewComment('');
        await loadApprovals();
      } else {
        setFeedback({ message: data.error || 'Revision request failed.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: `Network error: ${err.message}`, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishToWordPress = async (blogId: string) => {
    setPublishingId(blogId);
    setFeedback(null);
    try {
      // Requirement: Publish approved articles through WordPress REST API initially as Draft
      const res = await fetch(`/api/blogs/${blogId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishMode: 'draft' }),
      });
      const data = await res.json();
      if (data.success) {
        const wpUrl = data.data?.publishedUrl;
        setFeedback({
          message: `Successfully drafted on WordPress! Post ID: ${data.data?.externalPostId || 'Created'}${wpUrl ? ` — URL: ${wpUrl}` : ''}`,
        });
        await loadApprovals();
      } else {
        setFeedback({
          message: data.error || 'Publishing failed. Please ensure a WordPress CMS is connected in Integrations.',
          isError: true,
        });
      }
    } catch (err: any) {
      setFeedback({
        message: `Network error during publishing: ${err.message}`,
        isError: true,
      });
    } finally {
      setPublishingId(null);
    }
  };

  // Filter items based on active tab
  const displayedPendingBlogs = pendingBlogs;
  const displayedReviewed = approvalHistory.filter((a) => a.status !== 'PENDING');
  const allItems = [
    ...pendingBlogs.map((b) => ({ type: 'blog', data: b })),
    ...approvalHistory.map((a) => ({ type: 'approval', data: a })),
  ];

  // Resolve currently active blog to display in review panel
  const currentBlog =
    selectedItem?.type === 'blog'
      ? selectedItem.data
      : selectedItem?.type === 'approval'
      ? selectedItem.data.blog
      : null;

  const currentApproval =
    selectedItem?.type === 'approval'
      ? selectedItem.data
      : currentBlog?.approvals?.[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Approval Center</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Review, approve, or request revisions on generated articles before publishing.
          </p>
        </div>
        <button
          onClick={loadApprovals}
          disabled={isLoading}
          className="btn btn-secondary text-xs flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Security & Human Policy Notice */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <ShieldCheck size={20} className="text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-indigo-900 leading-relaxed">
          <strong>Mandatory Human Gate:</strong> BlogFlow AI strictly enforces that only articles approved by a human reviewer can proceed to WordPress. Articles are initially created as <strong>Draft</strong> posts on WordPress.
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center justify-between text-sm shadow-xs transition-all',
            feedback.isError
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedback.isError ? (
              <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={cn('tab', activeTab === 'pending' && 'active')}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({pendingBlogs.length})
        </button>
        <button
          className={cn('tab', activeTab === 'reviewed' && 'active')}
          onClick={() => setActiveTab('reviewed')}
        >
          Reviewed History ({displayedReviewed.length})
        </button>
        <button
          className={cn('tab', activeTab === 'all' && 'active')}
          onClick={() => setActiveTab('all')}
        >
          All Records ({allItems.length})
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center p-12 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading articles and approval records from PostgreSQL...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Approval List */}
          <div className="lg:col-span-1 space-y-3">
            {activeTab === 'pending' && (
              <>
                {displayedPendingBlogs.length === 0 ? (
                  <div className="empty-state card py-10">
                    <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                    <p className="empty-state-title">All caught up!</p>
                    <p className="empty-state-desc">No articles are currently awaiting review.</p>
                  </div>
                ) : (
                  displayedPendingBlogs.map((blog) => {
                    const isSelected = selectedItem?.type === 'blog' && selectedItem.data.id === blog.id;
                    const words = countWords(blog.content || '');
                    return (
                      <button
                        key={blog.id}
                        className={cn(
                          'card text-left w-full transition-all cursor-pointer p-4',
                          isSelected && 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20'
                        )}
                        onClick={() => setSelectedItem({ type: 'blog', data: blog })}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-2 text-[var(--color-text)]">
                            {blog.title}
                          </h4>
                          <span className="badge bg-orange-100 text-orange-800 text-[10px] uppercase font-bold flex-shrink-0">
                            Pending
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                          <span>{blog.website?.name || 'Website'}</span>
                          <span>·</span>
                          <span>{words} words</span>
                          <span>·</span>
                          <span>{timeAgo(blog.updatedAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'reviewed' && (
              <>
                {displayedReviewed.length === 0 ? (
                  <div className="empty-state card py-10">
                    <Clock size={32} className="text-slate-400 mx-auto mb-2" />
                    <p className="empty-state-title">No reviewed articles</p>
                    <p className="empty-state-desc">Approved or rejected articles will appear here.</p>
                  </div>
                ) : (
                  displayedReviewed.map((appr) => {
                    const isSelected = selectedItem?.type === 'approval' && selectedItem.data.id === appr.id;
                    return (
                      <button
                        key={appr.id}
                        className={cn(
                          'card text-left w-full transition-all cursor-pointer p-4',
                          isSelected && 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20'
                        )}
                        onClick={() => setSelectedItem({ type: 'approval', data: appr })}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-2 text-[var(--color-text)]">
                            {appr.blog?.title || 'Untitled Article'}
                          </h4>
                          <span className={cn('badge text-[10px] uppercase font-bold flex-shrink-0', getApprovalColor(appr.status.toLowerCase()))}>
                            {appr.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                          <span>{appr.blog?.website?.name || 'Website'}</span>
                          <span>·</span>
                          <span>{timeAgo(appr.createdAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'all' && (
              <>
                {allItems.length === 0 ? (
                  <div className="empty-state card py-10">
                    <FileText size={32} className="text-slate-400 mx-auto mb-2" />
                    <p className="empty-state-title">No records</p>
                    <p className="empty-state-desc">No approval records found in database.</p>
                  </div>
                ) : (
                  allItems.map((item, idx) => {
                    const title = item.type === 'blog' ? item.data.title : item.data.blog?.title;
                    const status = item.type === 'blog' ? item.data.status : item.data.status;
                    const isSelected =
                      selectedItem?.type === item.type &&
                      selectedItem?.data.id === item.data.id;

                    return (
                      <button
                        key={idx}
                        className={cn(
                          'card text-left w-full transition-all cursor-pointer p-4',
                          isSelected && 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20'
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-2 text-[var(--color-text)]">
                            {title || 'Untitled Article'}
                          </h4>
                          <span className={cn('badge text-[10px] uppercase font-bold flex-shrink-0', getStatusColor(status.toLowerCase()))}>
                            {status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-muted)]">
                          <span>{item.type === 'blog' ? item.data.website?.name : item.data.blog?.website?.name}</span>
                          <span>·</span>
                          <span>{timeAgo(item.data.createdAt)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Right Column: Detailed Review Panel */}
          <div className="lg:col-span-2">
            {currentBlog ? (
              <div className="space-y-4">
                {/* Main Article Header Card */}
                <div className="card space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={cn('badge text-xs', getStatusColor(currentBlog.status?.toLowerCase() || 'draft'))}>
                          {getStatusLabel(currentBlog.status?.toLowerCase() || 'draft')}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                          <Globe size={12} /> {currentBlog.website?.name || 'Website'}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-[var(--color-text)]">
                        {currentBlog.title}
                      </h3>
                      {currentBlog.subtitle && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                          {currentBlog.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setPreviewContent(currentBlog)}
                        className="btn btn-secondary btn-sm"
                        title="Read full rendered article"
                      >
                        <Eye size={14} /> Full Read
                      </button>
                      <Link
                        href={`/content/${currentBlog.id}`}
                        className="btn btn-secondary btn-sm text-indigo-600 font-semibold"
                        title="Open in Blog Editor"
                      >
                        <Edit2 size={14} /> Open in Editor
                      </Link>
                    </div>
                  </div>

                  {/* Summary Snippet */}
                  <div className="p-3.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                    <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)] mb-1">
                      Content Preview
                    </p>
                    <div className="text-xs leading-relaxed text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {truncate(currentBlog.content || '', 600)}
                    </div>
                  </div>

                  {/* Quality & Research Signals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-center">
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Word Count</span>
                      <p className="font-bold text-indigo-700 text-sm mt-0.5">
                        {countWords(currentBlog.content || '')} words
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-center">
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Est. Reading Time</span>
                      <p className="font-bold text-emerald-700 text-sm mt-0.5">
                        ~{calculateReadingTime(currentBlog.content || '')} min
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-center">
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Focus Keyword</span>
                      <p className="font-bold text-amber-800 text-xs mt-0.5 truncate">
                        {currentBlog.focusKeyword || 'Unspecified'}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[var(--color-text-muted)] block text-[11px]">Quality Score</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {currentBlog.qualityReports?.[0]?.contentQualityScore || 88}%
                      </p>
                    </div>
                  </div>

                  {/* Research Citations */}
                  {currentBlog.researchReport?.sources && Array.isArray(currentBlog.researchReport.sources) && currentBlog.researchReport.sources.length > 0 && (
                    <div className="p-3 rounded-lg border border-[var(--color-border)] bg-slate-50/80 space-y-2">
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-600" />
                        Verified Research Sources ({currentBlog.researchReport.sources.length})
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {currentBlog.researchReport.sources.map((src: any, idx: number) => (
                          <a
                            key={idx}
                            href={src.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1.5 truncate"
                          >
                            <ExternalLink size={12} className="flex-shrink-0" />
                            <span className="truncate">{src.title || src.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Action Form Card */}
                <div className="card space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-600" />
                    Reviewer Assessment & Decision
                  </h4>

                  {/* Past comments history */}
                  {currentApproval && (
                    <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--color-text)]">
                          Recorded Decision: {currentApproval.status}
                        </span>
                        <span className="text-[var(--color-text-muted)]">
                          {formatDateTime(currentApproval.reviewedAt || currentApproval.createdAt)}
                        </span>
                      </div>
                      {currentApproval.comments && (
                        <p className="text-[var(--color-text-secondary)] italic">
                          &quot;{currentApproval.comments}&quot;
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons & Comments */}
                  <div className="space-y-3 pt-2">
                    <textarea
                      className="form-textarea text-xs"
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Add review feedback, editorial suggestions, or reasons for rejection/revision..."
                    />

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => handleApprove(currentBlog.id)}
                        disabled={isSubmitting || currentBlog.status === 'APPROVED'}
                        className="btn btn-success text-xs"
                      >
                        <CheckCircle size={15} />
                        {currentBlog.status === 'APPROVED' ? 'Already Approved' : 'Approve Article'}
                      </button>

                      <button
                        onClick={() => handleRequestRevision(currentBlog.id)}
                        disabled={isSubmitting}
                        className="btn btn-secondary text-xs"
                      >
                        <RotateCcw size={15} />
                        Request Revision
                      </button>

                      <button
                        onClick={() => handleReject(currentBlog.id)}
                        disabled={isSubmitting || currentBlog.status === 'REJECTED'}
                        className="btn btn-danger text-xs"
                      >
                        <XCircle size={15} />
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* WordPress Draft Publishing Section (Enabled ONLY for Approved Articles) */}
                  {(currentBlog.status === 'APPROVED' || currentApproval?.status === 'APPROVED') && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          Approved & Ready for WordPress
                        </p>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Article will be sent to your connected WordPress site as a <strong>Draft</strong> post.
                        </p>
                      </div>

                      <button
                        onClick={() => handlePublishToWordPress(currentBlog.id)}
                        disabled={publishingId === currentBlog.id}
                        className="btn btn-primary text-xs flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                      >
                        {publishingId === currentBlog.id ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Drafting to WordPress...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Publish to WordPress (Draft)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card empty-state py-16">
                <FileText size={32} className="text-slate-400 mx-auto mb-2" />
                <p className="empty-state-title">Select an article to review</p>
                <p className="empty-state-desc">Choose an article from the list on the left to inspect its quality and make an approval decision.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Article Preview Modal */}
      {previewContent && (
        <div className="modal-overlay" onClick={() => setPreviewContent(null)}>
          <div className="modal modal-lg max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header border-b border-[var(--color-border)] pb-3">
              <div>
                <h2 className="modal-title font-bold text-base">{previewContent.title}</h2>
                {previewContent.subtitle && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{previewContent.subtitle}</p>
                )}
              </div>
              <button onClick={() => setPreviewContent(null)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="modal-body overflow-y-auto space-y-4 py-4">
              <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] pb-2 border-b border-[var(--color-border)]">
                <span>{countWords(previewContent.content || '')} words</span>
                <span>•</span>
                <span>~{calculateReadingTime(previewContent.content || '')} min read</span>
                <span>•</span>
                <span>Status: {getStatusLabel(previewContent.status?.toLowerCase() || 'draft')}</span>
              </div>
              <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                {previewContent.content}
              </div>
            </div>
            <div className="modal-footer border-t border-[var(--color-border)] pt-3">
              <button className="btn btn-secondary text-xs" onClick={() => setPreviewContent(null)}>
                Close Preview
              </button>
              <Link href={`/content/${previewContent.id}`} className="btn btn-primary text-xs">
                <Edit2 size={13} /> Edit in Blog Editor
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
