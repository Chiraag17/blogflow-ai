import { NextRequest, NextResponse } from 'next/server';
import { seoAnalysisService, SeoAnalysisResult } from '@/services/content/seo-analysis.service';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const blog = await req.json();

    if (!blog.content && !blog.title) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Article content or title is required for SEO analysis.' },
        { status: 400 }
      );
    }

    const result = await seoAnalysisService.analyzeSeo(blog);

    return NextResponse.json<ApiResponse<SeoAnalysisResult>>({
      success: true,
      data: result,
      message: 'SEO health analysis completed.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'SEO analysis failed.' },
      { status: 500 }
    );
  }
}
