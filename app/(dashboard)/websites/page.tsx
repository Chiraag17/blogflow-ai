'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe, Plus, ExternalLink, MoreVertical, Edit2,
  Trash2, X, AlertCircle, FileText, Sparkles,
  RefreshCw, CheckCircle2, ChevronRight, Lightbulb, Compass,
  Loader2,
} from 'lucide-react';
import { WritingTone, WebsiteAnalysis } from '@/types';
import {
  getConnectionColor, NICHE_OPTIONS, TONE_OPTIONS, isValidUrl, cn,
} from '@/lib/utils';

interface DbWebsite {
  id: string;
  name: string;
  url: string;
  niche: string;
  targetAudience: string;
  writingTone: string;
  preferredKeywords: string[];
  excludedTopics: string[];
  connectionStatus: string;
  createdAt: string;
  updatedAt: string;
  _count?: { blogs: number };
}

interface WebsiteFormData {
  name: string;
  url: string;
  niche: string;
  targetAudience: string;
  writingTone: WritingTone;
  preferredKeywords: string[];
  excludedTopics: string[];
}

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<DbWebsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<DbWebsite | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [analyzingWebsite, setAnalyzingWebsite] = useState<DbWebsite | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchWebsites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/websites');
      if (res.status === 401) {
        setError('Session expired. Please sign in again.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setWebsites(data.data || []);
      } else {
        setError(data.error || 'Failed to load websites.');
      }
    } catch {
      setError('Network error. Could not load websites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWebsites();
  }, [fetchWebsites]);

  const handleCreate = async (formData: WebsiteFormData) => {
    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          niche: formData.niche,
          targetAudience: formData.targetAudience,
          writingTone: formData.writingTone,
          preferredKeywords: formData.preferredKeywords,
          excludedTopics: formData.excludedTopics,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create website');
      showToast('Website connected successfully!');
      await fetchWebsites();
      setShowForm(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to connect website.', true);
    }
  };

  const handleUpdate = async (id: string, formData: WebsiteFormData) => {
    try {
      const res = await fetch(`/api/websites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          niche: formData.niche,
          targetAudience: formData.targetAudience,
          writingTone: formData.writingTone,
          preferredKeywords: formData.preferredKeywords,
          excludedTopics: formData.excludedTopics,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update website');
      showToast('Website updated successfully!');
      await fetchWebsites();
      setShowForm(false);
      setEditingWebsite(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update website.', true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this website? This will also delete associated blogs and records.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/websites/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete website');
      showToast('Website removed.');
      await fetchWebsites();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete website.', true);
    } finally {
      setDeletingId(null);
      setMenuOpen(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 p-3.5 rounded-lg text-sm animate-fade-in ${
          toast.isError
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          {toast.isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Your Websites</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Connect and manage target websites with AI context extraction and topic discovery.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingWebsite(null); setShowForm(true); }}
        >
          <Plus size={16} />
          Add Website
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button className="ml-auto btn btn-sm btn-secondary" onClick={fetchWebsites}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid-cards">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card space-y-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && websites.length === 0 && (
        <div className="empty-state card">
          <div className="empty-state-icon"><Globe size={28} /></div>
          <p className="empty-state-title">No websites connected</p>
          <p className="empty-state-desc">
            Connect your first website to start generating AI-powered content.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add Website
          </button>
        </div>
      )}

      {/* Website Cards */}
      {!loading && websites.length > 0 && (
        <div className="grid-cards">
          {websites.map((website) => (
            <div key={website.id} className="card group relative flex flex-col justify-between">
              {/* Context menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMenuOpen(menuOpen === website.id ? null : website.id)}
                  className="btn btn-ghost btn-icon opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={deletingId === website.id}
                >
                  {deletingId === website.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <MoreVertical size={16} />
                  )}
                </button>
                {menuOpen === website.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-20 py-1">
                      <button
                        className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-[var(--color-bg-muted)] transition-colors text-indigo-600 font-medium"
                        onClick={() => { setAnalyzingWebsite(website); setMenuOpen(null); }}
                      >
                        <Sparkles size={14} /> AI Context Analysis
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-[var(--color-bg-muted)] transition-colors"
                        onClick={() => { setEditingWebsite(website); setShowForm(true); setMenuOpen(null); }}
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-red-50 text-red-600 transition-colors"
                        onClick={() => handleDelete(website.id)}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <Globe size={20} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <h3 className="font-semibold text-[var(--color-text)] truncate">{website.name}</h3>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-0.5 truncate"
                    >
                      {website.url} <ExternalLink size={12} className="flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Status</span>
                    <span className={`badge ${getConnectionColor(website.connectionStatus as any)}`}>
                      {website.connectionStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Niche</span>
                    <span className="font-medium text-[var(--color-text)]">{website.niche}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Tone</span>
                    <span className="font-medium capitalize text-[var(--color-text)]">{website.writingTone}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)] flex items-center gap-1">
                      <FileText size={12} /> Blogs
                    </span>
                    <span className="font-semibold">{website._count?.blogs ?? 0}</span>
                  </div>
                </div>

                {website.preferredKeywords.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {website.preferredKeywords.slice(0, 3).map((kw) => (
                      <span key={kw} className="tag text-[11px]">{kw}</span>
                    ))}
                    {website.preferredKeywords.length > 3 && (
                      <span className="tag text-[11px]">+{website.preferredKeywords.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                <button
                  onClick={() => setAnalyzingWebsite(website)}
                  className="btn btn-secondary text-xs flex-1 justify-center"
                >
                  <Sparkles size={13} className="text-indigo-600" />
                  Analyze
                </button>
                <Link
                  href={`/research?websiteId=${website.id}`}
                  className="btn btn-secondary text-xs flex-1 justify-center"
                >
                  <ChevronRight size={13} />
                  Research
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <WebsiteFormModal
          website={editingWebsite}
          onSubmit={(data) => {
            if (editingWebsite) {
              handleUpdate(editingWebsite.id, data);
            } else {
              handleCreate(data);
            }
          }}
          onClose={() => { setShowForm(false); setEditingWebsite(null); }}
        />
      )}

      {/* AI Analysis Modal */}
      {analyzingWebsite && (
        <WebsiteAnalysisModal
          website={analyzingWebsite}
          onClose={() => setAnalyzingWebsite(null)}
        />
      )}
    </div>
  );
}

// --- Website Form Modal ---
function WebsiteFormModal({
  website,
  onSubmit,
  onClose,
}: {
  website: DbWebsite | null;
  onSubmit: (data: WebsiteFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<WebsiteFormData>({
    name: website?.name || '',
    url: website?.url || '',
    niche: website?.niche || '',
    targetAudience: website?.targetAudience || '',
    writingTone: (website?.writingTone as WritingTone) || 'professional',
    preferredKeywords: website?.preferredKeywords || [],
    excludedTopics: website?.excludedTopics || [],
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [excludedInput, setExcludedInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Website name is required';
    if (!form.url.trim()) {
      e.url = 'Website URL is required';
    } else if (!isValidUrl(form.url)) {
      e.url = 'Enter a valid URL (e.g., https://example.com)';
    }
    if (!form.niche) e.niche = 'Select a niche';
    if (!form.targetAudience.trim()) e.targetAudience = 'Target audience is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !form.preferredKeywords.includes(kw)) {
      setForm({ ...form, preferredKeywords: [...form.preferredKeywords, kw] });
      setKeywordInput('');
    }
  };

  const addExcluded = () => {
    const ex = excludedInput.trim();
    if (ex && !form.excludedTopics.includes(ex)) {
      setForm({ ...form, excludedTopics: [...form.excludedTopics, ex] });
      setExcludedInput('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{website ? 'Edit Website' : 'Add New Website'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-0">
            <div className="form-group">
              <label className="form-label">Website Name *</label>
              <input
                className={cn('form-input', errors.name && 'error')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My Awesome Blog"
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Website URL *</label>
              <input
                className={cn('form-input', errors.url && 'error')}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://example.com"
              />
              {errors.url && <span className="form-error">{errors.url}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Niche *</label>
                <select
                  className={cn('form-select', errors.niche && 'error')}
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                >
                  <option value="">Select niche...</option>
                  {NICHE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {errors.niche && <span className="form-error">{errors.niche}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Writing Tone</label>
                <select
                  className="form-select"
                  value={form.writingTone}
                  onChange={(e) => setForm({ ...form, writingTone: e.target.value as WritingTone })}
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience *</label>
              <input
                className={cn('form-input', errors.targetAudience && 'error')}
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="Tech-savvy professionals aged 25-45"
              />
              {errors.targetAudience && <span className="form-error">{errors.targetAudience}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Keywords / Topics of Focus</label>
              <div className="flex gap-2">
                <input
                  className="form-input flex-1"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Add a keyword and press Enter"
                />
                <button type="button" onClick={addKeyword} className="btn btn-secondary">Add</button>
              </div>
              {form.preferredKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.preferredKeywords.map((kw) => (
                    <span key={kw} className="tag">
                      {kw}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, preferredKeywords: form.preferredKeywords.filter((k) => k !== kw) })}
                        className="hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Excluded Topics</label>
              <div className="flex gap-2">
                <input
                  className="form-input flex-1"
                  value={excludedInput}
                  onChange={(e) => setExcludedInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExcluded(); } }}
                  placeholder="Topics to avoid"
                />
                <button type="button" onClick={addExcluded} className="btn btn-secondary">Add</button>
              </div>
              {form.excludedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.excludedTopics.map((ex) => (
                    <span key={ex} className="tag">
                      {ex}
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, excludedTopics: form.excludedTopics.filter((t) => t !== ex) })}
                        className="hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">
              {website ? 'Save Changes' : 'Connect Website'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- AI Website Analysis Modal ---
function WebsiteAnalysisModal({
  website,
  onClose,
}: {
  website: DbWebsite;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle');
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualNotes, setManualNotes] = useState('');

  const runAnalysis = async (customContext?: string) => {
    setStage('analyzing');
    setErrorMsg(null);
    try {
      const response = await fetch('/api/ai/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: website.id,
          name: website.name,
          url: website.url,
          niche: website.niche,
          audience: website.targetAudience,
          tone: website.writingTone,
          keywords: website.preferredKeywords,
          excludedTopics: website.excludedTopics,
          manualContext: customContext || manualNotes,
        }),
      });
      const res = await response.json();
      if (!res.success) throw new Error(res.error || 'Failed to analyze website');
      setAnalysis(res.data);
      setStage('done');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error conducting analysis.');
      setStage('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="modal-title text-base font-bold">AI Website Context Analysis</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{website.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={18} /></button>
        </div>

        <div className="modal-body space-y-4">
          {stage === 'idle' && (
            <div className="text-center py-8 space-y-3">
              <Compass size={36} className="mx-auto text-indigo-500" />
              <div>
                <h4 className="font-bold text-base">Analyze Website Architecture & Brand Voice</h4>
                <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto mt-1">
                  Gemini will inspect your website, detect audience nuances, assess writing style,
                  and generate content opportunities.
                </p>
              </div>
              <button onClick={() => runAnalysis()} className="btn btn-primary btn-lg mt-2">
                <Sparkles size={16} /> Start AI Analysis
              </button>
            </div>
          )}

          {stage === 'analyzing' && (
            <div className="text-center py-10 space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-indigo-600" />
              <h4 className="font-semibold text-sm">Analyzing brand voice & niche with Gemini…</h4>
              <p className="text-xs text-[var(--color-text-muted)]">This may take a few seconds.</p>
            </div>
          )}

          {stage === 'error' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div><strong>Analysis failed:</strong> {errorMsg}</div>
              </div>
              <div className="card bg-slate-50 border-slate-200 p-4 space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Provide Manual Context
                </label>
                <textarea
                  className="form-textarea text-xs"
                  rows={4}
                  placeholder="Paste a brief summary of your website's content, target audience, and key topics..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                />
                <button
                  onClick={() => runAnalysis(manualNotes)}
                  disabled={!manualNotes.trim()}
                  className="btn btn-primary text-xs w-full"
                >
                  <RefreshCw size={13} /> Retry with Manual Notes
                </button>
              </div>
            </div>
          )}

          {stage === 'done' && analysis && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Website context verified and synthesized with Google Gemini.</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block mb-1">Detected Niche</span>
                  <span className="font-bold">{analysis.detectedNiche}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block mb-1">Target Persona</span>
                  <span className="font-bold">{analysis.targetAudience}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                <span className="text-xs font-semibold block mb-1">Writing Style</span>
                <p className="text-xs text-[var(--color-text-secondary)]">{analysis.writingStyle}</p>
              </div>
              {analysis.contentOpportunities?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider block">
                    AI-Identified Content Opportunities
                  </span>
                  <div className="space-y-1.5">
                    {analysis.contentOpportunities.map((opp, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border)] bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb size={14} className="text-amber-500 flex-shrink-0" />
                          <span className="text-xs font-medium">{opp}</span>
                        </div>
                        <Link href="/research" onClick={onClose} className="btn btn-ghost text-xs text-indigo-600">
                          Research <ChevronRight size={12} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
}
