'use client';

import { useState } from 'react';
import {
  Zap, Plus, Play, Pause, Clock, Calendar, CheckCircle2,
  AlertCircle, ShieldCheck, Settings2, Sparkles, Globe, Trash2,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AutomationRule, AutomationStatus } from '@/types';
import { formatDate, cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AutomationPage() {
  const websites = useAppStore((s) => s.websites);
  const automationRules = useAppStore((s) => s.automationRules);
  const updateAutomationRule = useAppStore((s) => s.updateAutomationRule);

  const [rules, setRules] = useState<AutomationRule[]>(automationRules);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Rule Form State
  const [newRule, setNewRule] = useState({
    websiteId: websites[0]?.id || '',
    researchFrequency: 'weekly',
    generationFrequency: 'weekly',
    preferredDays: ['Monday', 'Thursday'],
    publishingTime: '09:00',
    maxBlogsPerWeek: 3,
    requireApproval: true,
  });

  const handleToggleStatus = (ruleId: string, currentStatus: AutomationStatus) => {
    const nextStatus: AutomationStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateAutomationRule(ruleId, { status: nextStatus });
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, status: nextStatus } : r))
    );
    showToast(`Pipeline set to ${nextStatus}`);
  };

  const handleToggleApproval = (ruleId: string, currentVal: boolean) => {
    updateAutomationRule(ruleId, { requireApproval: !currentVal });
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, requireApproval: !currentVal } : r))
    );
    showToast(
      !currentVal
        ? 'Human approval checkpoint enabled for this rule'
        : 'Autonomous auto-publishing enabled'
    );
  };

  const handleTriggerRun = (rule: AutomationRule) => {
    setTriggeringId(rule.id);
    setTimeout(() => {
      setTriggeringId(null);
      showToast(`Autonomous pipeline triggered for ${rule.websiteName}! Research & drafting queued.`);
    }, 1500);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSite = websites.find((w) => w.id === newRule.websiteId);
    if (!targetSite) return;

    const createdRule: AutomationRule = {
      id: `auto-${Date.now()}`,
      websiteId: targetSite.id,
      websiteName: targetSite.name,
      researchFrequency: newRule.researchFrequency,
      generationFrequency: newRule.generationFrequency,
      preferredDays: newRule.preferredDays,
      publishingTime: newRule.publishingTime,
      maxBlogsPerWeek: newRule.maxBlogsPerWeek,
      requireApproval: newRule.requireApproval,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setRules((prev) => [...prev, createdRule]);
    setShowCreateModal(false);
    showToast(`Autonomous rule created for ${targetSite.name}`);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-sm rounded-xl shadow-xl animate-slide-up border border-slate-700">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap size={22} className="text-indigo-600" />
            Autonomous Content Pipelines
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configure automated scheduling, research cadence, and publishing workflows per website.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus size={16} /> New Pipeline Rule
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
        <Sparkles size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-semibold">Autonomous Lifecycle Architecture:</strong> When active,
          BlogFlow automatically initiates web topic research via Tavily, drafts SEO articles with Gemini,
          runs quality verification, and places posts in the Human Approval Center before pushing to your CMS.
        </div>
      </div>

      {/* Automation Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className="card space-y-5 border-[var(--color-border)] hover:border-indigo-200 transition-all">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Globe size={15} className="text-[var(--color-text-muted)]" />
                  <h3 className="font-bold text-base text-[var(--color-text)]">{rule.websiteName}</h3>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Rule ID: {rule.id} • Created {formatDate(rule.createdAt)}
                </p>
              </div>

              <span
                className={cn(
                  'badge text-xs font-semibold px-2.5 py-1',
                  rule.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                )}
              >
                {rule.status === 'active' ? '● Active Pipeline' : '○ Paused'}
              </span>
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[var(--color-bg-subtle)] text-xs">
              <div>
                <span className="text-[var(--color-text-muted)] block mb-0.5">Research Cadence</span>
                <span className="font-semibold capitalize text-[var(--color-text)]">{rule.researchFrequency}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block mb-0.5">Generation Cadence</span>
                <span className="font-semibold capitalize text-[var(--color-text)]">{rule.generationFrequency.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block mb-0.5">Publishing Slot</span>
                <span className="font-semibold text-[var(--color-text)]">{rule.publishingTime} UTC</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)] block mb-0.5">Weekly Cap</span>
                <span className="font-semibold text-[var(--color-text)]">{rule.maxBlogsPerWeek} articles/wk</span>
              </div>
            </div>

            {/* Preferred Days */}
            <div>
              <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Active Generation Days
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = rule.preferredDays.includes(day);
                  return (
                    <span
                      key={day}
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-md font-medium',
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {day.slice(0, 3)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Human in the loop toggle */}
            <div className="p-3 rounded-lg border border-[var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className={rule.requireApproval ? 'text-indigo-600' : 'text-slate-400'} />
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text)]">Human Approval Checkpoint</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {rule.requireApproval ? 'Articles require review before publishing' : 'Auto-publish directly once quality passes'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={rule.requireApproval}
                onChange={() => handleToggleApproval(rule.id, rule.requireApproval)}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
              <button
                onClick={() => handleToggleStatus(rule.id, rule.status)}
                className="btn btn-secondary text-xs"
              >
                {rule.status === 'active' ? (
                  <>
                    <Pause size={14} /> Pause Pipeline
                  </>
                ) : (
                  <>
                    <Play size={14} /> Resume Pipeline
                  </>
                )}
              </button>

              <button
                onClick={() => handleTriggerRun(rule)}
                disabled={triggeringId === rule.id}
                className="btn btn-primary text-xs"
              >
                <Sparkles size={14} className={cn(triggeringId === rule.id && 'animate-spin')} />
                {triggeringId === rule.id ? 'Executing Cycle...' : 'Run Pipeline Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-indigo-600" />
              Create Automation Pipeline
            </h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Target Website</label>
                <select
                  className="form-select"
                  value={newRule.websiteId}
                  onChange={(e) => setNewRule({ ...newRule, websiteId: e.target.value })}
                  required
                >
                  {websites.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Research Cadence</label>
                  <select
                    className="form-select"
                    value={newRule.researchFrequency}
                    onChange={(e) => setNewRule({ ...newRule, researchFrequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Generation Cadence</label>
                  <select
                    className="form-select"
                    value={newRule.generationFrequency}
                    onChange={(e) => setNewRule({ ...newRule, generationFrequency: e.target.value })}
                  >
                    <option value="daily">Daily</option>
                    <option value="twice_weekly">Twice a week</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Publishing Time (UTC)</label>
                  <input
                    type="time"
                    className="form-input"
                    value={newRule.publishingTime}
                    onChange={(e) => setNewRule({ ...newRule, publishingTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Blogs Per Week</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="form-input"
                    value={newRule.maxBlogsPerWeek}
                    onChange={(e) => setNewRule({ ...newRule, maxBlogsPerWeek: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Active Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = newRule.preferredDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => {
                          const updated = isSelected
                            ? newRule.preferredDays.filter((d) => d !== day)
                            : [...newRule.preferredDays, day];
                          setNewRule({ ...newRule, preferredDays: updated });
                        }}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-md border font-medium transition-all',
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="reqAppr"
                  checked={newRule.requireApproval}
                  onChange={(e) => setNewRule({ ...newRule, requireApproval: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
                <label htmlFor="reqAppr" className="text-xs font-semibold cursor-pointer">
                  Require human approval before publishing
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Create Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
