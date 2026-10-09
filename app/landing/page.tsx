'use client';

import Link from 'next/link';
import { Sun, Moon, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// Reusable component for workflow stages
function WorkflowStage({ number, title, description, children }: {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-8">
      <div className="flex-shrink-0 text-2xl font-bold text-[var(--color-primary)]">{number}</div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">{description}</p>
        {children}
      </div>
    </div>
  );
}

// Minimal product visual representing the editorial workflow
function EditorialPreview() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 border border-[var(--color-border)] rounded-md bg-[var(--color-surface)] shadow-sm max-w-md">
      {/* Source panel */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <span className="inline-block w-4 h-4 bg-[var(--color-primary)] rounded-sm" />
        <span>Source: example.com</span>
      </div>
      {/* Topic discovery */}
      <div className="text-sm font-medium text-[var(--color-text)]">Emerging developer tools worth watching</div>
      {/* Article preview */}
      <div className="border-t border-[var(--color-border)] pt-2">
        <h4 className="font-serif text-base text-[var(--color-text)]">How AI is reshaping the dev toolkit</h4>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">An overview of recent AI-driven extensions, linters, and code-gen tools.</p>
      </div>
      {/* Quality review */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
        <span>&#x2705; Structure reviewed</span>
        <span>&#x2705; SEO ready</span>
      </div>
      {/* Approval status */}
      <div className="text-xs text-[var(--color-accent)] font-medium">AWAITING REVIEW</div>
    </div>
  );
}

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefers = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const init = saved ? saved === 'dark' : prefers;
    setIsDark(init);
    const html = document.documentElement;
    if (init) html.classList.add('dark'); else html.classList.remove('dark');
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) html.classList.add('dark'); else html.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className="font-sans text-[var(--color-text)] bg-[var(--color-bg)] min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
        <Link href="/" className="text-xl font-serif text-[var(--color-primary)]">BlogFlow AI</Link>
        <nav className="hidden md:flex gap-6 text-sm">
          <Link href="#product" className="hover:text-[var(--color-primary)]">Product</Link>
          <Link href="#workflow" className="hover:text-[var(--color-primary)]">Workflow</Link>
          <Link href="#features" className="hover:text-[var(--color-primary)]">Features</Link>
          <Link href="#creators" className="hover:text-[var(--color-primary)]">For creators</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">Sign in</Link>
          <Link href="/generator" className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-surface)] rounded-md hover:bg-[var(--color-primary-hover)] flex items-center">
            Start creating
            <ArrowRight className="ml-1" size={16} />
          </Link>
          <button
            onClick={() => setIsDark(prev => !prev)}
            className="p-2 rounded-md bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] transition-colors"
            aria-label="Toggle light/dark mode"
          >
            <Sun size={18} className={isDark ? 'hidden' : ''} style={{ color: 'var(--color-text)' }} />
            <Moon size={18} className={isDark ? '' : 'hidden'} style={{ color: 'var(--color-text)' }} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section id="hero" className="grid md:grid-cols-2 gap-8 px-6 py-16 max-w-7xl mx-auto items-center">
        <div className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-primary)]">The Content Workflow Studio</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight text-[var(--color-text)]">
            Good ideas deserve a better way to get published.
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] max-w-prose">
            Research topics, turn source material into thoughtful article drafts, check quality, and publish when you are ready. BlogFlow AI brings your content workflow into one place.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/generator" className="px-5 py-3 bg-[var(--color-primary)] text-[var(--color-surface)] rounded-md hover:bg-[var(--color-primary-hover)] flex items-center">
              Create your first article
              <ArrowRight className="ml-2" size={16} />
            </Link>
            <a href="#workflow" className="text-[var(--color-primary)] hover:underline flex items-center">
              Explore the workflow
              <ArrowRight className="ml-1" size={14} />
            </a>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Human review stays in the loop.</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <EditorialPreview />
        </div>
      </section>

      {/* Editorial trust strip */}
      <section className="bg-[var(--color-surface)] py-4 border-t border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex justify-between text-center text-sm text-[var(--color-text-secondary)]">
          <div>Research before writing.</div>
          <div>Structure before polish.</div>
          <div>Review before publishing.</div>
          <div>Your content, your final approval.</div>
        </div>
      </section>

      {/* Workflow section */}
      <section id="workflow" className="px-6 py-12 max-w-5xl mx-auto space-y-12">
        <h2 className="text-2xl font-serif text-[var(--color-text)] text-center mb-4">One idea. A complete publishing workflow.</h2>
        <p className="text-center text-sm text-[var(--color-text-secondary)] mb-8">Move from a promising topic to a reviewable article without stitching together disconnected tools.</p>
        <div className="space-y-8">
          <WorkflowStage number={1} title="Discover" description="Start with a website URL and content preferences to surface relevant topics.">
            <div className="text-sm text-[var(--color-text-secondary)]">Sample source URL: <code className="bg-[var(--color-bg-subtle)] px-1 rounded">example.com</code></div>
          </WorkflowStage>
          <WorkflowStage number={2} title="Research" description="The platform gathers and organizes supporting context from multiple sources.">
            <div className="text-sm text-[var(--color-text-secondary)]">Notes, quotes, and key points appear as a concise list.</div>
          </WorkflowStage>
          <WorkflowStage number={3} title="Draft" description="AI turns the curated material into a structured article draft.">
            <div className="text-sm text-[var(--color-text-secondary)]">An outline with headings, sub-headings, and starter paragraphs.</div>
          </WorkflowStage>
          <WorkflowStage number={4} title="Refine" description="Grammar, readability, and SEO checks are run; results appear as simple checkmarks.">
            <div className="text-sm text-[var(--color-text-secondary)]">&#x2705; Grammar &#x2705; Readability &#x2705; SEO</div>
          </WorkflowStage>
          <WorkflowStage number={5} title="Publish" description="After human approval, the article is sent to the configured CMS destination.">
            <div className="text-sm text-[var(--color-text-secondary)]">Supported: WordPress, Ghost (conceptual).</div>
          </WorkflowStage>
        </div>
      </section>

      {/* Article preview section */}
      <section id="features" className="px-6 py-12 bg-[var(--color-bg-subtle)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <h2 className="text-2xl font-serif text-[var(--color-text)]">From a rough idea to a considered first draft.</h2>
            <p className="text-[var(--color-text-secondary)] max-w-prose">
              The editor shows the article title, heading hierarchy, excerpt, and a quick review panel - all within a clean, paper-like interface.
            </p>
          </div>
          <EditorialPreview />
        </div>
      </section>

      {/* Human control section */}
      <section id="creators" className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-serif text-[var(--color-text)] mb-4">Automation should move the work forward, not take the editor out of it.</h2>
        <p className="text-[var(--color-text-secondary)] max-w-prose">
          Let automation handle repetitive steps while you retain control over what gets approved and published.
        </p>
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          <div className="bg-[var(--color-surface)] p-4 rounded border border-[var(--color-border)]">
            <h3 className="font-medium text-[var(--color-primary)] mb-2">Automated</h3>
            <ul className="list-disc list-inside text-sm text-[var(--color-text-secondary)]">
              <li>Topic discovery</li>
              <li>Research aggregation</li>
              <li>First-draft generation</li>
              <li>Quality checks</li>
            </ul>
          </div>
          <div className="bg-[var(--color-surface)] p-4 rounded border border-[var(--color-border)]">
            <h3 className="font-medium text-[var(--color-primary)] mb-2">Human decisions</h3>
            <ul className="list-disc list-inside text-sm text-[var(--color-text-secondary)]">
              <li>Review draft</li>
              <li>Edit content</li>
              <li>Approve publication</li>
              <li>Choose destination</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Publishing destination */}
      <section className="px-6 py-12 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-serif text-[var(--color-text)] mb-4">Finish the work where your audience reads it.</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Approved articles can be sent directly to your CMS. Currently supported integrations include WordPress.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-surface)] rounded-md">
            WordPress integration
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-12 bg-[var(--color-primary)] text-[var(--color-surface)]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-serif">Your next article starts with an idea.</h2>
          <p className="text-sm">Bring your research, drafting, review, and publishing workflow together in BlogFlow AI.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/generator" className="px-5 py-2 bg-[var(--color-accent)] text-[var(--color-text)] rounded-md hover:bg-[var(--color-accent-light)]">
              Start creating
            </Link>
            <a href="#workflow" className="px-5 py-2 bg-[var(--color-surface)] text-[var(--color-primary)] rounded-md hover:bg-[var(--color-bg-subtle)]">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg)]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-serif text-[var(--color-text)] mb-2">BlogFlow AI</h3>
            <p>AI-assisted content research, drafting and publishing in one editorial studio.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-[var(--color-text)]">Product</h4>
            <ul className="space-y-1">
              <li><a href="#product" className="hover:text-[var(--color-primary)]">Product</a></li>
              <li><a href="#workflow" className="hover:text-[var(--color-primary)]">Workflow</a></li>
              <li><a href="#features" className="hover:text-[var(--color-primary)]">Features</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-[var(--color-text)]">Account</h4>
            <ul className="space-y-1">
              <li><Link href="/login" className="hover:text-[var(--color-primary)]">Sign in</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
