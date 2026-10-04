import { NextRequest, NextResponse } from 'next/server';
import { DbBlogService } from '@/services/db/blog.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const websiteId = searchParams.get('websiteId') || undefined;

    const data = await DbBlogService.getBlogs({
      search,
      status,
      websiteId,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      websiteId,
      title,
      subtitle,
      slug,
      content,
      introduction,
      conclusion,
      faqs,
      metaTitle,
      metaDescription,
      focusKeyword,
      secondaryKeywords,
      tags,
      category,
      estimatedReadingTime,
      status,
      researchReportId,
    } = body;

    if (!websiteId || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: websiteId, title, content' },
        { status: 400 }
      );
    }

    const blog = await DbBlogService.createBlog({
      websiteId,
      title,
      subtitle,
      slug,
      content,
      introduction,
      conclusion,
      faqs,
      metaTitle,
      metaDescription,
      focusKeyword,
      secondaryKeywords,
      tags,
      category,
      estimatedReadingTime: estimatedReadingTime || 5,
      status: status || 'DRAFT',
      researchReportId,
    });

    return NextResponse.json({
      success: true,
      message: 'Article successfully saved to PostgreSQL database.',
      data: blog,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

