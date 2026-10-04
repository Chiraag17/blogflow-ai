import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptCredential } from '@/services/security/encryption.service';
import { WordPressService } from '@/services/cms/wordpress.service';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const userId = (await headers()).get('x-user-id');
    const where = userId ? { website: { userId } } : {};

    const integrations = await prisma.cMSIntegration.findMany({
      where,
      select: {
        id: true,
        websiteId: true,
        provider: true,
        cmsUrl: true,
        username: true,
        connectionStatus: true,
        lastConnectedAt: true,
        createdAt: true,
        website: { select: { id: true, name: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: integrations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = (await headers()).get('x-user-id');
    const body = await req.json();
    const { websiteId, cmsUrl, username, applicationPassword } = body;

    if (!websiteId || !cmsUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: websiteId, cmsUrl, username, applicationPassword' },
        { status: 400 }
      );
    }

    // Validate URL format and protocol
    try {
      const parsedUrl = new URL(cmsUrl.trim());
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { success: false, error: 'Invalid URL protocol. Please enter a valid http:// or https:// WordPress URL.' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid WordPress site URL. Please enter a complete, valid URL.' },
        { status: 400 }
      );
    }

    // Verify website exists and user owns it
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
    });

    if (!website) {
      return NextResponse.json({ success: false, error: 'Target website not found.' }, { status: 404 });
    }

    if (userId && website.userId && website.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this website.' }, { status: 403 });
    }

    // 1. Test WordPress authentication and connection before storing
    const test = await WordPressService.testConnection({
      siteUrl: cmsUrl,
      username,
      applicationPassword,
    });

    if (!test.success) {
      return NextResponse.json(
        { success: false, error: `WordPress verification failed: ${test.error}` },
        { status: 400 }
      );
    }

    // 2. Encrypt credentials at rest using AES-256-GCM
    const encryptedCredentials = encryptCredential(applicationPassword);

    // 3. Upsert CMSIntegration record
    const integration = await prisma.cMSIntegration.create({
      data: {
        websiteId,
        provider: 'WORDPRESS',
        cmsUrl: WordPressService.normalizeUrl(cmsUrl),
        username,
        encryptedCredentials,
        connectionStatus: 'CONNECTED',
        lastConnectedAt: new Date(),
      },
      select: {
        id: true,
        websiteId: true,
        provider: true,
        cmsUrl: true,
        username: true,
        connectionStatus: true,
        lastConnectedAt: true,
        createdAt: true,
        website: { select: { id: true, name: true, url: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WordPress website connected and verified successfully!',
      data: integration,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
