import { NextRequest, NextResponse } from 'next/server';
import { blogGenerationService } from '@/services/content/blog-generation.service';
import { ApiResponse, StructuredBlogOutput } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.topic || !body.websiteId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Topic and websiteId are required to generate an article.' },
        { status: 400 }
      );
    }

    const blogOutput = await blogGenerationService.generateCompleteBlog(
      {
        websiteId: body.websiteId,
        researchId: body.researchId,
        topic: body.topic,
        category: body.category || 'General',
        targetAudience: body.targetAudience || 'General Audience',
        tone: body.tone || 'professional',
        articleLength: body.articleLength || 'medium',
        primaryKeywords: body.primaryKeywords || [body.topic],
        secondaryKeywords: body.secondaryKeywords || [],
        instructions: body.instructions || '',
      },
      body.researchReport,
      body.jobId
    );

    return NextResponse.json<ApiResponse<StructuredBlogOutput>>({
      success: true,
      data: blogOutput,
      message: 'Article successfully drafted with Gemini AI.',
    });
  } catch (error: any) {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Blog generation failed.' },
      { status: 500 }
    );
  }
}
