'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  Menu, Search, Plus, User, Sun, Moon,
  ChevronDown, LogOut, Settings, Loader2,
} from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/websites': 'Websites',
  '/research': 'Research & Topics',
  '/generator': 'Blog Generator',
  '/content': 'Content Library',
  '/approvals': 'Approval Center',
  '/integrations': 'CMS Integrations',
  '/automation': 'Automation',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
};

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  const pageTitle =
    Object.entries(PAGE_TITLES).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] || 'BlogFlow AI';

  const displayName = (session?.user as any)?.name || session?.user?.email || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setSigningOut(true);
    setProfileOpen(false);
    await signOut({ callbackUrl: '/login' });
  };

  // initialise theme from localStorage / OS preference
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ? saved === 'dark' : prefersDark;
    setIsDark(initial);
    const html = document.documentElement;
    if (initial) html.classList.add('dark'); else html.classList.remove('dark');
  }, []);

  // sync class when isDark changes
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark'); else html.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onMenuClick}
          className="btn-ghost btn-icon lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="relative hidden md:block">
          {searchOpen ? (
            <div className="search-input-wrapper animate-fade-in">
              <Search size={16} />
              <input
                type="text"
                className="form-input w-64"
                placeholder="Search articles, websites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="btn btn-ghost btn-icon"
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          )}
        </div>

        {/* Quick Action */}
        <Link href="/generator" className="btn btn-primary btn-sm hidden sm:inline-flex">
          <Plus size={16} />
          <span>New Blog</span>
        </Link>

        {/* Profile */}
        <div className="relative">
          <button
            className="flex items-center gap-2 btn-ghost rounded-lg px-2 py-1.5"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-label="User menu"
            aria-expanded={profileOpen}
          >
            {status === 'loading' ? (
              <Loader2 size={20} className="animate-spin text-[var(--color-text-muted)]" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold select-none" style={{ background: 'var(--color-primary)' }}>
                  {userInitial}
                </div>
                <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={14} className="hidden md:block text-[var(--color-text-muted)]" />
              </>
            )}
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-50 animate-slide-up py-1">
                <div className="px-4 py-3 border-b border-[var(--color-border)]">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {session?.user?.email || ''}
                  </p>
                </div>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <User size={16} />
                  Profile
                </Link>
                <div className="border-t border-[var(--color-border)]">
                  <button
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-error)] hover:bg-red-50 transition-colors w-full"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    {signingOut ? 'Signing out…' : 'Sign Out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(prev => !prev)}
        className="p-2 rounded-md bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-bg-muted)] transition-colors"
        aria-label="Toggle light/dark mode"
      >
        <Sun size={18} className={isDark ? 'hidden' : ''} />
        <Moon size={18} className={isDark ? '' : 'hidden'} />
      </button>
    </header>
  );
}
