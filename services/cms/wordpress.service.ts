import { decryptCredential } from '../security/encryption.service';
import { prisma } from '@/lib/prisma';

export interface WordPressAuth {
  siteUrl: string;
  username: string;
  applicationPassword?: string;
  encryptedCredentials?: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface WordPressPostPayload {
  title: string;
  content: string;
  slug?: string;
  status: 'draft' | 'publish' | 'future';
  date?: string; // ISO 8601 for scheduled
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
}

export interface WordPressPublishResult {
  success: boolean;
  externalPostId?: string;
  publishedUrl?: string;
  status?: string;
  error?: string;
  isDuplicate?: boolean;
}

export class WordPressService {
  /**
   * Normalizes WordPress site URL to remove trailing slashes.
   */
  public static normalizeUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
  }

  /**
   * Constructs standard Basic Auth header from username and application password.
   */
  public static getBasicAuthHeader(username: string, password: string): string {
    const cleanPassword = password.replace(/\s+/g, ''); // WordPress app passwords often have spaces
    const token = Buffer.from(`${username}:${cleanPassword}`).toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Resolves plain password from either direct password or encrypted credentials.
   */
  public static resolvePassword(auth: WordPressAuth): string {
    if (auth.applicationPassword) {
      return auth.applicationPassword;
    }
    if (auth.encryptedCredentials) {
      return decryptCredential(auth.encryptedCredentials);
    }
    throw new Error('No password or encrypted credentials provided for WordPress authentication.');
  }

  /**
   * Verifies WordPress connection by requesting /wp-json/wp/v2/users/me.
   */
  public static async testConnection(auth: WordPressAuth): Promise<{
    success: boolean;
    user?: { id: number; name: string; slug: string };
    siteName?: string;
    error?: string;
  }> {
    try {
      const normalizedUrl = this.normalizeUrl(auth.siteUrl);
      const password = this.resolvePassword(auth);
      const authHeader = this.getBasicAuthHeader(auth.username, password);

      const endpoint = `${normalizedUrl}/wp-json/wp/v2/users/me?context=edit`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'User-Agent': 'BlogFlow-AI/1.0',
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            success: false,
            error: 'Authentication failed. Please verify your WordPress username and Application Password.',
          };
        }
        return {
          success: false,
          error: `WordPress API responded with HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const userData = await res.json();
      return {
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          slug: userData.slug,
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Could not reach WordPress site: ${message}`,
      };
    }
  }

  /**
   * Retrieves list of categories from WordPress.
   */
  public static async getCategories(auth: WordPressAuth): Promise<WordPressCategory[]> {
    const normalizedUrl = this.normalizeUrl(auth.siteUrl);
    const password = this.resolvePassword(auth);
    const authHeader = this.getBasicAuthHeader(auth.username, password);

    const endpoint = `${normalizedUrl}/wp-json/wp/v2/categories?per_page=100`;
    const res = await fetch(endpoint, {
      headers: { Authorization: authHeader, 'User-Agent': 'BlogFlow-AI/1.0' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch WordPress categories: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count,
    }));
  }

  /**
   * Retrieves list of tags from WordPress.
   */
  public static async getTags(auth: WordPressAuth): Promise<WordPressTag[]> {
    const normalizedUrl = this.normalizeUrl(auth.siteUrl);
    const password = this.resolvePassword(auth);
    const authHeader = this.getBasicAuthHeader(auth.username, password);

    const endpoint = `${normalizedUrl}/wp-json/wp/v2/tags?per_page=100`;
    const res = await fetch(endpoint, {
      headers: { Authorization: authHeader, 'User-Agent': 'BlogFlow-AI/1.0' },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch WordPress tags: HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      count: t.count,
    }));
  }

  /**
   * Idempotency Check: Verifies whether an external post with this slug or blog ID already exists.
   */
  public static async findExistingPost(
    auth: WordPressAuth,
    slug: string
  ): Promise<{ exists: boolean; postId?: number; link?: string }> {
    try {
      const normalizedUrl = this.normalizeUrl(auth.siteUrl);
      const password = this.resolvePassword(auth);
      const authHeader = this.getBasicAuthHeader(auth.username, password);

      const endpoint = `${normalizedUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=any`;
      const res = await fetch(endpoint, {
        headers: { Authorization: authHeader, 'User-Agent': 'BlogFlow-AI/1.0' },
      });

      if (res.ok) {
        const posts = await res.json();
        if (Array.isArray(posts) && posts.length > 0) {
          return {
            exists: true,
            postId: posts[0].id,
            link: posts[0].link,
          };
        }
      }
    } catch {
      // In case of check error, fallback safely
    }
    return { exists: false };
  }

  /**
   * Publishes or schedules an article to WordPress.
   * Strictly enforces PostgreSQL approval verification before proceeding.
   */
  public static async publishPost(params: {
    blogId: string;
    integrationId: string;
    publishMode: 'publish' | 'draft' | 'schedule';
    scheduledDate?: string;
  }): Promise<WordPressPublishResult> {
    const { blogId, integrationId, publishMode, scheduledDate } = params;

    // 1. Verify in database: blog existence, approval status, and CMS integration
    let blog;
    try {
      blog = await prisma.blog.findUnique({
        where: { id: blogId },
        include: {
          approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
          publishingRecords: { where: { integrationId } },
        },
      });
    } catch (dbErr: any) {
      return {
        success: false,
        error: `Database check failed: unable to verify human approval status in PostgreSQL (${dbErr.message}).`,
      };
    }

    if (!blog) {
      return { success: false, error: `Blog not found with ID ${blogId}` };
    }

    const latestApproval = blog.approvals[0];
    const isApproved =
      blog.status === 'APPROVED' ||
      blog.status === 'SCHEDULED' ||
      latestApproval?.status === 'APPROVED';

    // Strict security check: blog MUST be approved by human reviewer in PostgreSQL
    if (!isApproved) {
      return {
        success: false,
        error: 'Publishing rejected: Article has not been approved by a human reviewer in the Approval Center.',
      };
    }

    // 2. Retrieve CMS integration credentials
    const integration = await prisma.cMSIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || integration.connectionStatus !== 'CONNECTED') {
      return { success: false, error: 'WordPress CMS integration is inactive or not found.' };
    }

    const auth: WordPressAuth = {
      siteUrl: integration.cmsUrl,
      username: integration.username,
      encryptedCredentials: integration.encryptedCredentials,
    };

    // 3. Idempotency Check: check if already published in DB
    const existingDbRecord = blog.publishingRecords[0];
    if (existingDbRecord && existingDbRecord.publishingStatus === 'PUBLISHED' && existingDbRecord.externalPostId) {
      return {
        success: true,
        isDuplicate: true,
        externalPostId: existingDbRecord.externalPostId,
        publishedUrl: existingDbRecord.publishedUrl || undefined,
        status: 'already_published',
      };
    }

    // 4. Remote Idempotency Check: check WordPress if slug already exists
    const remoteCheck = await this.findExistingPost(auth, blog.slug);
    if (remoteCheck.exists && remoteCheck.postId) {
      // Record already exists on WordPress, link it in DB without creating a duplicate
      await prisma.publishingRecord.upsert({
        where: {
          blogId_integrationId: { blogId, integrationId },
        },
        create: {
          blogId,
          integrationId,
          externalPostId: String(remoteCheck.postId),
          publishedUrl: remoteCheck.link,
          publishingStatus: 'PUBLISHED',
          publishedAt: new Date(),
        },
        update: {
          externalPostId: String(remoteCheck.postId),
          publishedUrl: remoteCheck.link,
          publishingStatus: 'PUBLISHED',
          publishedAt: new Date(),
          errorMessage: null,
        },
      });

      await prisma.blog.update({
        where: { id: blogId },
        data: { status: 'PUBLISHED' },
      });

      return {
        success: true,
        isDuplicate: true,
        externalPostId: String(remoteCheck.postId),
        publishedUrl: remoteCheck.link,
        status: 'published',
      };
    }

    // 5. Construct payload
    let postStatus: 'draft' | 'publish' | 'future' = 'draft';
    if (publishMode === 'publish') postStatus = 'publish';
    if (publishMode === 'schedule') postStatus = 'future';

    const payload: WordPressPostPayload = {
      title: blog.title,
      content: blog.content,
      slug: blog.slug,
      status: postStatus,
      excerpt: blog.metaDescription || undefined,
    };

    if (postStatus === 'future' && scheduledDate) {
      payload.date = new Date(scheduledDate).toISOString();
    }

    // 6. Make server-side POST request to WordPress REST API
    try {
      const normalizedUrl = this.normalizeUrl(auth.siteUrl);
      const password = this.resolvePassword(auth);
      const authHeader = this.getBasicAuthHeader(auth.username, password);

      const endpoint = `${normalizedUrl}/wp-json/wp/v2/posts`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'BlogFlow-AI/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        const errMessage = `WordPress error (HTTP ${res.status}): ${errorText.slice(0, 300)}`;

        await prisma.publishingRecord.upsert({
          where: {
            blogId_integrationId: { blogId, integrationId },
          },
          create: {
            blogId,
            integrationId,
            publishingStatus: 'FAILED',
            errorMessage: errMessage,
          },
          update: {
            publishingStatus: 'FAILED',
            errorMessage: errMessage,
          },
        });

        return { success: false, error: errMessage };
      }

      const postData = await res.json();
      const externalId = String(postData.id);
      const postUrl = postData.link || `${normalizedUrl}/?p=${externalId}`;
      const finalStatus = postStatus === 'future' ? 'SCHEDULED' : postStatus === 'publish' ? 'PUBLISHED' : 'PENDING';

      // 7. Update PostgreSQL records
      await prisma.publishingRecord.upsert({
        where: {
          blogId_integrationId: { blogId, integrationId },
        },
        create: {
          blogId,
          integrationId,
          externalPostId: externalId,
          publishedUrl: postUrl,
          publishingStatus: finalStatus === 'PUBLISHED' ? 'PUBLISHED' : finalStatus === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
          publishedAt: new Date(),
          scheduledAt: finalStatus === 'SCHEDULED' && scheduledDate ? new Date(scheduledDate) : null,
        },
        update: {
          externalPostId: externalId,
          publishedUrl: postUrl,
          publishingStatus: finalStatus === 'PUBLISHED' ? 'PUBLISHED' : finalStatus === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
          publishedAt: new Date(),
          scheduledAt: finalStatus === 'SCHEDULED' && scheduledDate ? new Date(scheduledDate) : null,
          errorMessage: null,
        },
      });

      await prisma.blog.update({
        where: { id: blogId },
        data: {
          status: finalStatus === 'PUBLISHED' ? 'PUBLISHED' : finalStatus === 'SCHEDULED' ? 'SCHEDULED' : 'APPROVED',
        },
      });

      return {
        success: true,
        externalPostId: externalId,
        publishedUrl: postUrl,
        status: postStatus,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Publishing network error: ${message}` };
    }
  }
}
