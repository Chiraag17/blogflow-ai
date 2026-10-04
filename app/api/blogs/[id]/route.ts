import { NextRequest, NextResponse } from 'next/server';
import { DbBlogService } from '@/services/db/blog.service';
import { countWords, calculateReadingTime } from '@/lib/utils';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const blog = await DbBlogService.getBlogById(id);

    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existingBlog = await DbBlogService.getBlogById(id);
    if (!existingBlog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    // Check user ownership if authenticated userId is available
    const userId = (await headers()).get('x-user-id');
    if (userId && existingBlog.website?.userId && existingBlog.website.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not own this website' }, { status: 403 });
    }

    const content = body.content !== undefined ? body.content : existingBlog.content;
    const readingTime = content ? calculateReadingTime(content) : existingBlog.estimatedReadingTime;

    const updatedBlog = await DbBlogService.updateBlog(id, {
      title: body.title !== undefined ? body.title : existingBlog.title,
      subtitle: body.subtitle !== undefined ? body.subtitle : existingBlog.subtitle,
      slug: body.slug !== undefined ? body.slug : existingBlog.slug,
      content,
      introduction: body.introduction !== undefined ? body.introduction : existingBlog.introduction,
      conclusion: body.conclusion !== undefined ? body.conclusion : existingBlog.conclusion,
      faqs: body.faqs !== undefined ? body.faqs : (existingBlog.faqs as any),
      metaTitle: body.metaTitle !== undefined ? body.metaTitle : existingBlog.metaTitle,
      metaDescription: body.metaDescription !== undefined ? body.metaDescription : existingBlog.metaDescription,
      focusKeyword: body.focusKeyword !== undefined ? body.focusKeyword : existingBlog.focusKeyword,
      secondaryKeywords: body.secondaryKeywords !== undefined ? body.secondaryKeywords : (existingBlog.secondaryKeywords as any),
      tags: body.tags !== undefined ? body.tags : (existingBlog.tags as any),
      category: body.category !== undefined ? body.category : existingBlog.category,
      estimatedReadingTime: readingTime,
      status: body.status !== undefined ? body.status : existingBlog.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully in PostgreSQL.',
      data: updatedBlog,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
