'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PenTool, Sparkles, Globe, Tag, Users, BookOpen,
  FileText, Type, X, AlertCircle, ChevronRight, CheckCircle2,
  Send, RefreshCw, Layers, Search, ShieldCheck, ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  BlogGenerationFormData, WritingTone, ArticleLength, Blog, StructuredBlogOutput,
} from '@/types';
import {
  NICHE_OPTIONS, TONE_OPTIONS, LENGTH_OPTIONS, cn, slugify,
  wordCount, readingTime,
} from '@/lib/utils';

export default function GeneratorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading Blog Generator...</div>}>
      <GeneratorContent />
    </Suspense>
  );
}

function GeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const research = useAppStore((s) => s.research);
  const addBlog = useAppStore((s) => s.addBlog);
  const addApproval = useAppStore((s) => s.addApproval);

  // ---- Websites fetched from backend ----
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const fetchWebsites = async () => {
    setLoadingWebsites(true);
    try {
      const res = await fetch('/api/websites', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setWebsites(data.data || []);
      } else {
        console.warn('Failed to load websites:', data.error);
        setWebsites([]);
      }
    } catch (e) {
      console.error('Error fetching websites', e);
      setWebsites([]);
    } finally {
      setLoadingWebsites(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const [step, setStep] = useState<'configure' | 'preview'>('configure');

  // Set default website after load if none selected
  useEffect(() => {
    if (!loadingWebsites && websites.length > 0 && !form.websiteId) {
      setForm((prev) => ({ ...prev, websiteId: websites[0].id }));
    }
  }, [loadingWebsites, websites]);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedBlog, setGeneratedBlog] = useState<Partial<Blog> | null>(null);

  const [form, setForm] = useState<BlogGenerationFormData>({
    websiteId: searchParams.get('websiteId') || websites[0]?.id || '',
    researchId: searchParams.get('researchId') || '',
    topic: searchParams.get('topic') || '',
    category: searchParams.get('category') || '',
    targetAudience: '',
    tone: 'professional',
    articleLength: 'medium',
    primaryKeywords: [],
    secondaryKeywords: [],
    instructions: '',
  });

  const [kwInput, setKwInput] = useState('');
  const [skwInput, setSkwInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync parameters if query changes
  useEffect(() => {
    const qTopic = searchParams.get('topic');
    const qWebsiteId = searchParams.get('websiteId');
    const qCategory = searchParams.get('category');
    const qResearchId = searchParams.get('researchId');

    if (qTopic || qWebsiteId || qCategory || qResearchId) {
      setForm((prev) => ({
        ...prev,
        topic: qTopic || prev.topic,
        websiteId: qWebsiteId || prev.websiteId,
        category: qCategory || prev.category,
        researchId: qResearchId || prev.researchId,
      }));
    }
  }, [searchParams]);

  const selectedWebsite = websites.find((w) => w.id === form.websiteId);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.websiteId) e.websiteId = 'Select a website';
    if (!form.topic.trim()) e.topic = 'Enter a topic';
    if (!form.category) e.category = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setErrorMessage(null);
    setLoadingStage('Analyzing research context & formulating article outline...');

    try {
      // Find associated research report if selected
      const selectedResearch = research.find((r) => r.id === form.researchId);

      // Advance stage indicator
      setTimeout(() => {
        setLoadingStage('Drafting in-depth article sections with Google Gemini...');
      }, 1500);

      setTimeout(() => {
        setLoadingStage('Synthesizing FAQs, SEO metadata, and validating output...');
      }, 4000);

      const response = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: form.websiteId,
          researchId: form.researchId || undefined,
          topic: form.topic.trim(),
          category: form.category,
          targetAudience: form.targetAudience || selectedWebsite?.audience || 'General Audience',
          tone: form.tone,
          articleLength: form.articleLength,
          primaryKeywords: form.primaryKeywords.length > 0 ? form.primaryKeywords : [form.topic],
          secondaryKeywords: form.secondaryKeywords,
          instructions: form.instructions,
          researchReport: selectedResearch
            ? {
                topic: selectedResearch.topic,
                overview: `Researched in ${selectedResearch.category}`,
                keyInsights: selectedResearch.discoveredTopics?.map((t) => t.title) || [],
                sources: selectedResearch.discoveredTopics?.flatMap((t) => t.sources) || [],
              }
            : undefined,
        }),
      });

      const res = await response.json();
      if (!res.success) {
        throw new Error(res.error || 'Failed to generate blog article.');
      }

      const output: StructuredBlogOutput = res.data;

      setGeneratedBlog({
        websiteId: form.websiteId,
        websiteName: selectedWebsite?.name || 'My Website',
        researchId: form.researchId || undefined,
        title: output.title,
        subtitle: output.subtitle,
        slug: output.slug || slugify(output.title),
        content: output.fullMarkdown,
        introduction: output.introduction,
        conclusion: output.conclusion,
        faqs: output.faqs || [],
        metaTitle: output.seo?.metaTitle || output.title,
        metaDescription: output.seo?.metaDescription || output.subtitle,
        focusKeyword: output.seo?.focusKeyword || form.primaryKeywords[0] || form.topic,
        secondaryKeywords: output.seo?.secondaryKeywords || form.secondaryKeywords,
        tags: [form.category, ...(form.primaryKeywords || [])].slice(0, 5),
        category: form.category,
        imageSuggestions: [],
        references: output.sources || [],
        wordCount: output.wordCount,
        readingTime: output.estimatedReadingTime,
      });

      setLoadingStage(null);
      setStep('preview');
    } catch (err: any) {
      setLoadingStage(null);
      setErrorMessage(err.message || 'Error communicating with Gemini AI.');
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedBlog) return;
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedBlog,
          status: 'DRAFT',
        }),
      });
      const data = await res.json();
      const savedBlogId = data.data?.id;
      if (savedBlogId) {
        router.push(`/content/${savedBlogId}`);
        return;
      }
    } catch (err) {
      console.warn('Fallback saving locally:', err);
    }
    const blog = addBlog(generatedBlog as Omit<Blog, 'id' | 'status' | 'createdAt' | 'updatedAt'>);
    router.push(`/content/${blog.id}`);
  };

  const handleSubmitForApproval = async () => {
    if (!generatedBlog) return;
    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedBlog,
          status: 'PENDING_APPROVAL',
        }),
      });
      const data = await res.json();
      const savedBlogId = data.data?.id;

      // Also trigger LangGraph background execution if desired
      try {
        await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: form.topic,
            websiteId: form.websiteId,
            websiteContext: {
              websiteName: selectedWebsite?.name,
              niche: selectedWebsite?.niche,
              targetAudience: form.targetAudience,
              writingTone: form.tone,
            },
          }),
        });
      } catch {
        // Continue
      }

      router.push('/approvals');
      return;
    } catch (err) {
      console.warn('DB save fallback:', err);
    }

    const blog = addBlog(generatedBlog as Omit<Blog, 'id' | 'status' | 'createdAt' | 'updatedAt'>);
    useAppStore.getState().updateBlogStatus(blog.id, 'pending_approval');
    addApproval(blog.id, blog.title);
    router.push('/approvals');
  };

  if (step === 'preview' && generatedBlog) {
    return (
      <GenerationPreview
        blog={generatedBlog}
        onSaveDraft={handleSaveDraft}
        onSubmitForApproval={handleSubmitForApproval}
        onBack={() => setStep('configure')}
        onUpdateBlog={setGeneratedBlog}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Intelligence Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex-wrap gap-3">
        <div className="flex items-center gap-2.5 text-xs text-indigo-900">
          <Sparkles size={16} className="text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Gemini AI Writer:</strong> Generates multi-section, authoritative articles with schema FAQs, SEO metadata, and citation attribution.
          </span>
        </div>
        <span className="badge bg-emerald-100 text-emerald-800 text-xs font-semibold">
          ● Multi-Stage Writer Active
        </span>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>Generation Notice:</strong> {errorMessage}
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <div className="card">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <PenTool size={20} className="text-indigo-500" />
            AI Blog Article Generator
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-6">
            Configure generation parameters, connect researched sources, and let Gemini draft publication-ready articles.
          </p>

          {loadingStage ? (
            <div className="py-14 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <h4 className="font-bold text-sm text-[var(--color-text)]">
                  {loadingStage}
                </h4>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Adhering to requested tone, keyword targets, and website audience depth.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <Globe size={14} /> Target Website *
                  </label>
                  <select
                    className={cn('form-select', errors.websiteId && 'error')}
                    value={form.websiteId}
                    onChange={(e) => setForm({ ...form, websiteId: e.target.value })}
                  >
                    <option value="">Select website...</option>
                    {websites.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  {errors.websiteId && <span className="form-error">{errors.websiteId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <BookOpen size={14} /> From Past Research (Optional)
                  </label>
                  <select
                    className="form-select"
                    value={form.researchId}
                    onChange={(e) => {
                      const rId = e.target.value;
                      const r = research.find((item) => item.id === rId);
                      setForm({
                        ...form,
                        researchId: rId,
                        topic: r ? r.topic : form.topic,
                        category: r ? r.category : form.category,
                        targetAudience: r ? r.targetAudience : form.targetAudience,
                      });
                    }}
                  >
                    <option value="">None (Custom Topic)</option>
                    {research.map((r) => (
                      <option key={r.id} value={r.id}>{r.topic} ({r.category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <Type size={14} /> Blog Topic *
                </label>
                <input
                  className={cn('form-input', errors.topic && 'error')}
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="e.g., AI-Powered Code Generation Tools in 2025"
                />
                {errors.topic && <span className="form-error">{errors.topic}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className={cn('form-select', errors.category && 'error')}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">Select category...</option>
                    {NICHE_OPTIONS.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  {errors.category && <span className="form-error">{errors.category}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Writing Tone</label>
                  <select
                    className="form-select"
                    value={form.tone}
                    onChange={(e) => setForm({ ...form, tone: e.target.value as WritingTone })}
                  >
                    {TONE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Article Length</label>
                  <select
                    className="form-select"
                    value={form.articleLength}
                    onChange={(e) => setForm({ ...form, articleLength: e.target.value as ArticleLength })}
                  >
                    {LENGTH_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <Users size={14} /> Target Audience (Optional)
                </label>
                <input
                  className="form-input"
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  placeholder={selectedWebsite?.audience || 'e.g., Software engineers and CTOs'}
                />
              </div>

              {/* Primary Keywords */}
              <div className="form-group">
                <label className="form-label">Primary Keywords</label>
                <div className="flex gap-2">
                  <input
                    className="form-input flex-1"
                    value={kwInput}
                    onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (kwInput.trim() && !form.primaryKeywords.includes(kwInput.trim())) {
                          setForm({ ...form, primaryKeywords: [...form.primaryKeywords, kwInput.trim()] });
                          setKwInput('');
                        }
                      }
                    }}
                    placeholder="Add primary keyword..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (kwInput.trim() && !form.primaryKeywords.includes(kwInput.trim())) {
                        setForm({ ...form, primaryKeywords: [...form.primaryKeywords, kwInput.trim()] });
                        setKwInput('');
                      }
                    }}
                    className="btn btn-secondary text-xs"
                  >
                    Add
                  </button>
                </div>
                {form.primaryKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.primaryKeywords.map((kw) => (
                      <span key={kw} className="tag text-xs">
                        {kw}
                        <button
                          type="button"
                          className="ml-1 text-slate-400 hover:text-red-600"
                          onClick={() => setForm({ ...form, primaryKeywords: form.primaryKeywords.filter((k) => k !== kw) })}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Special Instructions & Guidelines (Optional)</label>
                <textarea
                  className="form-textarea text-xs"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  placeholder="e.g., Include code examples in TypeScript, focus on practical deployment trade-offs..."
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full mt-2">
                <Sparkles size={16} /> Generate Article with Gemini AI
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Generation Preview Component ---
function GenerationPreview({
  blog,
  onSaveDraft,
  onSubmitForApproval,
  onBack,
  onUpdateBlog,
}: {
  blog: Partial<Blog>;
  onSaveDraft: () => void;
  onSubmitForApproval: () => void;
  onBack: () => void;
  onUpdateBlog: (b: Partial<Blog>) => void;
}) {
  const [activeTab, setActiveTab] = useState<'content' | 'seo' | 'faqs'>('content');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn btn-secondary btn-sm">
            ← Back to Generator
          </button>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)] truncate max-w-md">
              {blog.title}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              {blog.wordCount} words · {blog.readingTime} min read · Category: {blog.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn btn-secondary text-xs" onClick={onSaveDraft}>
            <FileText size={14} /> Save Draft
          </button>
          <button className="btn btn-primary text-xs" onClick={onSubmitForApproval}>
            <Send size={14} /> Submit to Approval Center
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="tabs">
            <button
              className={cn('tab', activeTab === 'content' && 'active')}
              onClick={() => setActiveTab('content')}
            >
              <FileText size={14} /> Markdown Content
            </button>
            <button
              className={cn('tab', activeTab === 'seo' && 'active')}
              onClick={() => setActiveTab('seo')}
            >
              <Search size={14} /> SEO Metadata
            </button>
            <button
              className={cn('tab', activeTab === 'faqs' && 'active')}
              onClick={() => setActiveTab('faqs')}
            >
              <Tag size={14} /> FAQs ({blog.faqs?.length || 0})
            </button>
          </div>

          <div className="card">
            {activeTab === 'content' && (
              <textarea
                className="form-textarea w-full min-h-[500px] font-mono text-sm leading-relaxed"
                value={blog.content || ''}
                onChange={(e) => onUpdateBlog({ ...blog, content: e.target.value })}
              />
            )}

            {activeTab === 'seo' && (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">SEO Meta Title</label>
                  <input
                    className="form-input text-xs"
                    value={blog.metaTitle || ''}
                    onChange={(e) => onUpdateBlog({ ...blog, metaTitle: e.target.value })}
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                    {(blog.metaTitle || '').length} / 60 characters
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Meta Description</label>
                  <textarea
                    className="form-textarea text-xs"
                    rows={3}
                    value={blog.metaDescription || ''}
                    onChange={(e) => onUpdateBlog({ ...blog, metaDescription: e.target.value })}
                  />
                  <span className="text-[11px] text-[var(--color-text-muted)] mt-1 block">
                    {(blog.metaDescription || '').length} / 160 characters
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Focus Keyword</label>
                    <input
                      className="form-input text-xs"
                      value={blog.focusKeyword || ''}
                      onChange={(e) => onUpdateBlog({ ...blog, focusKeyword: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL Slug</label>
                    <input
                      className="form-input text-xs"
                      value={blog.slug || ''}
                      onChange={(e) => onUpdateBlog({ ...blog, slug: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-3">
                {(blog.faqs || []).map((faq, i) => (
                  <div key={i} className="p-3.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                    <p className="font-semibold text-xs text-[var(--color-text)]">{faq.question}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info (1 col) */}
        <div className="space-y-4">
          <div className="card space-y-3 text-xs">
            <h4 className="font-bold text-sm text-[var(--color-text)]">Article Telemetry</h4>
            <div className="flex justify-between py-1 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)]">Target Website</span>
              <span className="font-medium text-indigo-600">{blog.websiteName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)]">Word Count</span>
              <span className="font-bold text-[var(--color-text)]">{blog.wordCount} words</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)]">Est. Reading Time</span>
              <span className="font-medium text-[var(--color-text)]">{blog.readingTime} min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)]">Lifecycle Stage</span>
              <span className="badge bg-amber-50 text-amber-700">Pre-Approval Draft</span>
            </div>
          </div>

          <div className="card space-y-2.5">
            <h4 className="font-semibold text-xs text-[var(--color-text)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-indigo-600" />
              Human-in-the-Loop Mandate
            </h4>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Submitting places this article in the <strong>Approval Center</strong>. Direct CMS publishing is blocked until an editor approves the content.
            </p>
            <button onClick={onSubmitForApproval} className="btn btn-primary text-xs w-full mt-2">
              <Send size={13} /> Submit for Human Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
