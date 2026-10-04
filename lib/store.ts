// ============================================================
// BlogFlow AI - Global State Store (Zustand)
// Uses in-memory mock data. Data access is abstracted so
// PostgreSQL can replace this store in the next phase.
// ============================================================

import { create } from 'zustand';
import {
  Website, Research, Blog, QualityReport, Approval,
  Integration, AutomationRule, BlogStatus, ApprovalStatus,
} from '@/types';
import {
  DEMO_WEBSITES, DEMO_RESEARCH, DEMO_BLOGS,
  DEMO_QUALITY_REPORTS, DEMO_APPROVALS, DEMO_INTEGRATIONS,
  DEMO_AUTOMATION_RULES,
} from '@/lib/mock-data';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  // --- Data ---
  websites: Website[];
  research: Research[];
  blogs: Blog[];
  qualityReports: QualityReport[];
  approvals: Approval[];
  integrations: Integration[];
  automationRules: AutomationRule[];

  // --- UI State ---
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;

  // --- Website Actions ---
  addWebsite: (w: Omit<Website, 'id' | 'userId' | 'connectionStatus' | 'blogsGenerated' | 'lastActivity' | 'createdAt' | 'updatedAt'>) => Website;
  updateWebsite: (id: string, data: Partial<Website>) => void;
  deleteWebsite: (id: string) => void;

  // --- Research Actions ---
  addResearch: (r: Omit<Research, 'id' | 'discoveredTopics' | 'status' | 'createdAt' | 'updatedAt'>) => Research;

  // --- Blog Actions ---
  addBlog: (b: Omit<Blog, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Blog;
  updateBlog: (id: string, data: Partial<Blog>) => void;
  deleteBlog: (id: string) => void;
  updateBlogStatus: (id: string, status: BlogStatus) => void;

  // --- Approval Actions ---
  addApproval: (blogId: string, blogTitle: string) => Approval;
  updateApprovalStatus: (id: string, status: ApprovalStatus, comment?: string) => void;

  // --- Quality Report Actions ---
  addQualityReport: (qr: QualityReport) => void;

  // --- Integration Actions ---
  addIntegration: (i: Omit<Integration, 'id' | 'createdAt'>) => Integration;
  removeIntegration: (id: string) => void;

  // --- Automation Actions ---
  updateAutomationRule: (id: string, data: Partial<AutomationRule>) => void;
}

const now = () => new Date().toISOString();

export const useAppStore = create<AppState>((set, get) => ({
  // Initialize with demo data
  websites: DEMO_WEBSITES,
  research: DEMO_RESEARCH,
  blogs: DEMO_BLOGS,
  qualityReports: DEMO_QUALITY_REPORTS,
  approvals: DEMO_APPROVALS,
  integrations: DEMO_INTEGRATIONS,
  automationRules: DEMO_AUTOMATION_RULES,

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  // --- Website ---
  addWebsite: (w) => {
    const website: Website = {
      ...w,
      id: uuidv4(),
      userId: 'user-1',
      connectionStatus: 'pending',
      blogsGenerated: 0,
      lastActivity: now(),
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ websites: [...s.websites, website] }));
    return website;
  },
  updateWebsite: (id, data) =>
    set((s) => ({
      websites: s.websites.map((w) =>
        w.id === id ? { ...w, ...data, updatedAt: now() } : w
      ),
    })),
  deleteWebsite: (id) =>
    set((s) => ({ websites: s.websites.filter((w) => w.id !== id) })),

  // --- Research ---
  addResearch: (r) => {
    const research: Research = {
      ...r,
      id: uuidv4(),
      discoveredTopics: [],
      status: 'pending',
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ research: [...s.research, research] }));
    return research;
  },

  // --- Blog ---
  addBlog: (b) => {
    const blog: Blog = {
      ...b,
      id: uuidv4(),
      status: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    set((s) => ({ blogs: [...s.blogs, blog] }));
    return blog;
  },
  updateBlog: (id, data) =>
    set((s) => ({
      blogs: s.blogs.map((b) =>
        b.id === id ? { ...b, ...data, updatedAt: now() } : b
      ),
    })),
  deleteBlog: (id) =>
    set((s) => ({ blogs: s.blogs.filter((b) => b.id !== id) })),
  updateBlogStatus: (id, status) =>
    set((s) => ({
      blogs: s.blogs.map((b) =>
        b.id === id ? { ...b, status, updatedAt: now() } : b
      ),
    })),

  // --- Approval ---
  addApproval: (blogId, blogTitle) => {
    const approval: Approval = {
      id: uuidv4(),
      blogId,
      blogTitle,
      status: 'pending',
      comments: [],
      createdAt: now(),
    };
    set((s) => ({ approvals: [...s.approvals, approval] }));
    return approval;
  },
  updateApprovalStatus: (id, status, comment) =>
    set((s) => ({
      approvals: s.approvals.map((a) => {
        if (a.id !== id) return a;
        const updated = {
          ...a,
          status,
          reviewerId: 'user-1',
          reviewerName: 'Alex Morgan',
          reviewedAt: now(),
        };
        if (comment) {
          updated.comments = [
            ...a.comments,
            {
              id: uuidv4(),
              userId: 'user-1',
              userName: 'Alex Morgan',
              comment,
              createdAt: now(),
            },
          ];
        }
        return updated;
      }),
    })),

  // --- Quality Report ---
  addQualityReport: (qr) =>
    set((s) => ({
      qualityReports: [
        ...s.qualityReports.filter((q) => q.blogId !== qr.blogId),
        qr,
      ],
    })),

  // --- Integration ---
  addIntegration: (i) => {
    const integration: Integration = { ...i, id: uuidv4(), createdAt: now() };
    set((s) => ({ integrations: [...s.integrations, integration] }));
    return integration;
  },
  removeIntegration: (id) =>
    set((s) => ({ integrations: s.integrations.filter((i) => i.id !== id) })),

  // --- Automation ---
  updateAutomationRule: (id, data) =>
    set((s) => ({
      automationRules: s.automationRules.map((r) =>
        r.id === id ? { ...r, ...data, updatedAt: now() } : r
      ),
    })),
}));
