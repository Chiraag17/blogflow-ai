'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plug, Plus, Globe, CheckCircle, XCircle,
  RefreshCw, Trash2, X, AlertCircle, Shield,
  Link as LinkIcon, Calendar, Send, ExternalLink,
  CheckCircle2, Clock, RotateCcw, AlertTriangle,
} from 'lucide-react';
import {
  getConnectionColor, formatDate, formatDateTime,
  timeAgo, isValidUrl, cn, getStatusColor, getStatusLabel,
} from '@/lib/utils';

export default function IntegrationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [websites, setWebsites] = useState<any[]>([]);
  const [publishingHistory, setPublishingHistory] = useState<any[]>([]);
  const [approvedBlogs, setApprovedBlogs] = useState<any[]>([]);

  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Fetch integrations, websites, publishing history, and approved blogs from PostgreSQL
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [intRes, webRes, histRes, blogsRes] = await Promise.all([
        fetch('/api/integrations/wordpress'),
        fetch('/api/websites'),
        fetch('/api/publishing/history'),
        fetch('/api/blogs?status=APPROVED'),
      ]);

      if (intRes.ok) {
        const intJson = await intRes.json();
        if (intJson.success) setIntegrations(intJson.data || []);
      }

      if (webRes.ok) {
        const webJson = await webRes.json();
        if (webJson.success) setWebsites(webJson.data || []);
      }

      if (histRes.ok) {
        const histJson = await histRes.json();
        if (histJson.success) setPublishingHistory(histJson.data || []);
      }

      if (blogsRes.ok) {
        const blogsJson = await blogsRes.json();
        if (blogsJson.success) setApprovedBlogs(blogsJson.data?.blogs || []);
      }
    } catch (err: any) {
      setFeedback({ message: `Error loading integration data: ${err.message}`, isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this WordPress site?')) return;
    try {
      const res = await fetch(`/api/integrations/wordpress/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ message: 'WordPress integration disconnected successfully.' });
        fetchData();
      } else {
        setFeedback({ message: data.error || 'Failed to disconnect.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: `Error: ${err.message}`, isError: true });
    }
  };

  const handleRetryPublish = async (publishingRecordId: string) => {
    setRetryingId(publishingRecordId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/publishing/${publishingRecordId}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ message: 'Publishing retry succeeded! Draft successfully updated on WordPress.' });
        fetchData();
      } else {
        setFeedback({ message: data.error || 'Retry failed.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: `Retry network error: ${err.message}`, isError: true });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">WordPress Integrations & Publishing</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Connect your WordPress site via encrypted Application Passwords and track draft publishing history.
          </p>
        </div>
        <div className="flex gap-2.5">
          {approvedBlogs.length > 0 && (
            <button
              className="btn btn-secondary text-xs"
              onClick={() => setShowPublishForm(true)}
            >
              <Send size={15} /> Publish Approved Article
            </button>
          )}
          <button
            className="btn btn-primary text-xs"
            onClick={() => setShowConnectForm(true)}
          >
            <Plus size={15} /> Connect WordPress
          </button>
        </div>
      </div>

      {/* Security & Policy Banner */}
      <div className="flex items-start gap-3 p-4 bg-indigo-50/70 rounded-xl border border-indigo-100">
        <Shield size={20} className="text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs sm:text-sm text-indigo-900 leading-relaxed space-y-1">
          <p>
            <strong>Security & Privacy:</strong> All WordPress Application Passwords are encrypted at rest using <strong>AES-256-GCM</strong> on the server and are never exposed or transmitted to client browsers.
          </p>
          <p className="text-indigo-700">
            <strong>Publishing Policy:</strong> Articles are always published as <strong>Draft</strong> posts initially to ensure full editorial review before going live.
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center justify-between text-sm shadow-xs',
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

      {/* SECTION 1: Connected Integrations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Plug size={18} className="text-indigo-600" />
            Connected WordPress Sites ({integrations.length})
          </h3>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn btn-ghost btn-icon text-xs"
            title="Refresh Integrations"
          >
            <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
          </button>
        </div>

        {isLoading ? (
          <div className="card text-center py-10">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[var(--color-text-muted)]">Loading connected CMS integrations...</p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="empty-state card py-10">
            <div className="empty-state-icon"><Plug size={28} /></div>
            <p className="empty-state-title">No WordPress site connected</p>
            <p className="empty-state-desc">
              Connect your WordPress site using an Application Password to publish articles directly as drafts.
            </p>
            <button className="btn btn-primary text-xs mt-3" onClick={() => setShowConnectForm(true)}>
              <Plus size={15} /> Connect WordPress Site
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations.map((int) => (
              <div key={int.id} className="card p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        W
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--color-text)]">
                          {int.website?.name || 'WordPress Site'}
                        </h4>
                        <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
                          {int.username}
                        </span>
                      </div>
                    </div>
                    <span className="badge bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold">
                      {int.connectionStatus}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-light)]">
                      <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <LinkIcon size={12} /> Site URL
                      </span>
                      <a
                        href={int.cmsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                      >
                        <span className="truncate">{int.cmsUrl}</span>
                        <ExternalLink size={10} className="flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[var(--color-border-light)]">
                      <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Shield size={12} /> Credentials
                      </span>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle size={12} /> AES-256-GCM Encrypted
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                        <Clock size={12} /> Connected
                      </span>
                      <span className="text-[var(--color-text-secondary)]">
                        {timeAgo(int.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border-light)] flex items-center justify-end">
                  <button
                    className="btn btn-ghost btn-sm text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    onClick={() => handleDisconnect(int.id)}
                  >
                    <Trash2 size={13} /> Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Publishing History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              Publishing History ({publishingHistory.length})
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              History of articles published or drafted to WordPress with external IDs, URLs, and timestamps.
            </p>
          </div>
        </div>

        {publishingHistory.length === 0 ? (
          <div className="empty-state card py-8">
            <Clock size={28} className="text-slate-400 mx-auto mb-2" />
            <p className="empty-state-title">No publishing records yet</p>
            <p className="empty-state-desc">Articles published to your WordPress site will be logged here.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-[var(--color-border)] text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Article Title</th>
                    <th className="py-3 px-4">CMS Destination</th>
                    <th className="py-3 px-4">WP Post ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">WordPress Link</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-light)]">
                  {publishingHistory.map((item) => {
                    const isFailed = item.publishingStatus === 'FAILED';
                    const isDraft = item.publishingStatus === 'PENDING';
                    const isPublished = item.publishingStatus === 'PUBLISHED';
                    const isScheduled = item.publishingStatus === 'SCHEDULED';

                    return (
                      <tr key={item.id} className="hover:bg-[var(--color-bg-subtle)] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[var(--color-text)] max-w-xs truncate">
                          {item.blog?.title || 'Untitled Article'}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                          {item.integration?.cmsUrl || 'WordPress'}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {item.externalPostId ? `#${item.externalPostId}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'badge text-[10px] uppercase font-bold',
                              isDraft && 'bg-blue-100 text-blue-800',
                              isPublished && 'bg-emerald-100 text-emerald-800',
                              isScheduled && 'bg-purple-100 text-purple-800',
                              isFailed && 'bg-red-100 text-red-800'
                            )}
                          >
                            {isDraft ? 'Draft' : item.publishingStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.publishedUrl ? (
                            <a
                              href={item.publishedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <span>View Post</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[var(--color-text-muted)]">
                          {formatDateTime(item.publishedAt || item.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isFailed ? (
                            <button
                              onClick={() => handleRetryPublish(item.id)}
                              disabled={retryingId === item.id}
                              className="btn btn-secondary btn-sm text-[11px] text-amber-700 font-semibold"
                            >
                              <RotateCcw size={12} className={cn(retryingId === item.id && 'animate-spin')} />
                              {retryingId === item.id ? 'Retrying...' : 'Retry Publish'}
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-medium flex items-center justify-end gap-1">
                              <CheckCircle size={13} /> Synced
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Connect CMS Modal */}
      {showConnectForm && (
        <ConnectCMSModal
          websites={websites}
          onSuccess={() => {
            setShowConnectForm(false);
            setFeedback({ message: 'WordPress site connected and credentials verified successfully!' });
            fetchData();
          }}
          onClose={() => setShowConnectForm(false)}
        />
      )}

      {/* Publish Article Modal */}
      {showPublishForm && (
        <PublishModal
          approvedBlogs={approvedBlogs}
          integrations={integrations}
          onSuccess={(msg) => {
            setShowPublishForm(false);
            setFeedback({ message: msg });
            fetchData();
          }}
          onClose={() => setShowPublishForm(false)}
        />
      )}
    </div>
  );
}

// --- Connect CMS Modal ---
function ConnectCMSModal({
  websites,
  onSuccess,
  onClose,
}: {
  websites: any[];
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [websiteId, setWebsiteId] = useState(websites[0]?.id || '');
  const [cmsUrl, setCmsUrl] = useState('');
  const [username, setUsername] = useState('');
  const [applicationPassword, setApplicationPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!websiteId) {
      setError('Please select an associated registered website.');
      return;
    }
    if (!cmsUrl || !isValidUrl(cmsUrl)) {
      setError('Please enter a valid WordPress URL (e.g., https://yoursite.com).');
      return;
    }
    if (!username.trim()) {
      setError('Please enter your WordPress username.');
      return;
    }
    if (!applicationPassword.trim()) {
      setError('Please enter your WordPress Application Password.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/integrations/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId,
          cmsUrl: cmsUrl.trim(),
          username: username.trim(),
          applicationPassword: applicationPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate with WordPress site.');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Connection test failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title font-bold text-base flex items-center gap-2">
            <Plug size={18} className="text-indigo-600" />
            Connect WordPress Website
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-4 py-4">
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-900 leading-relaxed">
              We test your connection live via the WordPress REST API (<code className="bg-blue-100/70 px-1 py-0.5 rounded">/wp-json/wp/v2/users/me</code>). Credentials are encrypted using AES-256-GCM.
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label text-xs">Target Website *</label>
              <select
                className="form-select text-xs"
                value={websiteId}
                onChange={(e) => setWebsiteId(e.target.value)}
                required
              >
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.url})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">WordPress Site URL *</label>
              <input
                type="url"
                className="form-input text-xs"
                placeholder="https://myblog.com"
                value={cmsUrl}
                onChange={(e) => setCmsUrl(e.target.value)}
                required
              />
              <span className="form-hint text-[11px]">
                Must begin with https:// or http:// without trailing slash.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">WordPress Username *</label>
              <input
                type="text"
                className="form-input text-xs"
                placeholder="editor_admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Application Password *</label>
              <input
                type="password"
                className="form-input text-xs font-mono"
                placeholder="abcd efgh ijkl mnop"
                value={applicationPassword}
                onChange={(e) => setApplicationPassword(e.target.value)}
                required
              />
              <span className="form-hint text-[11px]">
                In WordPress: Users → Profile → Scroll to &quot;Application Passwords&quot; → Add New.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary text-xs" onClick={onClose} disabled={isVerifying}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Verifying Connection...
                </>
              ) : (
                <>
                  <Plug size={14} />
                  Verify & Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Publish Modal ---
function PublishModal({
  approvedBlogs,
  integrations,
  onSuccess,
  onClose,
}: {
  approvedBlogs: any[];
  integrations: any[];
  onSuccess: (msg: string) => void;
  onClose: () => void;
}) {
  const [selectedBlogId, setSelectedBlogId] = useState(approvedBlogs[0]?.id || '');
  const [integrationId, setIntegrationId] = useState(integrations[0]?.id || '');
  const [publishMode, setPublishMode] = useState<'draft' | 'publish'>('draft');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBlog = approvedBlogs.find((b) => b.id === selectedBlogId);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlogId) {
      setError('Please select an article to publish.');
      return;
    }
    if (!integrationId) {
      setError('Please select a connected WordPress site.');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const res = await fetch(`/api/blogs/${selectedBlogId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationId,
          publishMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish to WordPress.');
      }

      onSuccess(
        `Article successfully published to WordPress as ${publishMode.toUpperCase()}! ${
          data.data?.publishedUrl ? `URL: ${data.data.publishedUrl}` : ''
        }`
      );
    } catch (err: any) {
      setError(err.message || 'Publishing failed.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title font-bold text-base flex items-center gap-2">
            <Send size={18} className="text-indigo-600" />
            Publish Approved Article
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-icon">✕</button>
        </div>

        <form onSubmit={handlePublish}>
          <div className="modal-body space-y-4 py-4">
            {integrations.length === 0 ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <span>No active WordPress connections found. Connect WordPress first.</span>
              </div>
            ) : null}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label text-xs">Select Approved Article *</label>
              <select
                className="form-select text-xs"
                value={selectedBlogId}
                onChange={(e) => setSelectedBlogId(e.target.value)}
                required
              >
                {approvedBlogs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.website?.name || 'Site'})
                  </option>
                ))}
              </select>
            </div>

            {selectedBlog && (
              <div className="p-3 rounded-lg bg-[var(--color-bg-subtle)] text-xs space-y-1">
                <p className="font-semibold text-[var(--color-text)]">{selectedBlog.title}</p>
                <p className="text-[var(--color-text-muted)]">
                  Focus Keyword: {selectedBlog.focusKeyword || 'General'} · ~{selectedBlog.estimatedReadingTime || 5} min read
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label text-xs">Target WordPress CMS *</label>
              <select
                className="form-select text-xs"
                value={integrationId}
                onChange={(e) => setIntegrationId(e.target.value)}
                required
              >
                {integrations.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.website?.name} — {i.cmsUrl} ({i.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Publishing Post Status *</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer text-xs transition-all',
                    publishMode === 'draft'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-500'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]'
                  )}
                >
                  <input
                    type="radio"
                    name="publishMode"
                    className="sr-only"
                    checked={publishMode === 'draft'}
                    onChange={() => setPublishMode('draft')}
                  />
                  <div className="font-bold">Draft (Recommended)</div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Creates an unpublished post on WordPress for final review.
                  </div>
                </label>

                <label
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer text-xs transition-all',
                    publishMode === 'publish'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-500'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]'
                  )}
                >
                  <input
                    type="radio"
                    name="publishMode"
                    className="sr-only"
                    checked={publishMode === 'publish'}
                    onChange={() => setPublishMode('publish')}
                  />
                  <div className="font-bold">Public Immediately</div>
                  <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Publishes the post immediately to the public site.
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary text-xs" onClick={onClose} disabled={isPublishing}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs"
              disabled={isPublishing || integrations.length === 0}
            >
              {isPublishing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Sending to WordPress...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send to WordPress
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
