import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WordPressService } from '@/services/cms/wordpress.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.cMSIntegration.findUnique({
      where: { id },
    });

    if (!integration) {
      return NextResponse.json({ success: false, error: 'Integration not found' }, { status: 404 });
    }

    const categories = await WordPressService.getCategories({
      siteUrl: integration.cmsUrl,
      username: integration.username,
      encryptedCredentials: integration.encryptedCredentials,
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
