import { NextRequest, NextResponse } from 'next/server';
import { WordPressService } from '@/services/cms/wordpress.service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteUrl, username, applicationPassword, integrationId } = body;

    let authConfig;

    if (integrationId) {
      const integration = await prisma.cMSIntegration.findUnique({
        where: { id: integrationId },
      });
      if (!integration) {
        return NextResponse.json({ success: false, error: 'Integration not found' }, { status: 404 });
      }
      authConfig = {
        siteUrl: integration.cmsUrl,
        username: integration.username,
        encryptedCredentials: integration.encryptedCredentials,
      };
    } else {
      if (!siteUrl || !username || !applicationPassword) {
        return NextResponse.json(
          { success: false, error: 'siteUrl, username, and applicationPassword are required.' },
          { status: 400 }
        );
      }
      authConfig = { siteUrl, username, applicationPassword };
    }

    const result = await WordPressService.testConnection(authConfig);

    return NextResponse.json({
      success: result.success,
      data: result,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
