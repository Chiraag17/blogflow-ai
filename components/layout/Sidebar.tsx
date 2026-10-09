'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Globe, Search, PenTool, BookOpen,
  CheckCircle, Plug, Zap, BarChart3, Settings,
  ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/websites', label: 'Websites', icon: Globe },
  { href: '/research', label: 'Research & Topics', icon: Search },
  { href: '/generator', label: 'Blog Generator', icon: PenTool },
  { href: '/content', label: 'Content Library', icon: BookOpen },
  { href: '/approvals', label: 'Approval Center', icon: CheckCircle },
  { href: '/integrations', label: 'CMS Integrations', icon: Plug },
  { href: '/automation', label: 'Automation', icon: Zap },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const setCollapsed = useAppStore((s) => s.setSidebarCollapsed);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'sidebar',
          collapsed && 'collapsed',
          mobileOpen && 'mobile-open'
        )}
      >
        <div className="sidebar-logo">
          {collapsed ? (
            <div className="sidebar-logo-icon"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                fontFamily: 'Merriweather',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              B
            </div>
          ) : (
            <span className="text-lg font-bold"
              style={{ fontFamily: 'Merriweather', color: 'var(--color-text)' }}>
              BlogFlow AI
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sidebar-nav-item', isActive && 'active')}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-[var(--color-border)] hidden lg:block">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-nav-item justify-center"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
