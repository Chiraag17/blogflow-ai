import { prisma } from '@/lib/prisma';

export class DbWebsiteService {
  /**
   * Retrieves websites associated with the user, or all websites if no user filter specified.
   */
  public static async getWebsites(userId?: string) {
    try {
      return await prisma.website.findMany({
        where: userId ? { userId } : {},
        include: {
          cmsIntegrations: {
            select: {
              id: true,
              provider: true,
              cmsUrl: true,
              username: true,
              connectionStatus: true,
              lastConnectedAt: true,
            },
          },
          automationConfig: true,
          _count: {
            select: { blogs: true, researchReports: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[DbWebsiteService] Failed to fetch websites from database:', message);
      throw new Error(`Database error fetching websites: ${message}`);
    }
  }

  public static async getWebsiteById(id: string) {
    try {
      return await prisma.website.findUnique({
        where: { id },
        include: {
          cmsIntegrations: true,
          automationConfig: true,
          blogs: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[DbWebsiteService] Failed to fetch website ${id}:`, message);
      throw new Error(`Database error fetching website: ${message}`);
    }
  }

  public static async createWebsite(data: {
    userId?: string;
    name: string;
    url: string;
    niche: string;
    targetAudience: string;
    writingTone: string;
    preferredKeywords?: string[];
    excludedTopics?: string[];
    websiteContext?: any;
  }) {
    if (!data.userId) {
      throw new Error('Authenticated user ID is required to register a website.');
    }

    try {
      return await prisma.website.create({
        data: {
          userId: data.userId,
          name: data.name.trim(),
          url: data.url.trim(),
          niche: data.niche.trim(),
          targetAudience: data.targetAudience.trim(),
          writingTone: data.writingTone.trim(),
          preferredKeywords: data.preferredKeywords || [],
          excludedTopics: data.excludedTopics || [],
          websiteContext: data.websiteContext || null,
          connectionStatus: 'ACTIVE',
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[DbWebsiteService] Failed to create website in database:', message);
      throw new Error(`Database error creating website: ${message}`);
    }
  }

  public static async deleteWebsite(id: string) {
    try {
      return await prisma.website.delete({
        where: { id },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[DbWebsiteService] Failed to delete website ${id}:`, message);
      throw new Error(`Database error deleting website: ${message}`);
    }
  }
}
