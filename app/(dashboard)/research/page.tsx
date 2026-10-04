'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, Sparkles, ExternalLink, CheckSquare, Square,
  ChevronDown, ChevronUp, Lightbulb, AlertCircle,
  BookOpen, Tag, Users, Globe, ArrowRight, RefreshCw,
  CheckCircle2, Compass, ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { NICHE_OPTIONS, formatDate, cn } from '@/lib/utils';
import { ResearchFormData, Research, ResearchTopic, DetailedResearchReport } from '@/types';

export default function ResearchPage() {
  const websites = useAppStore((s) => s.websites);
  const research = useAppStore((s) => s.research);
  const addResearch = useAppStore((s) => s.addResearch);

  const [activeTab, setActiveTab] = useState<'new' | 'results'>('results');
  const [selectedResearch, setSelectedResearch] = useState<Research | null>(
    research.length > 0 ? research[0] : null
  );

  return (
    <div className="space-y-6">
      {/* Intelligence Status Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex-wrap gap-3">
        <div className="flex items-center gap-2.5 text-xs text-indigo-900">
          <Sparkles size={16} className="text-indigo-600 flex-shrink-0" />
          <span>
            <strong>AI Web Research Pipeline:</strong> Live search retrieval powered by <strong>Tavily</strong> and multi-source synthesis powered by <strong>Google Gemini</strong>.
          </span>
        </div>
        <span className="badge bg-emerald-100 text-emerald-800 text-xs font-semibold">
          ● Intelligence Active
        </span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={cn('tab', activeTab === 'results' && 'active')}
          onClick={() => setActiveTab('results')}
        >
          Research Reports ({research.length})
        </button>
        <button
          className={cn('tab', activeTab === 'new' && 'active')}
          onClick={() => setActiveTab('new')}
        >
          <Search size={14} /> New AI Research & Discovery
        </button>
      </div>

      {activeTab === 'new' && (
        <ResearchForm
          websites={websites}
          onSuccess={(newRecord) => {
            setSelectedResearch(newRecord);
            setActiveTab('results');
          }}
        />
      )}

      {activeTab === 'results' && (
        <div className="grid-2">
          {/* Research List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
              Completed Research ({research.length})
            </h3>
            {research.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon"><Search size={28} /></div>
                <p className="empty-state-title">No research conducted yet</p>
                <p className="empty-state-desc">Initiate an AI web research job to discover vetted topics and source citations.</p>
                <button onClick={() => setActiveTab('new')} className="btn btn-primary mt-3 text-xs">
                  <Search size={14} /> Start New Research
                </button>
              </div>
            ) : (
              research.map((r) => (
                <button
                  key={r.id}
                  className={cn(
                    'card text-left w-full transition-all cursor-pointer hover:border-indigo-300',
                    selectedResearch?.id === r.id && 'ring-2 ring-indigo-500 ring-offset-1'
                  )}
                  onClick={() => setSelectedResearch(r)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--color-text)]">{r.topic}</h4>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {r.category} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <span className={cn(
                      'badge text-xs',
                      r.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    )}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-1">
                    <BookOpen size={12} /> {r.discoveredTopics?.length || 0} topics & citations discovered
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Research Detail */}
          <div>
            {selectedResearch ? (
              <ResearchDetail research={selectedResearch} />
            ) : (
              <div className="card empty-state">
                <div className="empty-state-icon"><BookOpen size={28} /></div>
                <p className="empty-state-title">Select a research dossier</p>
                <p className="empty-state-desc">Click on any completed report to inspect discovered topics, source URLs, and key insights.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Research Form Component ---
function ResearchForm({
  websites,
  onSuccess,
}: {
  websites: ReturnType<typeof useAppStore.getState>['websites'];
  onSuccess: (record: Research) => void;
}) {
  const addResearch = useAppStore((s) => s.addResearch);

  const [form, setForm] = useState<ResearchFormData>({
    websiteId: websites[0]?.id || '',
    topic: '',
    category: '',
    targetAudience: '',
    keywords: [],
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<'idle' | 'formulating' | 'searching' | 'analyzing' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.websiteId) e.websiteId = 'Select a website';
    if (!form.topic.trim()) e.topic = 'Enter a research topic';
    if (!form.category) e.category = 'Select a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !(form.keywords || []).includes(kw)) {
      setForm({ ...form, keywords: [...(form.keywords || []), kw] });
      setKeywordInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setErrorMessage(null);
    setStage('formulating');

    const selectedSite = websites.find((w) => w.id === form.websiteId);

    try {
      // Stage 1: Formulating queries & querying Tavily
      setStage('searching');

      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: form.topic.trim(),
          niche: form.category || selectedSite?.niche || 'General',
          targetAudience: form.targetAudience || selectedSite?.audience || 'General Audience',
          keywords: form.keywords || [],
          maxQueries: 3,
        }),
      });

      setStage('analyzing');
      const res = await response.json();

      if (!res.success) {
        throw new Error(res.error || 'Failed to conduct web research.');
      }

      const report: DetailedResearchReport = res.data;

      // Also discover topical opportunities for the website
      const topicsResponse = await fetch('/api/ai/discover-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: form.websiteId,
          websiteName: selectedSite?.name || 'My Website',
          niche: form.category,
          targetAudience: form.targetAudience,
          keywords: form.keywords || [],
          seedTopic: form.topic,
        }),
      });

      const topicsRes = await topicsResponse.json();
      const discoveredTopics: ResearchTopic[] = topicsRes.success ? topicsRes.data : [];

      // Save into store
      const saved = addResearch({
        websiteId: form.websiteId,
        topic: form.topic,
        category: form.category,
        targetAudience: form.targetAudience,
        keywords: form.keywords || [],
      });

      // Update with discovered topics & completed status
      useAppStore.setState((s) => ({
        research: s.research.map((r) =>
          r.id === saved.id
            ? {
                ...r,
                status: 'completed',
                discoveredTopics:
                  discoveredTopics.length > 0
                    ? discoveredTopics
                    : (report.sources || []).map((src, i) => ({
                        id: `top-${i}`,
                        title: `${report.topic}: Pillar Guide`,
                        description: report.overview,
                        searchIntent: 'Informational',
                        suggestedKeywords: report.keywords,
                        insights: report.keyInsights,
                        sources: [
                          {
                            title: src.title,
                            url: src.url,
                            snippet: src.summary,
                            relevanceScore: 92,
                          },
                        ],
                        selected: i === 0,
                      })),
              }
            : r
        ),
      }));

      const finalRecord = useAppStore.getState().research.find((r) => r.id === saved.id) || saved;
      setStage('done');
      onSuccess(finalRecord);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during AI web research.');
      setStage('idle');
    }
  };

  const isLoading = stage !== 'idle' && stage !== 'done';

  return (
    <div className="card max-w-2xl">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <Sparkles size={20} className="text-indigo-500" />
        Start AI Web Research & Topic Discovery
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-6">
        Tavily queries live web sources, retrieves competitor coverage, and Gemini synthesizes verified insights and topic angles.
      </p>

      {errorMessage && (
        <div className="p-3.5 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>Research Error:</strong> {errorMessage}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center space-y-4">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h4 className="font-bold text-sm text-[var(--color-text)]">
              {stage === 'searching'
                ? 'Searching web sources via Tavily API...'
                : stage === 'analyzing'
                ? 'Synthesizing verified facts and topics with Gemini...'
                : 'Formulating targeted search queries...'}
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Extracting competitor data, identifying search intent, and cataloging citations.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Globe size={14} /> Target Website *
            </label>
            <select
              className={cn('form-select', errors.websiteId && 'error')}
              value={form.websiteId}
              onChange={(e) => setForm({ ...form, websiteId: e.target.value })}
            >
              <option value="">Select a website...</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.websiteId && <span className="form-error">{errors.websiteId}</span>}
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Search size={14} /> Topic or Exploration Angle *
            </label>
            <input
              className={cn('form-input', errors.topic && 'error')}
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g., AI Code Generation Tools in 2025"
            />
            {errors.topic && <span className="form-error">{errors.topic}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Tag size={14} /> Category / Niche *
              </label>
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
              <label className="form-label flex items-center gap-2">
                <Users size={14} /> Target Audience
              </label>
              <input
                className="form-input"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="e.g., Senior developers & CTOs"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Seed Keywords (Optional)</label>
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                placeholder="Add keyword and press Enter..."
              />
              <button type="button" onClick={handleAddKeyword} className="btn btn-secondary text-xs">
                Add
              </button>
            </div>
            {form.keywords && form.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.keywords.map((kw) => (
                  <span key={kw} className="tag text-xs">
                    {kw}
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, keywords: form.keywords?.filter((k) => k !== kw) })}
                      className="ml-1 hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full mt-2" disabled={isLoading}>
            <Sparkles size={16} /> Execute Autonomous Web Research
          </button>
        </form>
      )}
    </div>
  );
}

// --- Research Detail Component ---
function ResearchDetail({ research }: { research: Research }) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(
    research.discoveredTopics?.[0]?.id || null
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[var(--color-text)]">{research.topic}</h3>
          <span className="badge bg-emerald-50 text-emerald-700 text-xs font-semibold">
            {research.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><Tag size={13} /> {research.category}</span>
          <span className="flex items-center gap-1"><Users size={13} /> {research.targetAudience || 'General Readers'}</span>
          <span>{formatDate(research.createdAt)}</span>
        </div>

        {research.keywords && research.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {research.keywords.map((kw) => (
              <span key={kw} className="tag text-xs">{kw}</span>
            ))}
          </div>
        )}
      </div>

      <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
        Discovered Topics & Sources ({research.discoveredTopics?.length || 0})
      </h4>

      {research.discoveredTopics?.map((topic) => (
        <TopicCard
          key={topic.id}
          topic={topic}
          websiteId={research.websiteId}
          researchId={research.id}
          category={research.category}
          expanded={expandedTopic === topic.id}
          onToggle={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
        />
      ))}
    </div>
  );
}

// --- Topic Card Component ---
function TopicCard({
  topic,
  websiteId,
  researchId,
  category,
  expanded,
  onToggle,
}: {
  topic: ResearchTopic;
  websiteId: string;
  researchId: string;
  category: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="card hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3 flex-1 pr-3">
          <button className="mt-0.5 text-indigo-600 flex-shrink-0">
            {topic.selected ? <CheckSquare size={18} /> : <Square size={18} />}
          </button>
          <div>
            <h4 className="font-semibold text-sm text-[var(--color-text)]">{topic.title}</h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{topic.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge bg-blue-50 text-blue-700 text-[11px]">
                {topic.searchIntent}
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                {topic.sources?.length || 0} citations attached
              </span>
            </div>
          </div>
        </div>

        <button className="btn btn-ghost btn-icon flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pl-8 space-y-4 border-t border-[var(--color-border)] pt-4 animate-slide-up">
          {/* Action button: Generate blog directly */}
          <div className="flex justify-end">
            <Link
              href={`/generator?topic=${encodeURIComponent(topic.title)}&websiteId=${websiteId}&researchId=${researchId}&category=${encodeURIComponent(category)}`}
              className="btn btn-primary text-xs"
            >
              <Sparkles size={14} /> Generate Full Blog From This Topic <ArrowRight size={13} />
            </Link>
          </div>

          {/* Keywords */}
          {topic.suggestedKeywords && topic.suggestedKeywords.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">
                Suggested Keyword Targets
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {topic.suggestedKeywords.map((kw) => (
                  <span key={kw} className="tag text-xs">{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {topic.insights && topic.insights.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">
                Synthesized Insights
              </h5>
              <ul className="space-y-1.5">
                {topic.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                    <Lightbulb size={13} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Real Sources */}
          {topic.sources && topic.sources.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase mb-2">
                Verified Research Sources ({topic.sources.length})
              </h5>
              <div className="space-y-2">
                {topic.sources.map((src, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs p-2.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border)]">
                    <ExternalLink size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--color-text)] hover:text-indigo-600 transition-colors flex items-center gap-1"
                      >
                        <span className="truncate">{src.title}</span>
                        <ExternalLink size={10} className="flex-shrink-0" />
                      </a>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                        {src.snippet}
                      </p>
                    </div>
                    <span className="badge bg-indigo-50 text-indigo-700 ml-auto flex-shrink-0 text-[10px]">
                      {src.relevanceScore}% Relevance
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
