'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText, Globe, Clock, CheckCircle, BarChart3,
  TrendingUp, ArrowRight, Sparkles, Send, Eye,
  AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { DEMO_ANALYTICS } from '@/lib/mock-data';
import { getStatusColor, getStatusLabel, timeAgo, truncate } from '@/lib/utils';

// Helper to map stat labels to design token colors
const getStatColors = (label: string) => {
  switch (label) {
    case 'Total Blogs':
      return { bg: 'var(--color-primary-light)', color: 'var(--color-primary)' };
    case 'Pending Approval':
      return { bg: 'var(--color-accent-light)', color: 'var(--color-accent)' };
    case 'Published':
      return { bg: 'var(--color-primary)', color: '#fff' };
    case 'Connected Sites':
      return { bg: 'var(--color-accent)', color: '#fff' };
    default:
      return { bg: 'var(--color-bg-muted)', color: 'var(--color-text)' };
  }
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#94a3b8', '#8b5cf6', '#6366f1'];

export default function DashboardPage() {
  const storeBlogs = useAppStore((s) => s.blogs);
  const storeWebsites = useAppStore((s) => s.websites);

  const [dbData, setDbData] = useState<any>(null);
  const [isDbConnected, setIsDbConnected] = useState(false);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setDbData(json.data);
          setIsDbConnected(Boolean(json.data.isDatabaseConnected));
        }
      })
      .catch(() => {
        setIsDbConnected(false);
      });
  }, []);

  const totalBlogsCount = isDbConnected && dbData?.stats ? dbData.stats.totalBlogs : storeBlogs.length;
  const pendingCount = isDbConnected && dbData?.stats ? dbData.stats.pendingApprovals : storeBlogs.filter((b) => b.status === 'pending_approval').length;
  const publishedCount = isDbConnected && dbData?.stats ? dbData.stats.publishedBlogs : storeBlogs.filter((b) => b.status === 'published').length;
  const websitesCount = isDbConnected && dbData?.stats ? dbData.stats.connectedWebsites : storeWebsites.length;

  const recentBlogs = isDbConnected && dbData?.recentBlogs?.length > 0
    ? dbData.recentBlogs
    : [...storeBlogs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  const stats = [
    {
      label: 'Total Blogs',
      value: totalBlogsCount,
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600',
      href: '/content',
    },
    {
      label: 'Pending Approval',
      value: pendingCount,
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      href: '/approvals',
    },
    {
      label: 'Published',
      value: publishedCount,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-600',
      href: '/content',
    },
    {
      label: 'Connected Sites',
      value: websitesCount,
      icon: Globe,
      color: 'bg-purple-50 text-purple-600',
      href: '/websites',
    },
  ];

  const quickActions = [
    { label: 'Connect Website', icon: Globe, href: '/websites', color: 'text-purple-600' },
    { label: 'Generate Blog', icon: Sparkles, href: '/generator', color: 'text-indigo-600' },
    { label: 'Review Pending', icon: Eye, href: '/approvals', color: 'text-orange-600' },
    { label: 'View Published', icon: Send, href: '/content', color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner: Database & Engine status */}
      {isDbConnected ? (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-emerald-800 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={17} className="text-emerald-600" />
            <span className="font-medium">
              PostgreSQL Database & LangGraph Multi-Agent Orchestration Active. Displaying live persistent records.
            </span>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200/60 font-semibold text-emerald-800">
            Postgres Online
          </span>
        </div>
      ) : (
        <div className="demo-banner">
          <AlertCircle size={16} />
          <span>Dashboard is operating in live development mode. Configure PostgreSQL in .env.local to persist all workflow records.</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid-stats">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="stat-card">
              <div className="stat-icon" style={getStatColors(stat.label)}>
                <stat.icon size={22} />
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        {/* Blog Generation Trend */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" />
              Content Generation Trend
            </h3>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={DEMO_ANALYTICS.blogsByMonth}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Publishing Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-500" />
              Weekly Publishing Activity
            </h3>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={DEMO_ANALYTICS.publishingActivity} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="generated" fill="var(--color-primary-light)" radius={[4, 4, 0, 0]} name="Generated" />
                <Bar dataKey="published" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Published" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Recent Blogs */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Articles</h3>
            <Link href="/content" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentBlogs.map((blog: any) => (
              <div
                key={blog.id}
                className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0"
              >
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-medium truncate">{truncate(blog.title, 50)}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {blog.websiteName || blog.website?.name || 'TechPulse'} · {timeAgo(blog.updatedAt || blog.date)}
                  </p>
                </div>
                <span className={"badge " + getStatusColor(blog.status)}>
                  {getStatusLabel(blog.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions + Status Distribution */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
                        <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} className="quick-action">
                  <action.icon size={18} className="icon" />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Content Status</h3>
            </div>
            <div className="flex items-center gap-6">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={DEMO_ANALYTICS.statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                    >
                      {DEMO_ANALYTICS.statusDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {DEMO_ANALYTICS.statusDistribution.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-[var(--color-text-secondary)]">{item.status}</span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

  );
}
