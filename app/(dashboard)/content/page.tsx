'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Filter, FileText, Eye, Edit2, Trash2,
  MoreVertical, Calendar, Globe, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { BlogStatus, Blog } from '@/types';
import {
  getStatusColor, getStatusLabel, formatDate, timeAgo,
  truncate, cn,
} from '@/lib/utils';

const STATUS_FILTERS: { value: BlogStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Articles' },
  { value: 'draft', label: 'Drafts' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'changes_requested', label: 'Changes Requested' },
];

const PAGE_SIZE = 10;

export default function ContentPage() {
  const blogs = useAppStore((s) => s.blogs);
  const deleteBlog = useAppStore((s) => s.deleteBlog);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [previewBlog, setPreviewBlog] = useState<Blog | null>(null);

  const filtered = useMemo(() => {
    let result = [...blogs];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.websiteName.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [blogs, searchQuery, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedBlogs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold">Content Library</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/generator" className="btn btn-primary">
          <FileText size={16} />
          Generate New
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="search-input-wrapper flex-1 min-w-[200px]">
            <Search />
            <input
              type="text"
              className="form-input"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[var(--color-text-muted)]" />
            <select
              className="form-select w-auto"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as BlogStatus | 'all'); setPage(1); }}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <select
            className="form-select w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'created' | 'title')}
          >
            <option value="updated">Last Modified</option>
            <option value="created">Date Created</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'all' ? blogs.length : blogs.filter((b) => b.status === f.value).length;
          return (
            <button
              key={f.value}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                statusFilter === f.value
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[#cbd5e1]'
              )}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Articles Table */}
      {paginatedBlogs.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><FileText size={28} /></div>
          <p className="empty-state-title">No articles found</p>
          <p className="empty-state-desc">
            {searchQuery
              ? 'Try adjusting your search or filters.'
              : 'Generate your first blog to get started.'}
          </p>
        </div>
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Website</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ width: 50 }}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedBlogs.map((blog) => (
                  <tr key={blog.id}>
                    <td>
                      <div className="min-w-[200px]">
                        <Link
                          href={`/content/${blog.id}`}
                          className="font-medium text-sm hover:text-indigo-600 transition-colors"
                        >
                          {truncate(blog.title, 60)}
                        </Link>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {blog.wordCount} words · {blog.readingTime} min read
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 text-sm">
                        <Globe size={13} className="text-[var(--color-text-muted)]" />
                        {blog.websiteName}
                      </span>
                    </td>
                    <td>
                      <span className="tag text-xs">{blog.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusColor(blog.status)}`}>
                        {getStatusLabel(blog.status)}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-[var(--color-text-muted)]">
                        {timeAgo(blog.updatedAt)}
                      </span>
                    </td>
                    <td>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === blog.id ? null : blog.id)}
                          className="btn btn-ghost btn-icon"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {menuOpen === blog.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-20 py-1">
                              <Link
                                href={`/content/${blog.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-[var(--color-bg-muted)]"
                                onClick={() => setMenuOpen(null)}
                              >
                                <Edit2 size={14} /> Edit & Inspect
                              </Link>
                              <button
                                className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-[var(--color-bg-muted)]"
                                onClick={() => { setPreviewBlog(blog); setMenuOpen(null); }}
                              >
                                <Eye size={14} /> Quick Preview
                              </button>
                              <button
                                className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-red-50 text-red-600"
                                onClick={() => { deleteBlog(blog.id); setMenuOpen(null); }}
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)]">
              <span className="text-sm text-[var(--color-text-muted)]">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewBlog && (
        <div className="modal-overlay" onClick={() => setPreviewBlog(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{truncate(previewBlog.title, 50)}</h2>
              <button onClick={() => setPreviewBlog(null)} className="btn btn-ghost btn-icon">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="flex flex-wrap gap-3 mb-4 text-sm text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1"><Globe size={13} /> {previewBlog.websiteName}</span>
                <span className="flex items-center gap-1"><Calendar size={13} /> {formatDate(previewBlog.createdAt)}</span>
                <span>{previewBlog.wordCount} words</span>
                <span className={`badge ${getStatusColor(previewBlog.status)}`}>
                  {getStatusLabel(previewBlog.status)}
                </span>
              </div>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {previewBlog.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
