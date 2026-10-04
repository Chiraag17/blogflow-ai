'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Send, CheckCircle2, AlertTriangle, Info,
  Sparkles, Eye, FileText, Globe, Tag, Award, CheckCircle,
  HelpCircle, Search, RefreshCw, BarChart2, Wand2, Check,
  X, ShieldCheck, ArrowRight, BookOpen, AlertCircle, ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  calculateReadingTime, countWords, formatDate, getStatusColor,
  getStatusLabel, cn,
} from '@/lib/utils';
import { Blog, QualityReport, DetailedQualityReport, RevisionAction, WritingTone } from '@/types';

export default function BlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const blogId = resolvedParams.id;

  const blogs = useAppStore((s) => s.blogs);
  const updateBlog = useAppStore((s) => s.updateBlog);
  const updateBlogStatus = useAppStore((s) => s.updateBlogStatus);
  const addApproval = useAppStore((s) => s.addApproval);
  const qualityReports = useAppStore((s) => s.qualityReports);
  const addQualityReport = useAppStore((s) => s.addQualityReport);

  const fallbackBlog = blogs.find((b) => b.id === blogId);

  const [isLoading, setIsLoading] = useState(true);
  const [blogData, setBlogData] = useState<any>(fallbackBlog || null);
  const [researchReport, setResearchReport] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'editor' | 'seo' | 'faqs' | 'preview'>('editor');
  const [formData, setFormData] = useState<Partial<Blog>>({
    title: '',
    subtitle: '',
    slug: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    focusKeyword: '',
    secondaryKeywords: [],
    category: '',
    tags: [],
    faqs: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<QualityReport | undefined>(undefined);
  const [detailedReport, setDetailedReport] = useState<DetailedQualityReport | null>(null);

  // AI Content Revision Studio state
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Fetch article from PostgreSQL database on mount
  useEffect(() => {
    let isMounted = true;

    async function loadBlog() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/blogs/${blogId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            const dbBlog = json.data;
            setBlogData(dbBlog);
            setResearchReport(dbBlog.researchReport || null);

            setFormData({
              title: dbBlog.title || '',
              subtitle: dbBlog.subtitle || '',
              slug: dbBlog.slug || '',
              content: dbBlog.content || '',
              introduction: dbBlog.introduction || '',
              conclusion: dbBlog.conclusion || '',
              metaTitle: dbBlog.metaTitle || '',
              metaDescription: dbBlog.metaDescription || '',
              focusKeyword: dbBlog.focusKeyword || '',
              secondaryKeywords: dbBlog.secondaryKeywords || [],
              category: dbBlog.category || '',
              tags: dbBlog.tags || [],
              faqs: dbBlog.faqs || [],
            });

            // Map quality report if available from PostgreSQL
            if (dbBlog.qualityReports && dbBlog.qualityReports.length > 0) {
              const qr = dbBlog.qualityReports[0];
              const mappedReport: QualityReport = {
                id: qr.id,
                blogId: qr.blogId,
                grammarScore: qr.grammarStatus === 'PASSED' ? 95 : 75,
                readabilityScore: qr.readabilityScore || 85,
                seoScore: qr.seoScore || 85,
                overallScore: qr.contentQualityScore || 88,
                issues: Array.isArray(qr.issues) ? qr.issues : [],
                suggestions: Array.isArray(qr.suggestions) ? qr.suggestions : [],
                keywordDensity: 1.5,
                headingStructure: 'good',
                contentOrganization: 'good',
                duplicateContentWarning: false,
                isSimulated: false,
                createdAt: qr.createdAt,
              };
              setCurrentReport(mappedReport);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('[BlogEditor] Could not fetch blog from database, falling back to local store:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      // Fallback to store
      if (fallbackBlog && isMounted) {
        setBlogData(fallbackBlog);
        setFormData({
          title: fallbackBlog.title || '',
          subtitle: fallbackBlog.subtitle || '',
          slug: fallbackBlog.slug || '',
          content: fallbackBlog.content || '',
          metaTitle: fallbackBlog.metaTitle || '',
          metaDescription: fallbackBlog.metaDescription || '',
          focusKeyword: fallbackBlog.focusKeyword || '',
          secondaryKeywords: fallbackBlog.secondaryKeywords || [],
          category: fallbackBlog.category || '',
          tags: fallbackBlog.tags || [],
          faqs: fallbackBlog.faqs || [],
        });
        const existingReport = qualityReports.find((q) => q.blogId === blogId);
        if (existingReport) setCurrentReport(existingReport);
      }
    }

    loadBlog();
    return () => {
      isMounted = false;
    };
  }, [blogId, fallbackBlog]);

  if (isLoading) {
    return (
      <div className="card max-w-lg mx-auto mt-16 p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-[var(--color-text-muted)]">Loading article from PostgreSQL...</p>
      </div>
    );
  }

  if (!blogData) {
    return (
      <div className="empty-state card max-w-lg mx-auto mt-12">
        <div className="empty-state-icon"><FileText size={32} /></div>
        <h3 className="empty-state-title">Article Not Found</h3>
        <p className="empty-state-desc">The requested article could not be located in your content database.</p>
        <Link href="/content" className="btn btn-primary mt-4">
          <ArrowLeft size={16} /> Return to Library
        </Link>
      </div>
    );
  }

  const wordCountVal = countWords(formData.content || '');
  const readingTimeVal = calculateReadingTime(formData.content || '');

  // Save changes to PostgreSQL
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch(`/api/blogs/${blogData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          wordCount: wordCountVal,
          estimatedReadingTime: readingTimeVal,
        }),
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.error || 'Failed to save changes to database.');
      }

      // Also sync store
      updateBlog(blogData.id, {
        ...formData,
        wordCount: wordCountVal,
        readingTime: readingTimeVal,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Error saving article.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit article to Approval Center
  const handleSendToApproval = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/blogs/${blogData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'PENDING_APPROVAL',
        }),
      });

      updateBlogStatus(blogData.id, 'pending_approval');
      addApproval(blogData.id, formData.title || blogData.title);
      router.push('/approvals');
    } catch (err: any) {
      setSaveError(`Failed to submit for approval: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const runQualityAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: blogData.id,
          content: formData.content,
          title: formData.title,
          focusKeyword: formData.focusKeyword,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
        }),
      });

      const res = await response.json();
      if (res.success && res.data) {
        const reportData: QualityReport = res.data;
        setCurrentReport(reportData);
        addQualityReport(reportData);
      }
    } catch (err) {
      console.warn('Quality API check error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/content" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`badge ${getStatusColor(blogData.status?.toLowerCase() || 'draft')}`}>
                {getStatusLabel(blogData.status?.toLowerCase() || 'draft')}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                <Globe size={12} /> {blogData.website?.name || blogData.websiteName || 'Website'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text)] truncate max-w-md sm:max-w-xl">
              {formData.title || 'Untitled Article'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowRevisionModal(true)}
            className="btn btn-secondary text-indigo-600 font-semibold"
          >
            <Wand2 size={15} /> AI Revision Studio
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-secondary"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved to PostgreSQL!' : 'Save Changes'}
          </button>

          {blogData.status !== 'APPROVED' && blogData.status !== 'PUBLISHED' && (
            <button
              onClick={handleSendToApproval}
              disabled={isSaving}
              className="btn btn-primary"
            >
              <Send size={16} />
              Submit for Approval
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span>Article changes saved securely to PostgreSQL.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main editor & sidebar grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="tabs">
            <button
              className={cn('tab', activeTab === 'editor' && 'active')}
              onClick={() => setActiveTab('editor')}
            >
              <FileText size={14} /> Content Editor
            </button>
            <button
              className={cn('tab', activeTab === 'seo' && 'active')}
              onClick={() => setActiveTab('seo')}
            >
              <Search size={14} /> SEO & Metadata
            </button>
            <button
              className={cn('tab', activeTab === 'faqs' && 'active')}
              onClick={() => setActiveTab('faqs')}
            >
              <HelpCircle size={14} /> Schema FAQs ({formData.faqs?.length || 0})
            </button>
            <button
              className={cn('tab', activeTab === 'preview' && 'active')}
              onClick={() => setActiveTab('preview')}
            >
              <Eye size={14} /> Live Preview
            </button>
          </div>

          {/* TAB: Content Editor */}
          {activeTab === 'editor' && (
            <div className="card space-y-4">
              <div className="form-group">
                <label className="form-label">Article Title *</label>
                <input
                  className="form-input font-bold text-base"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter article title..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subtitle / Deck</label>
                <input
                  className="form-input text-xs"
                  value={formData.subtitle || ''}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Supporting subtitle or summary statement..."
                />
              </div>

              <div className="form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label mb-0">Markdown Content *</label>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {wordCountVal} words · ~{readingTimeVal} min read
                  </span>
                </div>
                <textarea
                  className="form-textarea font-mono text-sm leading-relaxed"
                  rows={20}
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Article body in Markdown..."
                />
              </div>
            </div>
          )}

          {/* TAB: SEO & Metadata */}
          {activeTab === 'seo' && (
            <div className="card space-y-4">
              <div className="form-group">
                <label className="form-label">SEO Meta Title</label>
                <input
                  className="form-input text-xs"
                  value={formData.metaTitle || ''}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Search engine title..."
                />
                <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                  {(formData.metaTitle || '').length} / 60 characters
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Meta Description</label>
                <textarea
                  className="form-textarea text-xs"
                  rows={3}
                  value={formData.metaDescription || ''}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Summary for search engine snippets..."
                />
                <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                  {(formData.metaDescription || '').length} / 160 characters
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Focus Keyword</label>
                  <input
                    className="form-input text-xs"
                    value={formData.focusKeyword || ''}
                    onChange={(e) => setFormData({ ...formData, focusKeyword: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">URL Slug</label>
                  <input
                    className="form-input text-xs"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAQs */}
          {activeTab === 'faqs' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Schema-Ready FAQs</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Structured Q&A pairs embedded into search engine rich results.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      faqs: [...(formData.faqs || []), { question: '', answer: '' }],
                    })
                  }
                  className="btn btn-secondary text-xs"
                >
                  + Add FAQ
                </button>
              </div>

              {(!formData.faqs || formData.faqs.length === 0) ? (
                <p className="text-xs text-[var(--color-text-muted)] py-4 text-center">
                  No FAQs generated yet. Click + Add FAQ to create structured questions.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.faqs.map((faq, index) => (
                    <div key={index} className="p-3.5 rounded-lg border border-[var(--color-border)] space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-[var(--color-text)]">Question #{index + 1}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (formData.faqs || []).filter((_, i) => i !== index);
                            setFormData({ ...formData, faqs: updated });
                          }}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        className="form-input text-xs"
                        placeholder="FAQ Question"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...(formData.faqs || [])];
                          updated[index].question = e.target.value;
                          setFormData({ ...formData, faqs: updated });
                        }}
                      />
                      <textarea
                        className="form-textarea text-xs"
                        rows={2}
                        placeholder="FAQ Answer"
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...(formData.faqs || [])];
                          updated[index].answer = e.target.value;
                          setFormData({ ...formData, faqs: updated });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Preview */}
          {activeTab === 'preview' && (
            <div className="card space-y-6">
              <div className="border-b border-[var(--color-border)] pb-4">
                <span className="tag text-xs mb-2 inline-block">{formData.category || 'Article'}</span>
                <h1 className="text-2xl font-bold text-[var(--color-text)]">{formData.title}</h1>
                <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-2">
                  <span>{wordCountVal} words</span>
                  <span>•</span>
                  <span>{readingTimeVal} min read</span>
                  <span>•</span>
                  <span>Status: {getStatusLabel(blogData.status?.toLowerCase() || 'draft')}</span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                {formData.content}
              </div>

              {formData.faqs && formData.faqs.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-6 mt-6">
                  <h3 className="text-lg font-bold mb-4">Frequently Asked Questions</h3>
                  <div className="space-y-3">
                    {formData.faqs.map((faq, i) => (
                      <div key={i} className="p-3 rounded-lg bg-[var(--color-bg-subtle)]">
                        <h4 className="font-semibold text-sm">{faq.question}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quality & Research Sidebar (1 col) */}
        <div className="space-y-4">
          {/* Quality Audit Card */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Award size={16} className="text-indigo-600" />
                Gemini Quality & SEO Auditor
              </h3>
              <button
                onClick={runQualityAnalysis}
                disabled={isAnalyzing}
                className="btn btn-ghost btn-icon text-indigo-600"
                title="Recalculate Quality Scores with Gemini"
              >
                <RefreshCw size={14} className={cn(isAnalyzing && 'animate-spin')} />
              </button>
            </div>

            {currentReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-center">
                    <span className="text-xs font-medium text-indigo-700">SEO Health</span>
                    <p className="text-2xl font-black text-indigo-600 mt-0.5">{currentReport.seoScore}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                    <span className="text-xs font-medium text-emerald-700">Readability</span>
                    <p className="text-2xl font-black text-emerald-600 mt-0.5">{currentReport.readabilityScore}%</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)]">Grammar & Syntax</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle size={12} /> {currentReport.grammarScore}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)]">Overall Quality Index</span>
                    <span className="font-bold text-indigo-600">
                      {currentReport.overallScore}%
                    </span>
                  </div>
                </div>

                {/* Suggestions */}
                {currentReport.suggestions && currentReport.suggestions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[var(--color-text-muted)] mb-2">
                      Improvement Recommendations
                    </h4>
                    <ul className="space-y-1.5">
                      {currentReport.suggestions.slice(0, 4).map((s, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                          <Sparkles size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Issues */}
                {currentReport.issues && currentReport.issues.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-[var(--color-text-muted)] mb-2">
                      Detected Issues ({currentReport.issues.length})
                    </h4>
                    <div className="space-y-1.5">
                      {currentReport.issues.slice(0, 3).map((issue, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs"
                        >
                          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0 text-amber-600" />
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <BarChart2 size={24} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-[var(--color-text-muted)]">
                  Click the button below to audit quality, SEO, and readability with Gemini AI.
                </p>
                <button
                  onClick={runQualityAnalysis}
                  disabled={isAnalyzing}
                  className="btn btn-secondary text-xs mt-3 w-full"
                >
                  <Sparkles size={14} /> Run Gemini Quality Audit
                </button>
              </div>
            )}
          </div>

          {/* Research Source Links Card */}
          {researchReport && (
            <div className="card space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" />
                Research Sources & Insights
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Verified web intelligence extracted by Tavily during topic synthesis.
              </p>

              {researchReport.sources && Array.isArray(researchReport.sources) && researchReport.sources.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {researchReport.sources.map((src: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)] text-xs space-y-1"
                    >
                      <a
                        href={src.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-indigo-600 hover:underline flex items-center gap-1.5"
                      >
                        <span className="truncate">{src.title || 'Web Citation'}</span>
                        <ExternalLink size={12} className="flex-shrink-0" />
                      </a>
                      {src.summary && (
                        <p className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2">
                          {src.summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Content Revision Studio Modal */}
      {showRevisionModal && (
        <ContentRevisionModal
          currentContent={formData.content || ''}
          currentTitle={formData.title || ''}
          currentIntro={formData.introduction || ''}
          onApplyChange={(revisedText, field) => {
            if (field === 'title') {
              setFormData((prev) => ({ ...prev, title: revisedText }));
            } else if (field === 'intro') {
              setFormData((prev) => ({
                ...prev,
                introduction: revisedText,
                content: prev.content ? prev.content.replace(prev.introduction || '', revisedText) : revisedText,
              }));
            } else {
              setFormData((prev) => ({ ...prev, content: revisedText }));
            }
            setShowRevisionModal(false);
          }}
          onClose={() => setShowRevisionModal(false)}
        />
      )}
    </div>
  );
}

// --- AI Content Revision Studio Modal Component ---
function ContentRevisionModal({
  currentContent,
  currentTitle,
  currentIntro,
  onApplyChange,
  onClose,
}: {
  currentContent: string;
  currentTitle: string;
  currentIntro: string;
  onApplyChange: (newText: string, field: 'content' | 'title' | 'intro') => void;
  onClose: () => void;
}) {
  const [targetField, setTargetField] = useState<'content' | 'title' | 'intro'>('content');
  const [action, setAction] = useState<RevisionAction>('rewrite_paragraph');
  const [selectedText, setSelectedText] = useState(currentContent.slice(0, 1000));
  const [targetTone, setTargetTone] = useState<WritingTone>('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [revisionResult, setRevisionResult] = useState<{
    revisedText: string;
    explanation: string;
    confidenceScore: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFieldChange = (field: 'content' | 'title' | 'intro') => {
    setTargetField(field);
    setRevisionResult(null);
    if (field === 'title') {
      setSelectedText(currentTitle);
      setAction('optimize_title');
    } else if (field === 'intro') {
      setSelectedText(currentIntro || currentContent.slice(0, 400));
      setAction('improve_intro');
    } else {
      setSelectedText(currentContent.slice(0, 1200));
      setAction('rewrite_paragraph');
    }
  };

  const handleGenerateRevision = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/ai/revise-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          selectedText,
          targetTone,
          customInstructions,
        }),
      });

      const res = await response.json();
      if (!res.success) {
        throw new Error(res.error || 'Revision generation failed.');
      }

      setRevisionResult(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error revising content with Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Wand2 size={16} />
            </div>
            <div>
              <h3 className="modal-title text-base font-bold">AI Content Revision Studio</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                Targeted AI refinement with before-and-after comparison.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Target Section Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'content' as const, label: 'Article Passage' },
              { id: 'intro' as const, label: 'Introduction' },
              { id: 'title' as const, label: 'Article Title' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={cn('btn btn-sm', targetField === sec.id ? 'btn-primary' : 'btn-secondary')}
                onClick={() => handleFieldChange(sec.id)}
              >
                {sec.label}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">Selected Text to Revise</label>
            <textarea
              className="form-textarea font-mono text-xs"
              rows={4}
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Revision Action</label>
              <select
                className="form-select text-xs"
                value={action}
                onChange={(e) => setAction(e.target.value as RevisionAction)}
              >
                <option value="rewrite_paragraph">Rewrite with enhanced clarity</option>
                <option value="improve_intro">Strengthen hook & engagement</option>
                <option value="improve_conclusion">Sharpen conclusion & takeaways</option>
                <option value="expand_section">Expand with practical depth</option>
                <option value="shorten_section">Condense & eliminate filler</option>
                <option value="improve_readability">Simplify sentence structure</option>
                <option value="optimize_title">Optimize for CTR & SEO</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Desired Tone</label>
              <select
                className="form-select text-xs"
                value={targetTone}
                onChange={(e) => setTargetTone(e.target.value as WritingTone)}
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="authoritative">Authoritative</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Custom Revision Instructions (Optional)</label>
            <input
              className="form-input text-xs"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., Focus on concrete performance metrics, avoid passive voice..."
            />
          </div>

          <button
            type="button"
            onClick={handleGenerateRevision}
            disabled={isGenerating || !selectedText.trim()}
            className="btn btn-primary w-full"
          >
            <Wand2 size={16} />
            {isGenerating ? 'Generating Revision with Gemini...' : 'Generate Revised Proposal'}
          </button>

          {/* Revision Diff / Proposal */}
          {revisionResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  AI Revision Proposal ({revisionResult.confidenceScore}% confidence)
                </span>
                <span className="badge bg-emerald-100 text-emerald-800 text-xs">Ready to Apply</span>
              </div>

              <p className="text-xs text-[var(--color-text-muted)] italic">
                {revisionResult.explanation}
              </p>

              <div className="p-3 rounded-lg bg-white border border-[var(--color-border)] font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {revisionResult.revisedText}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => setRevisionResult(null)}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="btn btn-primary text-xs"
                  onClick={() => onApplyChange(revisionResult.revisedText, targetField)}
                >
                  <Check size={14} /> Apply to Article
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
