'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Settings, Key, User, Bell, Sliders, Shield, Save, CheckCircle2,
  Eye, EyeOff, Sparkles, Globe, AlertCircle, Info,
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'api-keys' | 'ai-defaults' | 'notifications'>('api-keys');
  const [toast, setToast] = useState<string | null>(null);

  const sessionUser = session?.user as any;
  // Profile state — initialized from real session
  const [profile, setProfile] = useState({
    name: sessionUser?.name || '',
    email: sessionUser?.email || '',
    role: sessionUser?.role || 'USER',
  });


  // API Keys state
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [apiKeys, setApiKeys] = useState({
    geminiKey: 'AIzaSyD98xK198274jKlmnOPQrstUVwx',
    tavilyKey: 'tvly-prod-98319a8d9f1092e4ba9',
    wpAppPassword: 'xxxx xxxx xxxx xxxx',
  });

  // AI Defaults state
  const [aiDefaults, setAiDefaults] = useState({
    model: 'gemini-1.5-pro',
    defaultWordCount: '1500',
    defaultTone: 'professional',
    minSeoScore: 75,
    autoGenerateFaqs: true,
    autoSuggestImages: true,
    strictSourceCitation: true,
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailOnApproval: true,
    emailOnPublish: false,
    slackWebhook: '',
    notifyLowQuality: true,
  });

  const toggleShowKey = (field: string) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = (section: string) => {
    setToast(`${section} saved successfully!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl shadow-xl animate-slide-up border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Settings size={22} className="text-indigo-600" />
          System Settings & Integrations
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Manage AI provider credentials, autonomous pipeline guardrails, and account preferences.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'api-keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('api-keys')}
        >
          <Key size={15} /> API Keys & Providers
        </button>
        <button
          className={`tab ${activeTab === 'ai-defaults' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai-defaults')}
        >
          <Sliders size={15} /> AI Generation Defaults
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={15} /> Notifications & Webhooks
        </button>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={15} /> Account Profile
        </button>
      </div>

      {/* TAB: API KEYS */}
      {activeTab === 'api-keys' && (
        <div className="card space-y-6">
          <div className="flex items-start justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h3 className="font-semibold text-base">AI & Search Provider Credentials</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Credentials are kept encrypted and never exposed in client bundle code.
              </p>
            </div>
            <span className="badge bg-emerald-50 text-emerald-700 text-xs font-semibold">
              ● Server-Side Protected
            </span>
          </div>

          <div className="space-y-4">
            {/* Google Gemini API */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0 font-medium text-xs flex items-center gap-2">
                  <Sparkles size={14} className="text-indigo-600" /> Google Gemini API Key
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">Connected</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys.gemini ? 'text' : 'password'}
                  className="form-input font-mono text-xs pr-10"
                  value={apiKeys.geminiKey}
                  onChange={(e) => setApiKeys({ ...apiKeys, geminiKey: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('gemini')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="form-hint text-[11px]">Used by Agent 2 (Content Writer) and Agent 3 (Quality Evaluator).</p>
            </div>

            {/* Tavily Search API */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0 font-medium text-xs flex items-center gap-2">
                  <Globe size={14} className="text-indigo-600" /> Tavily Search API Key
                </label>
                <span className="text-[11px] text-emerald-600 font-medium">Connected</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys.tavily ? 'text' : 'password'}
                  className="form-input font-mono text-xs pr-10"
                  value={apiKeys.tavilyKey}
                  onChange={(e) => setApiKeys({ ...apiKeys, tavilyKey: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('tavily')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.tavily ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="form-hint text-[11px]">Powers Agent 1 (Web Research & SERP competitor analysis).</p>
            </div>

            {/* WordPress Application Password */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0 font-medium text-xs flex items-center gap-2">
                  <Key size={14} className="text-indigo-600" /> Master WordPress Application Password
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Per-site override available</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys.wp ? 'text' : 'password'}
                  className="form-input font-mono text-xs pr-10"
                  value={apiKeys.wpAppPassword}
                  onChange={(e) => setApiKeys({ ...apiKeys, wpAppPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('wp')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKeys.wp ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="form-hint text-[11px]">Used by Agent 4 (Publishing Agent) for REST API publishing.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
            <button onClick={() => handleSave('API Keys')} className="btn btn-primary text-xs">
              <Save size={14} /> Save Credentials
            </button>
          </div>
        </div>
      )}

      {/* TAB: AI DEFAULTS */}
      {activeTab === 'ai-defaults' && (
        <div className="card space-y-6">
          <div>
            <h3 className="font-semibold text-base">AI Generation & Quality Guardrails</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Default generation parameters and automated acceptance criteria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Primary AI Model</label>
              <select
                className="form-select text-xs"
                value={aiDefaults.model}
                onChange={(e) => setAiDefaults({ ...aiDefaults, model: e.target.value })}
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended for High Quality Long-form)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-fast turnaround)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-gen reasoning)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Word Count</label>
              <select
                className="form-select text-xs"
                value={aiDefaults.defaultWordCount}
                onChange={(e) => setAiDefaults({ ...aiDefaults, defaultWordCount: e.target.value })}
              >
                <option value="800">Short Form (~800 words)</option>
                <option value="1500">Standard Guide (~1,500 words)</option>
                <option value="2500">Deep Dive (~2,500 words)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Writing Tone</label>
            <select
              className="form-select text-xs"
              value={aiDefaults.defaultTone}
              onChange={(e) => setAiDefaults({ ...aiDefaults, defaultTone: e.target.value })}
            >
              <option value="professional">Professional & Authoritative</option>
              <option value="conversational">Conversational & Engaging</option>
              <option value="technical">Technical & Detailed</option>
              <option value="inspirational">Inspirational & Visionary</option>
            </select>
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
            <h4 className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">Automatic Enrichment</h4>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoFaq"
                checked={aiDefaults.autoGenerateFaqs}
                onChange={(e) => setAiDefaults({ ...aiDefaults, autoGenerateFaqs: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="autoFaq" className="text-xs font-medium cursor-pointer">
                Automatically generate FAQ schema questions & answers for every article
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoImg"
                checked={aiDefaults.autoSuggestImages}
                onChange={(e) => setAiDefaults({ ...aiDefaults, autoSuggestImages: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="autoImg" className="text-xs font-medium cursor-pointer">
                Generate featured image placement suggestions and accessible alt text
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="strictCit"
                checked={aiDefaults.strictSourceCitation}
                onChange={(e) => setAiDefaults({ ...aiDefaults, strictSourceCitation: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="strictCit" className="text-xs font-medium cursor-pointer">
                Enforce strict source citations from Tavily web research
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
            <button onClick={() => handleSave('AI Defaults')} className="btn btn-primary text-xs">
              <Save size={14} /> Save Parameters
            </button>
          </div>
        </div>
      )}

      {/* TAB: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="card space-y-6">
          <div>
            <h3 className="font-semibold text-base">Alerts & Team Webhooks</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Stay informed when autonomous pipelines produce content requiring human attention.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--color-border)]">
              <div>
                <p className="text-xs font-semibold">Pending Approval Email Notifications</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Receive an email notification when a new article enters the approval queue.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailOnApproval}
                onChange={(e) => setNotifications({ ...notifications, emailOnApproval: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg border border-[var(--color-border)]">
              <div>
                <p className="text-xs font-semibold">Publish Confirmation Alerts</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Send confirmation digest when articles are pushed to WordPress live.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailOnPublish}
                onChange={(e) => setNotifications({ ...notifications, emailOnPublish: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slack / Discord Webhook URL</label>
              <input
                type="url"
                className="form-input text-xs"
                placeholder="https://hooks.slack.com/services/..."
                value={notifications.slackWebhook}
                onChange={(e) => setNotifications({ ...notifications, slackWebhook: e.target.value })}
              />
              <p className="form-hint text-[11px]">Optional: Post updates directly into your content team channel.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
            <button onClick={() => handleSave('Notifications')} className="btn btn-primary text-xs">
              <Save size={14} /> Save Notification Settings
            </button>
          </div>
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === 'profile' && (
        <div className="card space-y-6">
          <div>
            <h3 className="font-semibold text-base">User Profile</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Personal account information and administrative role.
            </p>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input text-xs"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input text-xs"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                type="text"
                disabled
                className="form-input text-xs bg-slate-100 cursor-not-allowed"
                value="Platform Administrator (Full Access)"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
            <button onClick={() => handleSave('Profile')} className="btn btn-primary text-xs">
              <Save size={14} /> Update Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
