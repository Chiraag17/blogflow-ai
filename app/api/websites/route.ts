import { NextRequest, NextResponse } from 'next/server';
import { DbWebsiteService } from '@/services/db/website.service';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET() {
  try {
    let userId = (await headers()).get('x-user-id') || undefined;
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = (session?.user as any)?.id;
    }

    const websites = await DbWebsiteService.getWebsites(userId);
    return NextResponse.json({ success: true, data: websites });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let userId = (await headers()).get('x-user-id') || undefined;
    if (!userId) {
      const session = await getServerSession(authOptions);
      userId = (session?.user as any)?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to connect and manage websites.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, url, niche, targetAudience, writingTone, preferredKeywords, excludedTopics, websiteContext } = body;

    if (!name || !url || !niche || !targetAudience || !writingTone) {
      return NextResponse.json(
        { success: false, error: 'Missing required website configuration fields (name, url, niche, targetAudience, writingTone).' },
        { status: 400 }
      );
    }

    const website = await DbWebsiteService.createWebsite({
      userId,
      name,
      url,
      niche,
      targetAudience,
      writingTone,
      preferredKeywords,
      excludedTopics,
      websiteContext,
    });

    return NextResponse.json({
      success: true,
      message: 'Website connected and registered in database.',
      data: website,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
