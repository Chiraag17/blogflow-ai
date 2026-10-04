'use client';

import { useState } from 'react';
import {
  BarChart3, TrendingUp, Award, Globe, FileText, CheckCircle2,
  Calendar, ArrowUpRight, Clock, Target, Layers, ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { DEMO_ANALYTICS } from '@/lib/mock-data';
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import Link from 'next/link';

export default function AnalyticsPage() {
  const blogs = useAppStore((s) => s.blogs);
  const websites = useAppStore((s) => s.websites);
  const qualityReports = useAppStore((s) => s.qualityReports);

  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'year'>('30d');

  // Compute live stats based on store
  const totalBlogs = blogs.length;
  const publishedCount = blogs.filter((b) => b.status === 'published').length;
  const pendingCount = blogs.filter((b) => b.status === 'pending_approval').length;
  const scheduledCount = blogs.filter((b) => b.status === 'scheduled').length;

  const avgSeo = Math.round(
    qualityReports.reduce((acc, q) => acc + q.seoScore, 0) / (qualityReports.length || 1)
  );
  const avgReadability = Math.round(
    qualityReports.reduce((acc, q) => acc + q.readabilityScore, 0) / (qualityReports.length || 1)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={22} className="text-indigo-600" />
            Performance & Content Analytics
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Real-time telemetry on article production, SEO health, and publishing throughput.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-[var(--color-border)] shadow-xs">
          {(['30d', '90d', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last Quarter' : 'Year to Date'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Total Generated</span>
            <FileText size={16} className="text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--color-text)]">{totalBlogs}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> +28%
            </span>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">Across {websites.length} connected websites</span>
        </div>

        <div className="card space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Published Live</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--color-text)]">{publishedCount}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp size={12} className="mr-0.5" /> +15%
            </span>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">{scheduledCount} scheduled for release</span>
        </div>

        <div className="card space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Average SEO Score</span>
            <Award size={16} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{avgSeo}%</span>
            <span className="text-xs text-slate-500">Target: 80%+</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Optimal Google ranking readiness</span>
        </div>

        <div className="card space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Readability Index</span>
            <Target size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{avgReadability}%</span>
            <span className="text-xs text-slate-500">Grade 8-10 level</span>
          </div>
          <span className="text-[11px] text-[var(--color-text-muted)]">High reader retention benchmark</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Production Velocity (2 cols) */}
        <div className="card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">Monthly Content Production</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Articles generated and refined per month</p>
            </div>
            <span className="badge bg-indigo-50 text-indigo-700 text-xs font-semibold">
              Peak: 12 posts/mo
            </span>
          </div>

          {/* Simple custom CSS Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-[var(--color-border)]">
            {DEMO_ANALYTICS.blogsByMonth.map((item) => {
              const max = 15;
              const heightPercent = Math.round((item.count / max) * 100);
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md transition-all group-hover:brightness-110"
                  />
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">{item.month}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
              <span>AI Articles Generated</span>
            </div>
            <span>Average turnaround: 3.2 minutes per article</span>
          </div>
        </div>

        {/* Content Status Breakdown (1 col) */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-base">Status Distribution</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Lifecycle state of all managed articles</p>

          <div className="space-y-3 pt-2">
            {DEMO_ANALYTICS.statusDistribution.map((item) => {
              const total = DEMO_ANALYTICS.totalBlogs;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[var(--color-text)]">{item.status}</span>
                    <span className="text-[var(--color-text-muted)]">{item.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'Published'
                          ? 'bg-emerald-500'
                          : item.status === 'Pending'
                          ? 'bg-amber-500'
                          : item.status === 'Approved'
                          ? 'bg-indigo-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories & Quality Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-base">Top Publishing Niches</h3>
          <div className="space-y-3">
            {DEMO_ANALYTICS.topCategories.map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-subtle)]">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-sm">{cat.category}</span>
                </div>
                <span className="badge bg-indigo-50 text-indigo-700 font-medium text-xs">
                  {cat.count} articles
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Audit Summary */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-base">Quality Assurance Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500">Grammar Pass Rate</span>
              <p className="text-xl font-bold text-emerald-600">100%</p>
              <p className="text-[10px] text-slate-400">Zero grammar violations</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500">Avg Source Citations</span>
              <p className="text-xl font-bold text-indigo-600">4.8 / post</p>
              <p className="text-[10px] text-slate-400">Tavily verified sources</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500">Approval Acceptance</span>
              <p className="text-xl font-bold text-blue-600">92%</p>
              <p className="text-[10px] text-slate-400">First-pass reviewer approvals</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500">Avg Article Length</span>
              <p className="text-xl font-bold text-purple-600">1,480 w</p>
              <p className="text-[10px] text-slate-400">Long-form SEO optimized</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
